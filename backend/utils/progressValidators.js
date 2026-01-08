const { body, param, query } = require('express-validator');

// ==================== PROGRESS VALIDATION RULES ====================

// Create progress validation
const validateCreateProgress = [
  body('programId')
    .isMongoId()
    .withMessage('Valid programId is required'),
    
  body('activityId')
    .optional()
    .isMongoId()
    .withMessage('activityId must be a valid MongoDB ObjectId'),
    
  body('progressPercentage')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Progress percentage must be between 0 and 100'),
    
  body('completedTasks')
    .optional()
    .isArray()
    .withMessage('completedTasks must be an array'),
    
  body('completedTasks.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Each completed task must be a string between 1-200 characters'),
    
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be a string with maximum 1000 characters'),
    
  body('milestone')
    .optional()
    .isIn(['started', 'quarter', 'half', 'three-quarters', 'completed', 'custom'])
    .withMessage('Milestone must be one of: started, quarter, half, three-quarters, completed, custom'),
    
  body('customMilestone')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Custom milestone must be a string between 1-100 characters'),
    
  body('score')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Score must be between 0 and 100'),
    
  body('timeSpent')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Time spent must be a positive number'),
    
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be one of: easy, medium, hard'),
    
  body('mood')
    .optional()
    .isIn(['excellent', 'good', 'okay', 'difficult', 'frustrated'])
    .withMessage('Mood must be one of: excellent, good, okay, difficult, frustrated'),
    
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
    
  body('tags.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be a string between 1-50 characters'),
    
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean value')
];

// Update progress validation
const validateUpdateProgress = [
  body('progressPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Progress percentage must be between 0 and 100'),
    
  body('completedTasks')
    .optional()
    .isArray()
    .withMessage('completedTasks must be an array'),
    
  body('completedTasks.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Each completed task must be a string between 1-200 characters'),
    
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be a string with maximum 1000 characters'),
    
  body('milestone')
    .optional()
    .isIn(['started', 'quarter', 'half', 'three-quarters', 'completed', 'custom'])
    .withMessage('Milestone must be one of: started, quarter, half, three-quarters, completed, custom'),
    
  body('customMilestone')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Custom milestone must be a string between 1-100 characters'),
    
  body('score')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Score must be between 0 and 100'),
    
  body('timeSpent')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Time spent must be a positive number'),
    
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be one of: easy, medium, hard'),
    
  body('mood')
    .optional()
    .isIn(['excellent', 'good', 'okay', 'difficult', 'frustrated'])
    .withMessage('Mood must be one of: excellent, good, okay, difficult, frustrated'),
    
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
    
  body('tags.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be a string between 1-50 characters'),
    
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean value')
];

// Review progress validation
const validateReviewProgress = [
  body('status')
    .optional()
    .isIn(['draft', 'submitted', 'reviewed', 'approved'])
    .withMessage('Status must be one of: draft, submitted, reviewed, approved'),
    
  body('reviewNotes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Review notes must be a string with maximum 500 characters')
];

// Parameter validation
const validateProgressId = [
  param('progressId')
    .isMongoId()
    .withMessage('Valid progressId is required')
];

const validateUserId = [
  param('userId')
    .isMongoId()
    .withMessage('Valid userId is required')
];

const validateProgramId = [
  param('programId')
    .isMongoId()
    .withMessage('Valid programId is required')
];

// Query validation for pagination and filtering
const validateProgressQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('programId')
    .optional()
    .isMongoId()
    .withMessage('programId must be a valid MongoDB ObjectId'),
    
  query('status')
    .optional()
    .isIn(['draft', 'submitted', 'reviewed', 'approved'])
    .withMessage('Status must be one of: draft, submitted, reviewed, approved'),
    
  query('milestone')
    .optional()
    .isIn(['started', 'quarter', 'half', 'three-quarters', 'completed', 'custom'])
    .withMessage('Milestone must be one of: started, quarter, half, three-quarters, completed, custom')
];

// Custom validation for milestone and customMilestone relationship
const validateMilestoneCustom = (req, res, next) => {
  const { milestone, customMilestone } = req.body;
  
  if (milestone === 'custom' && !customMilestone) {
    return res.status(400).json({
      success: false,
      message: 'customMilestone is required when milestone is "custom"'
    });
  }
  
  if (milestone !== 'custom' && customMilestone) {
    return res.status(400).json({
      success: false,
      message: 'customMilestone should only be provided when milestone is "custom"'
    });
  }
  
  next();
};

// Input sanitization middleware
const sanitizeProgressInput = (req, res, next) => {
  // Sanitize string fields to prevent XSS
  const stringFields = ['notes', 'customMilestone'];
  const arrayFields = ['completedTasks', 'tags'];
  
  stringFields.forEach(field => {
    if (req.body[field] && typeof req.body[field] === 'string') {
      req.body[field] = req.body[field].trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
  });
  
  arrayFields.forEach(field => {
    if (req.body[field] && Array.isArray(req.body[field])) {
      req.body[field] = req.body[field].map(item => {
        if (typeof item === 'string') {
          return item.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        }
        return item;
      });
    }
  });
  
  next();
};

module.exports = {
  validateCreateProgress,
  validateUpdateProgress,
  validateReviewProgress,
  validateProgressId,
  validateUserId,
  validateProgramId,
  validateProgressQuery,
  validateMilestoneCustom,
  sanitizeProgressInput
};
