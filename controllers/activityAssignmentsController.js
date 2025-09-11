const mongoose = require('mongoose');
const ActivityAssignment = require('../models/ActivityAssignment');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { sendToTokens } = require('../utils/notifications');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ==================== POST /api/activity-assignments ====================
// Therapist assigns an activity to a child
exports.createAssignment = async (req, res) => {
  try {
    const { childId, activityId, dueDate, notes } = req.body;
    if (!isValidObjectId(childId) || !isValidObjectId(activityId)) {
      return res.status(400).json({ success: false, message: 'Invalid childId or activityId' });
    }

    // Permission: only therapist or superuser
    if (!(req.user.role === 'therapist' || req.user.role === 'superuser')) {
      return res.status(403).json({ success: false, message: 'Only therapist or superuser can assign' });
    }

    // Ensure activity exists
    const activity = await Activity.findById(activityId);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });

    // Ensure child exists
    const child = await User.findById(childId);
    if (!child || child.role !== 'child') return res.status(404).json({ success: false, message: 'Child user not found' });

    // Optionally ensure therapist is assigned to this child
    if (req.user.role === 'therapist') {
      const isAssigned = req.user.assignedPatients?.some((id) => id.toString() === childId.toString());
      if (!isAssigned) return res.status(403).json({ success: false, message: 'Therapist not assigned to this child' });
    }

    const assignment = await ActivityAssignment.create({
      childId,
      activityId,
      assignedBy: req.user._id,
      dueDate: dueDate || undefined,
      notes: notes || undefined,
      status: 'assigned',
      lastUpdatedBy: req.user._id
    });

    // Push notification to child devices (if any)
    try {
      const tokens = child.deviceTokens || [];
      if (tokens.length > 0) {
        await sendToTokens(tokens, {
          title: 'New Activity Assigned',
          body: 'Your therapist assigned a new activity. Tap to view.'
        }, {
          screen: 'ActivityDetail',
          activityId: String(activityId),
          assignmentId: String(assignment._id)
        });
      }
    } catch (e) {
      // Log and continue; do not fail the request due to push error
      console.warn('Assignment push failed:', e?.message || e);
    }

    return res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET /api/activity-assignments ====================
// List assignments by childId (therapist sees their patients; parent/child sees own; superuser sees any)
exports.listAssignments = async (req, res) => {
  try {
    const { childId, status } = req.query;
    if (!childId || !isValidObjectId(childId)) {
      return res.status(400).json({ success: false, message: 'childId query param is required' });
    }

    // Access control
    const child = await User.findById(childId);
    if (!child || child.role !== 'child') return res.status(404).json({ success: false, message: 'Child user not found' });

    if (req.user.role !== 'superuser') {
      const isOwner = req.user._id.toString() === childId.toString();
      const isTherapistAssigned = req.user.role === 'therapist' && req.user.assignedPatients?.some((id) => id.toString() === childId.toString());
      if (!isOwner && !isTherapistAssigned) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const filter = { childId };
    if (status) filter.status = status;

    const list = await ActivityAssignment.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: list });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== PUT /api/activity-assignments/:id ====================
// Update dueDate, notes, status, or progress (therapist assigned or superuser)
exports.updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    const assignment = await ActivityAssignment.findById(id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    // Permissions
    if (req.user.role !== 'superuser') {
      const isTherapist = req.user.role === 'therapist' && assignment.assignedBy.toString() === req.user._id.toString();
      if (!isTherapist) return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const allowed = ['dueDate', 'notes', 'status', 'progress'];
    allowed.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        assignment[key] = req.body[key];
      }
    });
    assignment.lastUpdatedBy = req.user._id;

    await assignment.save();
    return res.status(200).json({ success: true, data: assignment });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== POST /api/activity-assignments/:id/submit ====================
// Child/parent submits progress (e.g., completionPercent, score); therapist can also submit on behalf
exports.submitAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    const assignment = await ActivityAssignment.findById(id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    // Access: child (owner), parent (same user model if used), assigned therapist, or superuser
    const isChild = req.user._id.toString() === assignment.childId.toString();
    const isTherapist = req.user.role === 'therapist' && assignment.assignedBy.toString() === req.user._id.toString();
    if (!(req.user.role === 'superuser' || isChild || isTherapist)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { completionPercent, score, notesFromParent, notesFromTherapist, status } = req.body;
    if (completionPercent !== undefined) assignment.progress.completionPercent = completionPercent;
    if (score !== undefined) assignment.progress.score = score;
    if (notesFromParent !== undefined) assignment.progress.notesFromParent = notesFromParent;
    if (notesFromTherapist !== undefined) assignment.progress.notesFromTherapist = notesFromTherapist;
    if (status) assignment.status = status;
    assignment.progress.submittedAt = new Date();
    assignment.lastUpdatedBy = req.user._id;

    await assignment.save();
    return res.status(200).json({ success: true, data: assignment });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
