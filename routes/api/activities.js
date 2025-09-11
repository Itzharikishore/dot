const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

const { protect, authorize } = require('../../middleware/auth');
const { handleValidationErrors, allowOnlyBodyKeys } = require('../../middleware/validation');
const { createPatientDocUploader } = require('../../middleware/upload');
const uploader = createPatientDocUploader({ maxSizeMB: 20, allowedMimeTypes: ['image/png','image/jpeg','video/mp4','audio/mpeg','application/pdf'] });

const {
  getAllActivities,
  getByCategory,
  createActivity,
  updateActivity,
  uploadCompletion
} = require('../../controllers/activitiesController');

// ==================== LIST ====================
router.get('/', [
  query('status').optional().isIn(['draft','published','archived']),
  query('difficultyLevel').optional().isIn(['beginner','intermediate','advanced']),
  query('minAge').optional().isInt({ min: 1, max: 18 }),
  query('maxAge').optional().isInt({ min: 1, max: 18 }),
  query('q').optional().isString(),
  query('category').optional().isString(),
  handleValidationErrors
], getAllActivities);

// ==================== BY CATEGORY ====================
router.get('/category/:category', [
  param('category').isString().isLength({ min: 1 }),
  handleValidationErrors
], getByCategory);

// ==================== CREATE (THERAPIST ONLY) ====================
router.post('/', protect, authorize('therapist'), [
  allowOnlyBodyKeys(['title','description','category','subcategory','difficultyLevel','ageRange','instructions','thumbnailImage','media','estimatedDuration','materials','scoringCriteria','maxScore','passingScore','tasks','therapyGoals','status','isActive','visibility','tags']),
  body('title').isString().trim().isLength({ min: 1, max: 100 }),
  body('description').isString().isLength({ min: 1, max: 500 }),
  body('category').isString().isLength({ min: 1 }),
  body('subcategory').isString().isLength({ min: 1 }),
  body('difficultyLevel').isIn(['beginner','intermediate','advanced']),
  body('ageRange').isObject(),
  body('ageRange.min').isInt({ min: 1, max: 18 }),
  body('ageRange.max').isInt({ min: 1, max: 18 }),
  body('thumbnailImage').isString().isLength({ min: 1 }),
  body('estimatedDuration').isInt({ min: 1, max: 120 }),
  body('scoringCriteria').optional().isIn(['percentage','points','completion','time-based','observation']),
  handleValidationErrors
], createActivity);

// ==================== UPDATE ====================
router.put('/:id', protect, authorize('therapist','superuser'), [
  param('id').isMongoId(),
  handleValidationErrors
], updateActivity);

// ==================== UPLOAD COMPLETION ====================
router.post('/:id/upload', protect, [
  param('id').isMongoId(),
  handleValidationErrors
], uploader.single('file'), uploadCompletion);

module.exports = router;
