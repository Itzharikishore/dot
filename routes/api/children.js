const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const { protect } = require('../../middleware/auth');
const { handleValidationErrors } = require('../../middleware/validation');
const {
  createChild,
  getChildren,
  getChildById,
  updateChild,
  deleteChild
} = require('../../controllers/childrenController');

// ==================== VALIDATORS ====================
const createValidators = [
  body('firstName').isString().trim().isLength({ min: 1, max: 50 }).withMessage('firstName is required and must be 1-50 chars'),
  body('lastName').isString().trim().isLength({ min: 1, max: 50 }).withMessage('lastName is required and must be 1-50 chars'),
  body('dateOfBirth').isISO8601().withMessage('dateOfBirth must be a valid date').custom((v) => {
    if (new Date(v) > new Date()) throw new Error('dateOfBirth cannot be in the future');
    return true;
  }),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer-not-to-say']).withMessage('Invalid gender'),
  body('profilePicture').optional().isString().withMessage('profilePicture must be a string'),
  body('notes').optional().isString().isLength({ max: 1000 }).withMessage('notes max length is 1000'),
  body('tags').optional().isArray({ max: 20 }).withMessage('tags must be an array up to 20 items'),
  body('medical').optional().isObject().withMessage('medical must be an object'),
  handleValidationErrors
];

const idValidator = [
  param('id').isMongoId().withMessage('Invalid child id'),
  handleValidationErrors
];

const updateValidators = [
  param('id').isMongoId().withMessage('Invalid child id'),
  body('firstName').optional().isString().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().isString().trim().isLength({ min: 1, max: 50 }),
  body('dateOfBirth').optional().isISO8601().custom((v) => {
    if (new Date(v) > new Date()) throw new Error('dateOfBirth cannot be in the future');
    return true;
  }),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer-not-to-say']),
  body('profilePicture').optional().isString(),
  body('notes').optional().isString().isLength({ max: 1000 }),
  body('tags').optional().isArray({ max: 20 }),
  body('medical').optional().isObject(),
  body('isActive').optional().isBoolean(),
  handleValidationErrors
];

// ==================== ROUTES ====================
// @route   POST /api/children
// @desc    Create a child profile
// @access  Private (owner)
router.post('/', protect, createValidators, createChild);

// @route   GET /api/children
// @desc    List children for current user (all if superuser)
// @access  Private
router.get('/', protect, getChildren);

// @route   GET /api/children/:id
// @desc    Get child by id (must own or be superuser)
// @access  Private
router.get('/:id', protect, idValidator, getChildById);

// @route   PUT /api/children/:id
// @desc    Update child by id (must own or be superuser)
// @access  Private
router.put('/:id', protect, updateValidators, updateChild);

// @route   DELETE /api/children/:id
// @desc    Delete child by id (must own or be superuser)
// @access  Private
router.delete('/:id', protect, idValidator, deleteChild);

module.exports = router;
