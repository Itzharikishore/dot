// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ==================== HELPER TO GENERATE JWT ====================
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'secretkey',
    { expiresIn: '7d' }
  );
};

// ==================== REGISTER ====================
exports.register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password
    } = req.body; // strictly validated by middleware

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already in use' });
    }

    // Determine role: default to 'child'. Only superuser may create roles other than 'child'
    let requestedRole = 'child';
    if (req.user && req.user.role === 'superuser' && typeof req.body.role === 'string') {
      // superuser can explicitly set role; otherwise we keep 'child'
      requestedRole = req.body.role;
    }

    // Enforce who can register which roles
    const requester = req.user || null;

    if (requestedRole === 'superuser') {
      if (!requester || requester.role !== 'superuser') {
        return res.status(403).json({ success: false, error: 'Only superuser can create superuser' });
      }
    }

    if (requestedRole === 'hospital') {
      if (!requester || requester.role !== 'superuser') {
        return res.status(403).json({ success: false, error: 'Only superuser can register hospital accounts' });
      }
    }

    if (requestedRole === 'therapist') {
      if (!requester || (requester.role !== 'superuser' && requester.role !== 'hospital')) {
        return res.status(403).json({ success: false, error: 'Only superuser or hospital can register therapist accounts' });
      }
    }

    // Create new user with minimal, safe defaults
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: requestedRole
    });

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => ({
        field: e.path,
        message: e.message
      }));
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: errors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email already exists' 
      });
    }
    
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// ==================== LOGIN ====================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists and select password
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    // Generate token
    const token = generateToken(user);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      token,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        childrenIds: user.childrenIds,
        assignedPatients: user.assignedPatients,
        currentGoals: user.currentGoals,
        notifications: user.notifications,
        stats: user.stats,
        medicalHistory: user.medicalHistory
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// ==================== GET PROFILE ====================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        childrenIds: user.childrenIds,
        assignedPatients: user.assignedPatients,
        currentGoals: user.currentGoals,
        notifications: user.notifications,
        stats: user.stats,
        medicalHistory: user.medicalHistory,
        age: user.age,
        profilePicture: user.profilePicture,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// ==================== LOGOUT ====================
exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.lastLogout = new Date();
      await user.save();
    }

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
