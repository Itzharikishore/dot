const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { createPatientDocUploader } = require('../middleware/upload');

// ==================== Helpers ====================
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Check if user can access/modify another user's profile
const canAccessUser = (req, targetUserId) => {
  // Owner can access
  if (req.user._id.toString() === targetUserId.toString()) return true;
  // Superuser can access anyone
  if (req.user.role === 'superuser') return true;
  // Therapist can access assigned patients
  if (req.user.role === 'therapist') {
    return req.user.assignedPatients?.some(id => id.toString() === targetUserId.toString());
  }
  return false;
};

// ==================== GET /api/users/:userId ====================
// Get user profile by ID
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    // Check permissions
    if (!canAccessUser(req, userId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Transform to frontend format
    const profile = {
      id: user._id.toString(),
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      phone: user.phoneNumber || '',
      role: user.role,
      profilePic: user.profilePicture || '',
      joinDate: user.createdAt,
      // Include all backend fields for compatibility
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      age: user.age,
      bio: user.bio,
      address: user.address,
      childrenIds: user.childrenIds,
      assignedPatients: user.assignedPatients,
      currentGoals: user.currentGoals,
      notifications: user.notifications,
      stats: user.stats,
      medicalHistory: user.medicalHistory,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== PUT /api/users/:userId ====================
// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    // Check permissions - users can only update their own profile (unless superuser)
    if (req.user._id.toString() !== userId.toString() && req.user.role !== 'superuser') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Handle name field (frontend format) - split into firstName/lastName
    if (req.body.name) {
      const nameParts = req.body.name.trim().split(' ');
      req.body.firstName = nameParts[0] || user.firstName;
      req.body.lastName = nameParts.slice(1).join(' ') || user.lastName;
    }

    // Map frontend fields to backend fields
    const fieldMap = {
      name: null, // Already handled above
      firstName: 'firstName',
      lastName: 'lastName',
      email: 'email',
      phone: 'phoneNumber',
      phoneNumber: 'phoneNumber',
      dateOfBirth: 'dateOfBirth',
      gender: 'gender',
      bio: 'bio',
      address: 'address',
      profilePic: 'profilePicture',
      profilePicture: 'profilePicture'
    };

    // Update allowed fields
    Object.keys(fieldMap).forEach(frontendField => {
      if (fieldMap[frontendField] && req.body.hasOwnProperty(frontendField)) {
        user[fieldMap[frontendField]] = req.body[frontendField];
      }
    });

    await user.save();

    // Return updated profile in frontend format
    const profile = {
      id: user._id.toString(),
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      phone: user.phoneNumber || '',
      role: user.role,
      profilePic: user.profilePicture || '',
      joinDate: user.createdAt
    };

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: profile
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    console.error('Error updating user profile:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== PUT /api/users/:userId/password ====================
// Change user password
exports.changePassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    // Users can only change their own password (unless superuser)
    if (req.user._id.toString() !== userId.toString() && req.user.role !== 'superuser') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Both oldPassword and newPassword are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters' 
      });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify old password (unless superuser changing someone else's password)
    if (req.user._id.toString() === userId.toString()) {
      const isMatch = await user.comparePassword(oldPassword);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (err) {
    console.error('Error changing password:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== POST /api/users/:userId/upload-profile-pic ====================
// Upload profile picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    // Users can only upload their own profile picture (unless superuser)
    if (req.user._id.toString() !== userId.toString() && req.user.role !== 'superuser') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const uploaded = req.file;
    if (!uploaded) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Update profile picture URL
    const profilePicUrl = `/uploads/patient-docs/${uploaded.filename}`;
    user.profilePicture = profilePicUrl;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicUrl: profilePicUrl
      }
    });
  } catch (err) {
    console.error('Error uploading profile picture:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

