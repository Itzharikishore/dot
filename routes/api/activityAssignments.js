const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

const { protect, authorize } = require('../../middleware/auth');
const { handleValidationErrors, allowOnlyBodyKeys } = require('../../middleware/validation');
const {
  createAssignment,
  listAssignments,
  updateAssignment,
  submitAssignment
} = require('../../controllers/activityAssignmentsController');

// Create assignment (therapist/superuser)
router.post('/', protect, authorize('therapist','superuser'), [
  allowOnlyBodyKeys(['childId','activityId','dueDate','notes']),
  body('childId').isMongoId(),
  body('activityId').isMongoId(),
  body('dueDate').optional().isISO8601(),
  body('notes').optional().isString().isLength({ max: 1000 }),
  handleValidationErrors
], createAssignment);

// List assignments by child
router.get('/', protect, [
  query('childId').isMongoId(),
  query('status').optional().isIn(['assigned','in-progress','completed','cancelled']),
  handleValidationErrors
], listAssignments);

// Update assignment (therapist/superuser)
router.put('/:id', protect, authorize('therapist','superuser'), [
  param('id').isMongoId(),
  handleValidationErrors
], updateAssignment);

// Submit progress (child/therapist/superuser)
router.post('/:id/submit', protect, [
  param('id').isMongoId(),
  body('completionPercent').optional().isInt({ min: 0, max: 100 }),
  body('score').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['assigned','in-progress','completed','cancelled']),
  handleValidationErrors
], submitAssignment);

module.exports = router;
