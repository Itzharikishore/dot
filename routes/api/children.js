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

/**
 * @swagger
 * /api/children:
 *   post:
 *     summary: Create a child profile
 *     description: Create a new child profile for the authenticated user
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - dateOfBirth
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Emma
 *               lastName:
 *                 type: string
 *                 example: Smith
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: 2015-06-15
 *               gender:
 *                 type: string
 *                 enum: [male, female, other, prefer-not-to-say]
 *                 example: female
 *               profilePicture:
 *                 type: string
 *                 example: https://example.com/profile.jpg
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *                 example: Loves playing with blocks
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [autism, speech-delay]
 *               medical:
 *                 type: object
 *                 properties:
 *                   diagnosis:
 *                     type: string
 *                     example: Autism Spectrum Disorder
 *                   medications:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: [Risperidone]
 *                   allergies:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: [Peanuts]
 *     responses:
 *       201:
 *         description: Child created successfully
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
 *                   example: Child created successfully
 *                 child:
 *                   $ref: '#/components/schemas/Child'
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
router.post('/', protect, createValidators, createChild);

/**
 * @swagger
 * /api/children:
 *   get:
 *     summary: List children
 *     description: Get all children for the authenticated user. Superusers can see all children.
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Children retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: number
 *                   example: 2
 *                 children:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Child'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', protect, getChildren);

/**
 * @swagger
 * /api/children/{id}:
 *   get:
 *     summary: Get child by ID
 *     description: Retrieve a specific child profile by ID. Must be the owner or superuser.
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 60f7b3b3b3b3b3b3b3b3b3b3
 *     responses:
 *       200:
 *         description: Child retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 child:
 *                   $ref: '#/components/schemas/Child'
 *       403:
 *         description: Forbidden - Not the owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Child not found
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
router.get('/:id', protect, idValidator, getChildById);

/**
 * @swagger
 * /api/children/{id}:
 *   put:
 *     summary: Update child by ID
 *     description: Update a specific child profile by ID. Must be the owner or superuser.
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 60f7b3b3b3b3b3b3b3b3b3b3
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Emma
 *               lastName:
 *                 type: string
 *                 example: Smith
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: 2015-06-15
 *               gender:
 *                 type: string
 *                 enum: [male, female, other, prefer-not-to-say]
 *                 example: female
 *               profilePicture:
 *                 type: string
 *                 example: https://example.com/profile.jpg
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *                 example: Loves playing with blocks
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [autism, speech-delay]
 *               medical:
 *                 type: object
 *                 properties:
 *                   diagnosis:
 *                     type: string
 *                     example: Autism Spectrum Disorder
 *                   medications:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: [Risperidone]
 *                   allergies:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: [Peanuts]
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Child updated successfully
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
 *                   example: Child updated successfully
 *                 child:
 *                   $ref: '#/components/schemas/Child'
 *       403:
 *         description: Forbidden - Not the owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Child not found
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
router.put('/:id', protect, updateValidators, updateChild);

/**
 * @swagger
 * /api/children/{id}:
 *   delete:
 *     summary: Delete child by ID
 *     description: Delete a specific child profile by ID. Must be the owner or superuser.
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 60f7b3b3b3b3b3b3b3b3b3b3
 *     responses:
 *       200:
 *         description: Child deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Forbidden - Not the owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Child not found
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
router.delete('/:id', protect, idValidator, deleteChild);

module.exports = router;
