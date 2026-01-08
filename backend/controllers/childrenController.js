const mongoose = require('mongoose');
const Child = require('../models/childModel');
const User = require('../models/User');

// ==================== Helpers ====================
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Calculate age from dateOfBirth
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Calculate dateOfBirth from age
const calculateDateOfBirth = (age) => {
  if (!age) return null;
  const today = new Date();
  const birthYear = today.getFullYear() - age;
  return new Date(birthYear, today.getMonth(), today.getDate());
};

// Transform child to frontend format
const transformChildToFrontend = async (child) => {
  const parent = child.parentId ? await User.findById(child.parentId).select('firstName lastName phoneNumber').lean() : null;
  const age = calculateAge(child.dateOfBirth);
  
  return {
    id: child._id.toString(),
    name: `${child.firstName} ${child.lastName}`.trim(),
    age: age || 0,
    gender: child.gender ? child.gender.charAt(0).toUpperCase() + child.gender.slice(1) : 'N/A',
    grade: child.notes?.includes('Grade') ? child.notes.match(/Grade\s+\d+/)?.[0] : 'N/A',
    parentName: parent ? `${parent.firstName} ${parent.lastName}`.trim() : 'N/A',
    parentContact: parent?.phoneNumber || 'N/A',
    // Include backend fields for compatibility
    firstName: child.firstName,
    lastName: child.lastName,
    dateOfBirth: child.dateOfBirth,
    profilePicture: child.profilePicture,
    notes: child.notes,
    tags: child.tags,
    medical: child.medical,
    isActive: child.isActive,
    createdAt: child.createdAt,
    updatedAt: child.updatedAt
  };
};

// ==================== POST /api/children ====================
// Create a child profile owned by the authenticated user
// Supports both formats:
// Frontend: { name, age, gender, grade, parentName, parentContact }
// Backend: { firstName, lastName, dateOfBirth, gender, notes, tags, medical }
// Returns: { success, data }
exports.createChild = async (req, res) => {
  try {
    const parentId = req.user._id;

    let firstName, lastName, dateOfBirth;
    
    // Handle frontend format (name, age)
    if (req.body.name) {
      const nameParts = req.body.name.trim().split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
      
      // Calculate dateOfBirth from age
      if (req.body.age) {
        dateOfBirth = calculateDateOfBirth(req.body.age);
      }
    } else {
      // Backend format (firstName, lastName, dateOfBirth)
      firstName = req.body.firstName;
      lastName = req.body.lastName;
      dateOfBirth = req.body.dateOfBirth;
    }

    // Handle gender format (Frontend: "Male"/"Female", Backend: "male"/"female")
    let gender = req.body.gender;
    if (gender) {
      gender = gender.toLowerCase();
    }

    // Build notes from frontend fields if provided
    let notes = req.body.notes;
    if (req.body.grade && !notes) {
      notes = `Grade: ${req.body.grade}`;
    }
    if (req.body.parentName && notes && !notes.includes('Parent:')) {
      notes += ` | Parent: ${req.body.parentName}`;
    }

    const payload = {
      parentId,
      firstName,
      lastName,
      dateOfBirth: dateOfBirth || req.body.dateOfBirth,
      gender,
      profilePicture: req.body.profilePicture,
      notes,
      tags: req.body.tags,
      medical: req.body.medical,
    };

    const child = await Child.create(payload);
    const transformed = await transformChildToFrontend(child);

    return res.status(201).json({ 
      success: true, 
      message: 'Child created successfully',
      data: transformed,
      // Also include original for backward compatibility
      child: child
    });
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
    
    // Transform to frontend format
    const transformed = await Promise.all(children.map(child => transformChildToFrontend(child)));
    
    return res.status(200).json({ 
      success: true, 
      data: transformed,
      // Also include original for backward compatibility
      children: children
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET /api/children/list ====================
// Alias for GET /api/children - to match frontend expectations
exports.getChildrenList = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = req.user.role === 'superuser' ? {} : { parentId: req.user._id };
    
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { notes: searchRegex }
      ];
    }

    const children = await Child.find(query)
      .sort({ lastName: 1, firstName: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Transform to frontend format
    const transformed = await Promise.all(children.map(child => transformChildToFrontend(child)));
    
    const total = await Child.countDocuments(query);
    
    return res.status(200).json({ 
      success: true, 
      data: transformed,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== POST /api/children/create ====================
// Alias for POST /api/children - to match frontend expectations
exports.createChildFrontend = async (req, res) => {
  return exports.createChild(req, res);
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

    const transformed = await transformChildToFrontend(child);
    return res.status(200).json({ 
      success: true, 
      data: transformed,
      // Also include original for backward compatibility
      child: child
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET /api/children/:id/progress ====================
// Get child progress
exports.getChildProgress = async (req, res) => {
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

    // TODO: Calculate actual progress from progress entries
    // For now, return basic structure
    return res.status(200).json({
      success: true,
      data: {
        childId: child._id.toString(),
        progressPercentage: 0, // TODO: Calculate from progress entries
        sessionsCompleted: 0, // TODO: Count completed sessions
        improvementAreas: [],
        lastSessionDate: null
      }
    });
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
    
    const transformed = await transformChildToFrontend(child);
    return res.status(200).json({ 
      success: true, 
      message: 'Child updated successfully',
      data: transformed,
      // Also include original for backward compatibility
      child: child
    });
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
    return res.status(200).json({ success: true, message: 'Child deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET /api/children/search ====================
// Search children by name
exports.searchChildren = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const filter = req.user.role === 'superuser' ? {} : { parentId: req.user._id };
    
    // Search in firstName and lastName
    const searchRegex = new RegExp(q.trim(), 'i');
    filter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex }
    ];

    const children = await Child.find(filter).sort({ lastName: 1, firstName: 1 });
    
    // Transform to frontend format
    const transformed = await Promise.all(children.map(child => transformChildToFrontend(child)));
    
    return res.status(200).json({ 
      success: true, 
      data: transformed
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
