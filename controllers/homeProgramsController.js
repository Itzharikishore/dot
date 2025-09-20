const mongoose = require('mongoose');
const HomeProgram = require('../models/HomeProgram');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { sendToTokens } = require('../utils/notifications');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ==================== GET /api/home-programs/:childId ====================
// Returns latest active program for child (owner/assigned therapist/superuser)
exports.getByChild = async (req, res) => {
  try {
    const { childId } = req.params;
    if (!isValidObjectId(childId)) return res.status(400).json({ success: false, message: 'Invalid childId' });

    const child = await User.findById(childId);
    if (!child || child.role !== 'child') return res.status(404).json({ success: false, message: 'Child not found' });

    if (req.user.role !== 'superuser') {
      const isOwner = req.user._id.toString() === childId.toString();
      const isTherapistAssigned = req.user.role === 'therapist' && req.user.assignedPatients?.some(id => id.toString() === childId.toString());
      if (!isOwner && !isTherapistAssigned) return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const program = await HomeProgram.findOne({ childId, status: { $in: ['active','paused'] } }).sort({ createdAt: -1 });
    if (!program) return res.status(200).json({ success: true, data: null });

    return res.status(200).json({ success: true, data: program });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== POST /api/home-programs ====================
// Create new home program (therapist/superuser)
exports.createProgram = async (req, res) => {
  try {
    const { childId, title, description, items, startDate, endDate } = req.body;
    if (!isValidObjectId(childId)) return res.status(400).json({ success: false, message: 'Invalid childId' });

    if (!(req.user.role === 'therapist' || req.user.role === 'superuser')) {
      return res.status(403).json({ success: false, message: 'Only therapist or superuser can create programs' });
    }

    const child = await User.findById(childId);
    if (!child || child.role !== 'child') return res.status(404).json({ success: false, message: 'Child not found' });

    if (req.user.role === 'therapist') {
      const isAssigned = req.user.assignedPatients?.some(id => id.toString() === childId.toString());
      if (!isAssigned) return res.status(403).json({ success: false, message: 'Therapist not assigned to this child' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'items array is required' });
    }

    // Validate activity IDs
    const activityIds = items.map(i => i.activityId).filter(Boolean);
    const count = await Activity.countDocuments({ _id: { $in: activityIds } });
    if (count !== activityIds.length) {
      return res.status(400).json({ success: false, message: 'One or more activityId is invalid' });
    }

    const program = await HomeProgram.create({
      childId,
      assignedBy: req.user._id,
      title: title || '',
      description: description || '',
      items,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      lastUpdatedBy: req.user._id
    });

    // Optional push to child
    try {
      const tokens = child.deviceTokens || [];
      if (tokens.length) {
        await sendToTokens(tokens, {
          title: 'New Home Program Assigned',
          body: program.title ? program.title : 'A new home program is available.'
        }, {
          screen: 'HomeProgram',
          childId: String(childId),
          homeProgramId: String(program._id)
        });
      }
    } catch (e) { console.warn('HomeProgram push failed:', e?.message || e); }

    return res.status(201).json({ success: true, data: program });
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== PUT /api/home-programs/:id ====================
// Update metadata or items (therapist who created / superuser)
exports.updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const program = await HomeProgram.findById(id);
    if (!program) return res.status(404).json({ success: false, message: 'Home program not found' });

    if (req.user.role !== 'superuser' && program.assignedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const allowed = ['title','description','items','status','startDate','endDate'];
    allowed.forEach(k => {
      if (Object.prototype.hasOwnProperty.call(req.body, k)) program[k] = req.body[k];
    });
    program.lastUpdatedBy = req.user._id;

    await program.save();
    return res.status(200).json({ success: true, data: program });
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== POST /api/home-programs/:id/complete ====================
// Mark a program item as complete (child/therapist/superuser)
exports.completeItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId, score, notes } = req.body;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const program = await HomeProgram.findById(id);
    if (!program) return res.status(404).json({ success: false, message: 'Home program not found' });

    const isChild = req.user._id.toString() === program.childId.toString();
    const isTherapist = req.user.role === 'therapist' && program.assignedBy.toString() === req.user._id.toString();
    if (!(req.user.role === 'superuser' || isChild || isTherapist)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const item = program.items.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Program item not found' });

    item.completions.push({ completedAt: new Date(), score: score || undefined, notes: notes || undefined });
    item.status = 'in-progress';
    program.lastUpdatedBy = req.user._id;

    await program.save();
    return res.status(200).json({ success: true, data: program });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
