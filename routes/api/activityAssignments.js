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

/**
 * @swagger
 * /api/activity-assignments:
 *   post:
 *     summary: Create activity assignment
 *     description: Assign an activity to a child (therapist/superuser only). Sends push notification to child.
 *     tags: [Activity Assignments]
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
 *               - activityId
 *             properties:
 *               childId:
 *                 type: string
 *                 example: 60f7b3b3b3b3b3b3b3b3b3b3
 *                 description: Child user ID
 *               activityId:
 *                 type: string
 *                 example: 60f7b3b3b3b3b3b3b3b3b3b3
 *                 description: Activity ID to assign
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-01-15T10:00:00Z
 *                 description: Due date for the assignment
 *               notes:
 *                 type: string
 *                 example: Focus on hand-eye coordination
 *                 description: Assignment notes
 *     responses:
 *       201:
 *         description: Assignment created successfully
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
 *                   example: Activity assigned successfully
 *                 assignment:
 *                   $ref: '#/components/schemas/ActivityAssignment'
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
 *         description: Child or activity not found
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
  allowOnlyBodyKeys(['childId','activityId','dueDate','notes']),
  body('childId').isMongoId(),
  body('activityId').isMongoId(),
  body('dueDate').optional().isISO8601(),
  body('notes').optional().isString().isLength({ max: 1000 }),
  handleValidationErrors
], createAssignment);

/**
 * @swagger
 * /api/activity-assignments:
 *   get:
 *     summary: List activity assignments
 *     description: Get activity assignments for a specific child
 *     tags: [Activity Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         example: 60f7b3b3b3b3b3b3b3b3b3b3
 *         description: Child user ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [assigned, in-progress, completed, cancelled]
 *         example: assigned
 *         description: Filter by assignment status
 *     responses:
 *       200:
 *         description: Assignments retrieved successfully
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
 *                   example: 3
 *                 assignments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ActivityAssignment'
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
  query('childId').isMongoId(),
  query('status').optional().isIn(['assigned','in-progress','completed','cancelled']),
  handleValidationErrors
], listAssignments);

/**
 * @swagger
 * /api/activity-assignments/{id}:
 *   put:
 *     summary: Update activity assignment
 *     description: Update an existing activity assignment (therapist/superuser only)
 *     tags: [Activity Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 60f7b3b3b3b3b3b3b3b3b3b3
 *         description: Assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-01-20T10:00:00Z
 *               notes:
 *                 type: string
 *                 example: Updated assignment notes
 *               status:
 *                 type: string
 *                 enum: [assigned, in-progress, completed, cancelled]
 *                 example: in-progress
 *     responses:
 *       200:
 *         description: Assignment updated successfully
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
 *                   example: Assignment updated successfully
 *                 assignment:
 *                   $ref: '#/components/schemas/ActivityAssignment'
 *       403:
 *         description: Forbidden - Therapist/Superuser role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Assignment not found
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
], updateAssignment);

/**
 * @swagger
 * /api/activity-assignments/{id}/submit:
 *   post:
 *     summary: Submit assignment progress
 *     description: Submit progress for an activity assignment (child/therapist/superuser)
 *     tags: [Activity Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 60f7b3b3b3b3b3b3b3b3b3b3
 *         description: Assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               completionPercent:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 75
 *                 description: Completion percentage
 *               score:
 *                 type: number
 *                 minimum: 0
 *                 example: 85
 *                 description: Assignment score
 *               status:
 *                 type: string
 *                 enum: [assigned, in-progress, completed, cancelled]
 *                 example: completed
 *                 description: Assignment status
 *     responses:
 *       200:
 *         description: Progress submitted successfully
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
 *                   example: Progress submitted successfully
 *                 assignment:
 *                   $ref: '#/components/schemas/ActivityAssignment'
 *       400:
 *         description: Invalid progress data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Assignment not found
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
router.post('/:id/submit', protect, [
  param('id').isMongoId(),
  body('completionPercent').optional().isInt({ min: 0, max: 100 }),
  body('score').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['assigned','in-progress','completed','cancelled']),
  handleValidationErrors
], submitAssignment);

module.exports = router;
