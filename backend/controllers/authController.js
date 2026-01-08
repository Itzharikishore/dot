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
    // Support both formats: {name} or {firstName, lastName}
    let firstName, lastName;
    if (req.body.name) {
      // Frontend sends "name" - split it
      const nameParts = req.body.name.trim().split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    } else {
      // Backend format: firstName and lastName
      firstName = req.body.firstName;
      lastName = req.body.lastName;
    }

    const {
      email,
      password
    } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already in use' });
    }

    // Determine role: default to 'child'. Only superuser may create roles other than 'child'
    let requestedRole = req.body.role || 'child';
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
      message: 'Registration successful',
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        role: user.role
      },
      // Also include data for backward compatibility
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
      message: 'Login successful',
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        role: user.role
      },
      // Also include data for backward compatibility
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

// ==================== FORGOT PASSWORD ====================
const emailService = require('../utils/emailService');
const crypto = require('crypto');

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    console.log('🔍 forgotPassword: lookup for', email, 'found:', !!user);

    // Security: Don't reveal if email exists (prevents email enumeration attacks)
    // Always return success message regardless of whether user exists
    const successMessage = 'If an account exists with this email, a reset link has been sent to your email address.';

    if (!user) {
      // Add artificial delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 100));
      return res.status(200).json({ 
        success: true, 
        message: successMessage
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(200).json({ 
        success: true, 
        message: successMessage
      });
    }

    // Rate limiting: Prevent multiple reset requests while a token is still valid (10 minute window)
    if (user.passwordResetExpires && user.passwordResetExpires > Date.now()) {
      return res.status(429).json({
        success: false,
        message: 'Password reset request already sent. Please check your email or wait a few minutes before requesting again.'
      });
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Dev-only debug log: show token when running locally
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 forgotPassword: generated resetToken (dev):', resetToken);
    }
    // Send password reset email
    try {
      const emailResult = await emailService.sendPasswordResetEmail(user, resetToken);

      // Log the email send result for debugging
      console.log('📧 Password reset email result:', {
        to: user.email,
        success: emailResult.success,
        message: emailResult.message,
        error: emailResult.error,
        emailConfigured: emailService.isEmailConfigured()
      });
      
      if (!emailResult.success && process.env.NODE_ENV === 'production') {
        // In production, don't reveal email service issues
        console.error('Email sending failed:', emailResult.error);
        // Still return success to user for security
        return res.status(200).json({ 
          success: true, 
          message: successMessage
        });
      }

      // In development, log email details (and token is included in response below when email is not configured)
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Password reset email sent (dev):', {
          to: user.email,
          resetToken: resetToken, // Only in development
          emailConfigured: emailService.isEmailConfigured()
        });
      }

      // Flutter-friendly response format
      const response = {
        success: true,
        message: successMessage
      };

      // Only return token in development for testing (Flutter can use this for testing)
      if (process.env.NODE_ENV === 'development' && !emailService.isEmailConfigured()) {
        response.resetToken = resetToken;
        response.note = 'Email service not configured. Use this token for testing.';
        response.deepLink = `dottherapy://reset-password?token=${resetToken}`;
      }

      res.status(200).json(response);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      
      // Clear the reset token if email failed
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      // In production, still return success to prevent email enumeration
      if (process.env.NODE_ENV === 'production') {
        return res.status(200).json({ 
          success: true, 
          message: successMessage
        });
      }

      // In development, return error details
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send reset email. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred. Please try again later.' 
    });
  }
};

// ==================== DEBUG: FORGOT PASSWORD (DEV ONLY) ====================
// Returns reset token directly for local testing (development only)
exports.forgotPasswordDebug = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.isActive) return res.status(400).json({ success: false, message: 'Account inactive' });

    // Prevent repetitive token requests while a token is still valid
    if (user.passwordResetExpires && user.passwordResetExpires > Date.now()) {
      return res.status(429).json({ success: false, message: 'Password reset request already sent. Please check your email or wait a few minutes before requesting again.' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Log debug info
    console.log('🔐 forgotPasswordDebug: generated token for', email, resetToken);

    return res.status(200).json({ success: true, resetToken, message: 'Debug token generated' });
  } catch (err) {
    console.error('forgotPasswordDebug error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


// ==================== RESET PASSWORD ====================
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Validation
    if (!token || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token and new password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() } // Token not expired
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token. Please request a new password reset.' 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is deactivated. Please contact support.' 
      });
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Log password reset for security audit
    console.log('✅ Password reset successful:', {
      userId: user._id,
      email: user.email,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({ 
      success: true, 
      message: 'Password has been reset successfully. You can now login with your new password.' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while resetting password. Please try again.' 
    });
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
