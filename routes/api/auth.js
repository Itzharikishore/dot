const express = require('express');
const router = express.Router();

// Import controllers
const {
  register,
  login,
  getProfile,
  logout
} = require('../../controllers/authController');


// Import middleware
const { protect } = require('../../middleware/auth');


// ==================== PUBLIC ROUTES ====================
// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', login);

// ==================== PROTECTED ROUTES ====================
// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, getProfile);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, logout);

module.exports = router;