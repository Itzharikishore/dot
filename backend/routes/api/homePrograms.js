const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const { protect, authorize } = require('../../middleware/auth');
const { handleValidationErrors, allowOnlyBodyKeys } = require('../../middleware/validation');
const {
  getByChild,
  createProgram,
  updateProgram,
  completeItem
} = require('../../controllers/homeProgramsController');

/**
 * @swagger
 * /api/home-programs/{childId}:
 *   get:
 *     summary: Get home program by child ID
 *     description: Retrieve the home program for a specific child
 *     tags: [Home Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         example: 60f7b3b3b3b3b3b3b3b3b3b3
 *         description: Child user ID
 *     responses:
 *       200:
 *         description: Home program retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 homeProgram:
 *                   $ref: '#/components/schemas/HomeProgram'
 *       404:
 *         description: Home program not found for this child
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
 *                   example: No home program found for this child
 *                 homeProgram:
 *                   type: null
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:childId', protect, [
  param('childId').isMongoId(),
  handleValidationErrors
], getByChild);

/**
 * @swagger
 * /api/home-programs:
 *   post:
 *     summary: Create home program
 *     description: Create a new home program for a child (therapist/superuser only). Sends push notification to child.
 *     tags: [Home Programs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - childId
 *               - items
 *             properties:
 *               childId:
 *                 type: string
 *                 example: 60f7b3b3b3b3b3b3b3b3b3b3
 *                 description: Child user ID
 *               title:
 *                 type: string
 *                 example: Weekly Fine Motor Program
 *                 description: Program title
 *               description:
 *                 type: string
 *                 example: Comprehensive fine motor skills development program
 *                 description: Program description
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - activityId
 *                   properties:
 *                     activityId:
 *                       type: string
 *                       example: 60f7b3b3b3b3b3b3b3b3b3b3
 *                       description: Activity ID
 *                     targetFrequencyPerWeek:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 70
 *                       example: 3
 *                       description: Target frequency per week
 *                     dueDate:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-01-15T10:00:00Z
 *                       description: Due date for this item
 *                     notes:
 *                       type: string
 *                       example: Practice daily for best results
 *                       description: Item-specific notes
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-01-01T00:00:00Z
 *                 description: Program start date
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-03-31T23:59:59Z
 *                 description: Program end date
 *     responses:
 *       201:
 *         description: Home program created successfully
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
 *                   example: Home program created successfully
 *                 homeProgram:
 *                   $ref: '#/components/schemas/HomeProgram'
 *                 notificationSent:
 *                   type: boolean
 *                   example: true
 *       403:
 *         description: Forbidden - Therapist/Superuser role required
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
router.post('/', protect, authorize('therapist','superuser'), [
  allowOnlyBodyKeys(['childId','title','description','items','startDate','endDate']),
  body('childId').isMongoId(),
  body('items').isArray({ min: 1 }),
  body('items.*.activityId').isMongoId(),
  body('items.*.targetFrequencyPerWeek').optional().isInt({ min: 0, max: 70 }),
  body('items.*.dueDate').optional().isISO8601(),
  body('items.*.notes').optional().isString().isLength({ max: 1000 }),
  handleValidationErrors
], createProgram);

/**
 * @swagger
 * /api/home-programs/{id}:
 *   put:
 *     summary: Update home program
 *     description: Update an existing home program (therapist/superuser only)
 *     tags: [Home Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 60f7b3b3b3b3b3b3b3b3b3b3
 *         description: Home program ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated Weekly Fine Motor Program
 *               description:
 *                 type: string
 *                 example: Updated program description
 *               status:
 *                 type: string
 *                 enum: [active, paused, completed, archived]
 *                 example: active
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-04-30T23:59:59Z
 *     responses:
 *       200:
 *         description: Home program updated successfully
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
 *                   example: Home program updated successfully
 *                 homeProgram:
 *                   $ref: '#/components/schemas/HomeProgram'
 *       403:
 *         description: Forbidden - Therapist/Superuser role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Home program not found
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
router.put('/:id', protect, authorize('therapist','superuser'), [
  param('id').isMongoId(),
  handleValidationErrors
], updateProgram);

/**
 * @swagger
 * /api/home-programs/{id}/complete:
 *   post:
 *     summary: Complete home program item
 *     description: Mark a home program item as complete (child/therapist/superuser)
 *     tags: [Home Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 60f7b3b3b3b3b3b3b3b3b3b3
 *         description: Home program ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemId
 *             properties:
 *               itemId:
 *                 type: string
 *                 example: 60f7b3b3b3b3b3b3b3b3b3b3
 *                 description: Home program item ID
 *               score:
 *                 type: number
 *                 minimum: 0
 *                 example: 90
 *                 description: Completion score
 *               notes:
 *                 type: string
 *                 example: Excellent execution
 *                 description: Completion notes
 *     responses:
 *       200:
 *         description: Item completed successfully
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
 *                   example: Item completed successfully
 *                 homeProgram:
 *                   $ref: '#/components/schemas/HomeProgram'
 *       400:
 *         description: Invalid item data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Home program or item not found
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
router.post('/:id/complete', protect, [
  param('id').isMongoId(),
  body('itemId').isString().isLength({ min: 1 }),
  body('score').optional().isFloat({ min: 0 }),
  body('notes').optional().isString().isLength({ max: 500 }),
  handleValidationErrors
], completeItem);

module.exports = router;
