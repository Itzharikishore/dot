const mongoose = require('mongoose');
const Child = require('../models/childModel');

// ==================== Helpers ====================
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ==================== POST /api/children ====================
// Create a child profile owned by the authenticated user
// Body: { firstName, lastName, dateOfBirth, gender?, notes?, tags?, medical? }
// Returns: { success, data }
exports.createChild = async (req, res) => {
  try {
    const parentId = req.user._id;

    const payload = {
      parentId,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      profilePicture: req.body.profilePicture,
      notes: req.body.notes,
      tags: req.body.tags,
      medical: req.body.medical,
    };

    const child = await Child.create(payload);

    return res.status(201).json({ success: true, data: child });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET /api/children ====================
// Get all children for authenticated user (or all if superuser)
exports.getChildren = async (req, res) => {
  try {
    const filter = req.user.role === 'superuser' ? {} : { parentId: req.user._id };
    const children = await Child.find(filter).sort({ lastName: 1, firstName: 1 });
    return res.status(200).json({ success: true, data: children });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET /api/children/:id ====================
// Get a single child owned by the user (or any if superuser)
exports.getChildById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const child = await Child.findById(id);
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' });

    if (req.user.role !== 'superuser' && child.parentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.status(200).json({ success: true, data: child });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== PUT /api/children/:id ====================
// Update a child profile (owner or superuser)
exports.updateChild = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const child = await Child.findById(id);
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' });

    if (req.user.role !== 'superuser' && child.parentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const updatable = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'profilePicture', 'notes', 'tags', 'medical', 'isActive'];
    updatable.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        child[field] = req.body[field];
      }
    });

    await child.save();

    return res.status(200).json({ success: true, data: child });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== DELETE /api/children/:id ====================
// Delete a child profile (owner or superuser)
exports.deleteChild = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const child = await Child.findById(id);
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' });

    if (req.user.role !== 'superuser' && child.parentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await child.deleteOne();
    return res.status(200).json({ success: true, message: 'Child deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
