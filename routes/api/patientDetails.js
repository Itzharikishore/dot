const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

const { protect } = require('../../middleware/auth');
const { handleValidationErrors, allowOnlyBodyKeys } = require('../../middleware/validation');
const { createPatientDocUploader } = require('../../middleware/upload');
const uploader = createPatientDocUploader({ maxSizeMB: 10 });

const {
  getById,
  lookup,
  upsert,
  addDocument
} = require('../../controllers/patientDetailController');

// ==================== ROUTES ====================
// GET by document id
router.get('/:id', protect, [
  param('id').isMongoId().withMessage('Invalid id'),
  handleValidationErrors
], getById);

// Lookup by userId or childId
router.get('/', protect, [
  query('userId').optional().isMongoId().withMessage('Invalid userId'),
  query('childId').optional().isMongoId().withMessage('Invalid childId'),
  handleValidationErrors
], lookup);

// Upsert patient detail
router.post('/upsert', protect, [
  allowOnlyBodyKeys(['userId', 'childId', 'name', 'dateOfBirth', 'gender', 'medicalHistory', 'allergies', 'pastDiseases']),
  body('userId').optional().isMongoId(),
  body('childId').optional().isMongoId(),
  body('name').isString().trim().isLength({ min: 1, max: 120 }),
  body('dateOfBirth').isISO8601().withMessage('Invalid dateOfBirth').custom((v) => {
    if (new Date(v) > new Date()) throw new Error('dateOfBirth cannot be in the future');
    return true;
  }),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer-not-to-say']),
  body('medicalHistory').optional().isString().isLength({ max: 5000 }),
  body('allergies').optional().isArray(),
  body('pastDiseases').optional().isArray(),
  handleValidationErrors
], upsert);

// Upload and append a document
router.post('/:id/documents', protect, [
  param('id').isMongoId().withMessage('Invalid id'),
  handleValidationErrors
], uploader.single('file'), addDocument);

module.exports = router;
