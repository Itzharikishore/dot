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

/**
 * @swagger
 * /api/patient-details/{id}:
 *   get:
 *     summary: Get patient detail by ID
 *     description: Retrieve a specific patient detail by document ID
 *     tags: [Patient Details]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 60f7b3b3b3b3b3b3b3b3b3b3
 *         description: Patient detail document ID
 *     responses:
 *       200:
 *         description: Patient detail retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 patientDetail:
 *                   $ref: '#/components/schemas/PatientDetail'
 *       403:
 *         description: Forbidden - Not authorized to view this patient detail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Patient detail not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', protect, [
  param('id').isMongoId().withMessage('Invalid id'),
  handleValidationErrors
], getById);

/**
 * @swagger
 * /api/patient-details:
 *   get:
 *     summary: Lookup patient details
 *     description: Lookup patient details by userId or childId
 *     tags: [Patient Details]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         example: 60f7b3b3b3b3b3b3b3b3b3b3
 *         description: User ID to lookup
 *       - in: query
 *         name: childId
 *         schema:
 *           type: string
 *         example: 60f7b3b3b3b3b3b3b3b3b3b3
 *         description: Child ID to lookup
 *     responses:
 *       200:
 *         description: Patient details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 patientDetail:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/PatientDetail'
 *                     - type: null
 *                   example: null
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', protect, [
  query('userId').optional().isMongoId().withMessage('Invalid userId'),
  query('childId').optional().isMongoId().withMessage('Invalid childId'),
  handleValidationErrors
], lookup);

/**
 * @swagger
 * /api/patient-details/upsert:
 *   post:
 *     summary: Create or update patient details
 *     description: Create new patient details or update existing ones
 *     tags: [Patient Details]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - dateOfBirth
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 60f7b3b3b3b3b3b3b3b3b3b3
 *                 description: User ID (optional if childId provided)
 *               childId:
 *                 type: string
 *                 example: 60f7b3b3b3b3b3b3b3b3b3b3
 *                 description: Child ID (optional if userId provided)
 *               name:
 *                 type: string
 *                 example: Emma Smith
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: 2015-06-15
 *               gender:
 *                 type: string
 *                 enum: [male, female, other, prefer-not-to-say]
 *                 example: female
 *               medicalHistory:
 *                 type: string
 *                 example: Born at 36 weeks, early intervention since age 2
 *               allergies:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [Peanuts, Dairy]
 *               pastDiseases:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [RSV at 6 months]
 *     responses:
 *       200:
 *         description: Patient details saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Patient details saved successfully
 *                 patientDetail:
 *                   $ref: '#/components/schemas/PatientDetail'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/patient-details/{id}/documents:
 *   post:
 *     summary: Upload patient document
 *     description: Upload and attach a document to patient details
 *     tags: [Patient Details]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 60f7b3b3b3b3b3b3b3b3b3b3
 *         description: Patient detail document ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Document file (PDF, image, etc.)
 *               name:
 *                 type: string
 *                 example: Immunization Record
 *                 description: Document name (optional)
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Document uploaded successfully
 *                 document:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Immunization Record
 *                     url:
 *                       type: string
 *                       example: /uploads/patient-docs/filename.pdf
 *                     mimeType:
 *                       type: string
 *                       example: application/pdf
 *                     uploadedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid file or patient detail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Patient detail not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/documents', protect, [
  param('id').isMongoId().withMessage('Invalid id'),
  handleValidationErrors
], uploader.single('file'), addDocument);

module.exports = router;
