const express = require('express');
const router = express.Router();
const {
  getTherapists,
  getTherapistById,
  createTherapist,
  updateTherapist,
  deleteTherapist,
  searchTherapists
} = require('../../controllers/therapistController');

// Import middleware
const { protect, authorize } = require('../../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../../middleware/validation');

// ==================== VALIDATION RULES ====================
const createTherapistValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('age')
    .isInt({ min: 21, max: 70 })
    .withMessage('Age must be between 21 and 70'),
  
  body('gender')
    .isIn(['Male', 'Female', 'Other', 'Prefer not to say'])
    .withMessage('Invalid gender'),
  
  body('contactNo')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters'),
  
  body('qualification')
    .trim()
    .notEmpty()
    .withMessage('Qualification is required')
    .isLength({ max: 200 })
    .withMessage('Qualification cannot exceed 200 characters'),
  
  body('experience')
    .trim()
    .notEmpty()
    .withMessage('Experience is required')
    .isLength({ max: 100 })
    .withMessage('Experience cannot exceed 100 characters')
];

const updateTherapistValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('age')
    .optional()
    .isInt({ min: 21, max: 70 })
    .withMessage('Age must be between 21 and 70'),
  
  body('gender')
    .optional()
    .isIn(['Male', 'Female', 'Other', 'Prefer not to say'])
    .withMessage('Invalid gender'),
  
  body('contactNo')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters'),
  
  body('qualification')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Qualification cannot exceed 200 characters'),
  
  body('experience')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Experience cannot exceed 100 characters')
];

// ==================== PUBLIC ROUTES ====================
// None - all therapist routes are protected

// ==================== PROTECTED ROUTES ====================

/**
 * @swagger
 * /api/therapists/list:
 *   get:
 *     summary: Get all therapists
 *     description: Fetch a list of therapists with pagination and search support
 *     tags: [Therapists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name, email, or qualification
 *       - in: query
 *         name: hospitalId
 *         schema:
 *           type: string
 *         description: Filter by hospital ID (for superusers)
 *     responses:
 *       200:
 *         description: Therapists fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Therapist'
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal Server Error
 */
router.get('/list', protect, authorize('superuser', 'hospital', 'therapist'), getTherapists);

/**
 * @swagger
 * /api/therapists/search:
 *   get:
 *     summary: Search therapists
 *     description: Search therapists by name, email, qualification, or experience
 *     tags: [Therapists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Search query required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.get('/search', protect, authorize('superuser', 'hospital', 'therapist'), searchTherapists);

/**
 * @swagger
 * /api/therapists/{id}:
 *   get:
 *     summary: Get therapist by ID
 *     description: Fetch therapist details by ID
 *     tags: [Therapists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Therapist ID
 *     responses:
 *       200:
 *         description: Therapist details
 *       404:
 *         description: Therapist not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.get('/:id', protect, authorize('superuser', 'hospital', 'therapist'), getTherapistById);

/**
 * @swagger
 * /api/therapists/create:
 *   post:
 *     summary: Create new therapist
 *     description: Create a new therapist profile
 *     tags: [Therapists]
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
 *               - email
 *               - age
 *               - gender
 *               - contactNo
 *               - address
 *               - qualification
 *               - experience
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Dr. John Smith"
 *               email:
 *                 type: string
 *                 example: "john.smith@example.com"
 *               age:
 *                 type: integer
 *                 example: 35
 *               gender:
 *                 type: string
 *                 enum: ["Male", "Female", "Other", "Prefer not to say"]
 *               contactNo:
 *                 type: string
 *                 example: "+1-555-0101"
 *               address:
 *                 type: string
 *                 example: "123 Medical St, Health City"
 *               qualification:
 *                 type: string
 *                 example: "M.S. Speech Language Pathology"
 *               experience:
 *                 type: string
 *                 example: "8 years"
 *               userId:
 *                 type: string
 *                 description: Optional existing user ID
 *               password:
 *                 type: string
 *                 description: Password if creating new user account
 *     responses:
 *       201:
 *         description: Therapist created successfully
 *       400:
 *         description: Validation error or email already exists
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.post('/create', 
  protect, 
  authorize('superuser', 'hospital'), 
  createTherapistValidation, 
  handleValidationErrors, 
  createTherapist
);

/**
 * @swagger
 * /api/therapists/{id}:
 *   put:
 *     summary: Update therapist
 *     description: Update therapist information
 *     tags: [Therapists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Therapist ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               age:
 *                 type: integer
 *               gender:
 *                 type: string
 *               contactNo:
 *                 type: string
 *               address:
 *                 type: string
 *               qualification:
 *                 type: string
 *               experience:
 *                 type: string
 *     responses:
 *       200:
 *         description: Therapist updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Therapist not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.put('/:id', 
  protect, 
  authorize('superuser', 'hospital', 'therapist'), 
  updateTherapistValidation, 
  handleValidationErrors, 
  updateTherapist
);

/**
 * @swagger
 * /api/therapists/{id}:
 *   delete:
 *     summary: Delete therapist
 *     description: Soft delete therapist (set isActive to false)
 *     tags: [Therapists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Therapist ID
 *     responses:
 *       200:
 *         description: Therapist deleted successfully
 *       404:
 *         description: Therapist not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.delete('/:id', protect, authorize('superuser', 'hospital', 'therapist'), deleteTherapist);

module.exports = router;
