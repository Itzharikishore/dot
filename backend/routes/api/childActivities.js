const express = require('express');
const router = express.Router();
const { param, body, query } = require('express-validator');

const { protect, authorize } = require('../../middleware/auth');
const { handleValidationErrors } = require('../../middleware/validation');
const {
  getChildActivities,
  assignActivityToChild,
  removeActivityFromChild,
  updateActivityStatus
} = require('../../controllers/childActivitiesController');

// ==================== VALIDATORS ====================
const childIdValidator = [
  param('childId').isMongoId().withMessage('Invalid child ID'),
  handleValidationErrors
];

const activityIdValidator = [
  param('childId').isMongoId().withMessage('Invalid child ID'),
  param('activityId').isMongoId().withMessage('Invalid activity ID'),
  handleValidationErrors
];

const assignActivityValidator = [
  param('childId').isMongoId().withMessage('Invalid child ID'),
  body('activityId').isMongoId().withMessage('Invalid activity ID'),
  body('therapistId').isMongoId().withMessage('Invalid therapist ID'),
  body('scheduledDate').isISO8601().withMessage('Invalid scheduled date'),
  body('notes').optional().isString().trim().isLength({ max: 500 }).withMessage('Notes must be max 500 characters'),
  body('activityType').optional().isIn(['therapy', 'assessment', 'practice']).withMessage('Invalid activity type'),
  handleValidationErrors
];

const updateStatusValidator = [
  param('childId').isMongoId().withMessage('Invalid child ID'),
  param('activityId').isMongoId().withMessage('Invalid activity ID'),
  body('status').optional().isIn(['scheduled', 'in-progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('progress').optional().isObject().withMessage('Progress must be an object'),
  body('notes').optional().isString().trim().isLength({ max: 500 }).withMessage('Notes must be max 500 characters'),
  handleValidationErrors
];

// ==================== ROUTES ====================

/**
 * @swagger
 * /api/children/{childId}/activities:
 *   get:
 *     summary: Get child's activities
 *     description: Fetch all activities assigned to a specific child
 *     tags: [Child Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, in-progress, completed, cancelled]
 *         description: Filter by activity status
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
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Child activities fetched successfully
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       activityId:
 *                         type: string
 *                       activityName:
 *                         type: string
 *                       activityDescription:
 *                         type: string
 *                       category:
 *                         type: string
 *                       difficulty:
 *                         type: string
 *                       duration:
 *                         type: integer
 *                       therapistId:
 *                         type: string
 *                       therapistName:
 *                         type: string
 *                       scheduledDate:
 *                         type: string
 *                       completedAt:
 *                         type: string
 *                       status:
 *                         type: string
 *                       notes:
 *                         type: string
 *                       progress:
 *                         type: object
 *                       createdAt:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       400:
 *         description: Invalid child ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Child not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/:childId/activities', protect, childIdValidator, getChildActivities);

/**
 * @swagger
 * /api/children/{childId}/activities:
 *   post:
 *     summary: Assign activity to child
 *     description: Assign an activity to a specific child
 *     tags: [Child Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - activityId
 *               - therapistId
 *               - scheduledDate
 *             properties:
 *               activityId:
 *                 type: string
 *                 description: Activity ID to assign
 *               therapistId:
 *                 type: string
 *                 description: Therapist ID
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *                 description: Scheduled date and time
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional notes
 *               activityType:
 *                 type: string
 *                 enum: [therapy, assessment, practice]
 *                 default: therapy
 *                 description: Type of activity
 *     responses:
 *       201:
 *         description: Activity assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     activityId:
 *                       type: string
 *                     activityName:
 *                       type: string
 *                     activityDescription:
 *                       type: string
 *                     category:
 *                       type: string
 *                     difficulty:
 *                       type: string
 *                     duration:
 *                       type: integer
 *                     therapistId:
 *                       type: string
 *                     therapistName:
 *                       type: string
 *                     scheduledDate:
 *                       type: string
 *                     status:
 *                       type: string
 *                     notes:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Child, activity, or therapist not found
 *       500:
 *         description: Internal Server Error
 */
router.post('/:childId/activities', protect, authorize('therapist', 'superuser'), assignActivityValidator, assignActivityToChild);

/**
 * @swagger
 * /api/children/{childId}/activities/{activityId}:
 *   delete:
 *     summary: Remove activity from child
 *     description: Remove an activity assignment from a child
 *     tags: [Child Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity assignment ID
 *     responses:
 *       200:
 *         description: Activity removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid IDs or activity already completed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Child or activity assignment not found
 *       500:
 *         description: Internal Server Error
 */
router.delete('/:childId/activities/:activityId', protect, activityIdValidator, removeActivityFromChild);

/**
 * @swagger
 * /api/children/{childId}/activities/{activityId}/status:
 *   put:
 *     summary: Update activity status
 *     description: Update the status of an activity assignment
 *     tags: [Child Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [scheduled, in-progress, completed, cancelled]
 *                 description: New status
 *               progress:
 *                 type: object
 *                 description: Progress data
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 description: Updated notes
 *     responses:
 *       200:
 *         description: Activity status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                     progress:
 *                       type: object
 *                     notes:
 *                       type: string
 *                     completedAt:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Activity assignment not found
 *       500:
 *         description: Internal Server Error
 */
router.put('/:childId/activities/:activityId/status', protect, authorize('therapist', 'superuser'), updateStatusValidator, updateActivityStatus);

module.exports = router;
