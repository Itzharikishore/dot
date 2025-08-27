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
      password,
      role = 'patient',
      phoneNumber,
      dateOfBirth,
      gender
    } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already in use' });
    }

    // Create new user with all defaults
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      phoneNumber: phoneNumber || null,
      dateOfBirth: dateOfBirth || null,
      gender: gender || 'prefer-not-to-say',
      childrenIds: [],
      assignedPatients: [],
      currentGoals: [],
      notifications: {
        email: true,
        sms: false,
        push: true,
        activityReminders: true,
        progressUpdates: true
      },
      stats: {
        totalActivitiesCompleted: 0,
        totalTimeSpent: 0,
        averageScore: 0,
        currentStreak: 0,
        longestStreak: 0
      },
      medicalHistory: {
        currentLevel: 'beginner',
        totalActivitiesCompleted: 0,
        totalTherapyHours: 0
      }
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
