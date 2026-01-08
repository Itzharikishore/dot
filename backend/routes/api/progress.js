const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

const { protect, authorize } = require('../../middleware/auth');
const { handleValidationErrors } = require('../../middleware/validation');
const {
  validateCreateProgress,
  validateUpdateProgress,
  validateReviewProgress,
  validateProgressId,
  validateUserId,
  validateProgramId,
  validateProgressQuery,
  validateMilestoneCustom,
  sanitizeProgressInput
} = require('../../utils/progressValidators');

const {
  createProgress,
  getUserProgress,
  getProgramProgress,
  updateProgress,
  deleteProgress,
  getProgressById,
  reviewProgress,
  getActivityCompletionStats,
  getChildrenCompletionSummary,
  getChildActivityDetails
} = require('../../controllers/progressController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Progress:
 *       type: object
 *       required:
 *         - userId
 *         - programId
 *         - progressPercentage
 *       properties:
 *         _id:
 *           type: string
 *           description: Progress entry ID
 *           example: 60f7b3b3b3b3b3b3b3b3b3b3
 *         userId:
 *           type: string
 *           description: User ID
 *           example: 60f7b3b3b3b3b3b3b3b3b3b3
 *         programId:
 *           type: string
 *           description: Home Program ID
 *           example: 60f7b3b3b3b3b3b3b3b3b3b3
 *         activityId:
 *           type: string
 *           description: Activity ID (optional)
 *           example: 60f7b3b3b3b3b3b3b3b3b3b3
 *         progressPercentage:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Progress percentage
 *           example: 75
 *         completedTasks:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of completed task names
 *           example: ["Task 1", "Task 2", "Task 3"]
 *         notes:
 *           type: string
 *           maxLength: 1000
 *           description: Progress notes
 *           example: "Making good progress on this activity"
 *         milestone:
 *           type: string
 *           enum: [started, quarter, half, three-quarters, completed, custom]
 *           description: Progress milestone
 *           example: "three-quarters"
 *         customMilestone:
 *           type: string
 *           maxLength: 100
 *           description: Custom milestone description
 *           example: "Reached intermediate level"
 *         score:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Score achieved
 *           example: 85
 *         timeSpent:
 *           type: number
 *           minimum: 0
 *           description: Time spent in minutes
 *           example: 45
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *           description: Difficulty level
 *           example: "medium"
 *         mood:
 *           type: string
 *           enum: [excellent, good, okay, difficult, frustrated]
 *           description: User mood during activity
 *           example: "good"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Progress tags
 *           example: ["math", "concentration"]
 *         isPublic:
 *           type: boolean
 *           description: Whether progress is public
 *           example: false
 *         status:
 *           type: string
 *           enum: [draft, submitted, reviewed, approved]
 *           description: Progress status
 *           example: "submitted"
 *         reviewedBy:
 *           type: string
 *           description: Reviewer user ID
 *           example: 60f7b3b3b3b3b3b3b3b3b3b3
 *         reviewedAt:
 *           type: string
 *           format: date-time
 *           description: Review timestamp
 *           example: "2024-01-15T10:30:00Z"
 *         reviewNotes:
 *           type: string
 *           maxLength: 500
 *           description: Review notes
 *           example: "Excellent progress, keep it up!"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *           example: "2024-01-15T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-01-15T10:30:00Z"
 *         formattedProgress:
 *           type: string
 *           description: Formatted progress percentage
 *           example: "75%"
 *         timeSpentHours:
 *           type: number
 *           description: Time spent in hours
 *           example: 0.75
 */

/**
 * @swagger
 * /api/progress:
 *   post:
 *     summary: Create new progress entry
 *     description: Add a new progress entry for a user in a specific program
 *     tags: [Progress Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - programId
 *               - progressPercentage
 *             properties:
 *               programId:
 *                 type: string
 *                 example: 60f7b3b3b3b3b3b3b3b3b3b3
 *                 description: Home Program ID
 *               activityId:
 *                 type: string
 *                 example: 60f7b3b3b3b3b3b3b3b3b3b3
 *                 description: Activity ID (optional)
 *               progressPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 75
 *                 description: Progress percentage
 *               completedTasks:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Task 1", "Task 2"]
 *                 description: Array of completed task names
 *               notes:
 *                 type: string
 *                 example: "Making good progress"
 *                 description: Progress notes
 *               milestone:
 *                 type: string
 *                 enum: [started, quarter, half, three-quarters, completed, custom]
 *                 example: "three-quarters"
 *                 description: Progress milestone
 *               customMilestone:
 *                 type: string
 *                 example: "Reached intermediate level"
 *                 description: Custom milestone (required if milestone is 'custom')
 *               score:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 85
 *                 description: Score achieved
 *               timeSpent:
 *                 type: number
 *                 minimum: 0
 *                 example: 45
 *                 description: Time spent in minutes
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 example: "medium"
 *                 description: Difficulty level
 *               mood:
 *                 type: string
 *                 enum: [excellent, good, okay, difficult, frustrated]
 *                 example: "good"
 *                 description: User mood
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["math", "concentration"]
 *                 description: Progress tags
 *               isPublic:
 *                 type: boolean
 *                 example: false
 *                 description: Whether progress is public
 *     responses:
 *       201:
 *         description: Progress entry created successfully
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
 *                   example: Progress entry created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Progress'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation failed
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied
 *       404:
 *         description: Program not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Program not found
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied. No token provided.
 */
router.post('/', protect, [
  ...validateCreateProgress,
  validateMilestoneCustom,
  sanitizeProgressInput,
  handleValidationErrors
], createProgress);

/**
 * @swagger
 * /api/progress/{userId}:
 *   get:
 *     summary: Get all progress records of a user
 *     description: Retrieve all progress entries for a specific user with pagination and filtering
 *     tags: [Progress Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         example: 60f7b3b3b3b3b3b3b3b3b3b3
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of entries per page
 *       - in: query
 *         name: programId
 *         schema:
 *           type: string
 *         description: Filter by program ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, submitted, reviewed, approved]
 *         description: Filter by status
 *       - in: query
 *         name: milestone
 *         schema:
 *           type: string
 *           enum: [started, quarter, half, three-quarters, completed, custom]
 *         description: Filter by milestone
 *     responses:
 *       200:
 *         description: Progress records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     progress:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Progress'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *                         totalEntries:
 *                           type: integer
 *                           example: 50
 *                         hasNext:
 *                           type: boolean
 *                           example: true
 *                         hasPrev:
 *                           type: boolean
 *                           example: false
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalEntries:
 *                           type: integer
 *                           example: 50
 *                         averageProgress:
 *                           type: number
 *                           example: 75.5
 *                         maxProgress:
 *                           type: number
 *                           example: 100
 *                         totalTimeSpent:
 *                           type: number
 *                           example: 1200
 *                         completedMilestones:
 *                           type: integer
 *                           example: 10
 *                         lastUpdated:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Invalid userId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid userId
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied. No token provided.
 */
router.get('/:userId', protect, [
  ...validateUserId,
  ...validateProgressQuery,
  handleValidationErrors
], getUserProgress);

/**
 * @swagger
 * /api/progress/{userId}/{programId}:
 *   get:
 *     summary: Get progress for a specific program
 *     description: Retrieve all progress entries for a user in a specific program
 *     tags: [Progress Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         example: 60f7b3b3b3b3b3b3b3b3b3b3
 *         description: User ID
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *         example: 60f7b3b3b3b3b3b3b3b3b3b3
 *         description: Program ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of entries per page
 *     responses:
 *       200:
 *         description: Program progress retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     program:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: 60f7b3b3b3b3b3b3b3b3b3b3
 *                         title:
 *                           type: string
 *                           example: "Week 1 Home Program"
 *                         description:
 *                           type: string
 *                           example: "Focus on phonics and memory"
 *                         status:
 *                           type: string
 *                           example: "active"
 *                     progress:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Progress'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 3
 *                         totalEntries:
 *                           type: integer
 *                           example: 25
 *                         hasNext:
 *                           type: boolean
 *                           example: true
 *                         hasPrev:
 *                           type: boolean
 *                           example: false
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalEntries:
 *                           type: integer
 *                           example: 25
 *                         averageProgress:
 *                           type: number
 *                           example: 75.5
 *                         maxProgress:
 *                           type: number
 *                           example: 100
 *                         totalTimeSpent:
 *                           type: number
 *                           example: 600
 *                         completedMilestones:
 *                           type: integer
 *                           example: 5
 *                         lastUpdated:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Invalid userId or programId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid userId or programId
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied
 *       404:
 *         description: Program not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Program not found
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied. No token provided.
 */
router.get('/:userId/:programId', protect, [
  ...validateUserId,
  ...validateProgramId,
  ...validateProgressQuery,
  handleValidationErrors
], getProgramProgress);

/**
 * @swagger
 * /api/progress/{progressId}:
 *   get:
 *     summary: Get single progress entry
 *     description: Retrieve a specific progress entry by ID
 *     tags: [Progress Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: progressId
 *         required: true
 *         schema:
 *           type: string
 *         example: 60f7b3b3b3b3b3b3b3b3b3b3
 *         description: Progress entry ID
 *     responses:
 *       200:
 *         description: Progress entry retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Progress'
 *       400:
 *         description: Invalid progressId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid progressId
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied
 *       404:
 *         description: Progress entry not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Progress entry not found
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied. No token provided.
 */
router.get('/entry/:progressId', protect, [
  ...validateProgressId,
  handleValidationErrors
], getProgressById);

/**
 * @swagger
 * /api/progress/{progressId}:
 *   put:
 *     summary: Update progress entry
 *     description: Update an existing progress entry
 *     tags: [Progress Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: progressId
 *         required: true
 *         schema:
 *           type: string
 *         example: 60f7b3b3b3b3b3b3b3b3b3b3
 *         description: Progress entry ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               progressPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 80
 *                 description: Updated progress percentage
 *               completedTasks:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Task 1", "Task 2", "Task 3"]
 *                 description: Updated completed tasks
 *               notes:
 *                 type: string
 *                 example: "Updated progress notes"
 *                 description: Updated notes
 *               milestone:
 *                 type: string
 *                 enum: [started, quarter, half, three-quarters, completed, custom]
 *                 example: "completed"
 *                 description: Updated milestone
 *               customMilestone:
 *                 type: string
 *                 example: "Reached advanced level"
 *                 description: Updated custom milestone
 *               score:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 90
 *                 description: Updated score
 *               timeSpent:
 *                 type: number
 *                 minimum: 0
 *                 example: 60
 *                 description: Updated time spent
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 example: "hard"
 *                 description: Updated difficulty
 *               mood:
 *                 type: string
 *                 enum: [excellent, good, okay, difficult, frustrated]
 *                 example: "excellent"
 *                 description: Updated mood
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["math", "concentration", "advanced"]
 *                 description: Updated tags
 *               isPublic:
 *                 type: boolean
 *                 example: true
 *                 description: Updated public status
 *     responses:
 *       200:
 *         description: Progress updated successfully
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
 *                   example: Progress updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Progress'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation failed
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied
 *       404:
 *         description: Progress entry not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Progress entry not found
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied. No token provided.
 */
router.put('/:progressId', protect, [
  ...validateProgressId,
  ...validateUpdateProgress,
  validateMilestoneCustom,
  sanitizeProgressInput,
  handleValidationErrors
], updateProgress);

/**
 * @swagger
 * /api/progress/{progressId}:
 *   delete:
 *     summary: Delete progress entry
 *     description: Remove a progress entry
 *     tags: [Progress Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: progressId
 *         required: true
 *         schema:
 *           type: string
 *         example: 60f7b3b3b3b3b3b3b3b3b3b3
 *         description: Progress entry ID
 *     responses:
 *       200:
 *         description: Progress entry deleted successfully
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
 *                   example: Progress entry deleted successfully
 *       400:
 *         description: Invalid progressId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid progressId
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied
 *       404:
 *         description: Progress entry not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Progress entry not found
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied. No token provided.
 */
router.delete('/:progressId', protect, [
  ...validateProgressId,
  handleValidationErrors
], deleteProgress);

/**
 * @swagger
 * /api/progress/{progressId}/review:
 *   post:
 *     summary: Review progress entry
 *     description: Review a progress entry (therapist/superuser only)
 *     tags: [Progress Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: progressId
 *         required: true
 *         schema:
 *           type: string
 *         example: 60f7b3b3b3b3b3b3b3b3b3b3
 *         description: Progress entry ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, submitted, reviewed, approved]
 *                 example: "reviewed"
 *                 description: Review status
 *               reviewNotes:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Excellent progress, keep it up!"
 *                 description: Review notes
 *     responses:
 *       200:
 *         description: Progress reviewed successfully
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
 *                   example: Progress reviewed successfully
 *                 data:
 *                   $ref: '#/components/schemas/Progress'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation failed
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 *       403:
 *         description: Access denied - Only therapists and superusers can review
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Only therapists and superusers can review progress
 *       404:
 *         description: Progress entry not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Progress entry not found
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied. No token provided.
 */
router.post('/:progressId/review', protect, authorize('therapist', 'superuser'), [
  ...validateProgressId,
  ...validateReviewProgress,
  handleValidationErrors
], reviewProgress);

/**
 * @swagger
 * /api/progress/{userId}/activity-completion:
 *   get:
 *     summary: Get detailed activity completion statistics for a child
 *     description: Retrieve comprehensive activity completion data including assignments, programs, and progress entries
 *     tags: [Progress Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         example: 60f7b3b3b3b3b3b3b3b3b3b3
 *         description: Child user ID
 *       - in: query
 *         name: programId
 *         schema:
 *           type: string
 *         description: Filter by specific program ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter activities from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter activities until this date
 *     responses:
 *       200:
 *         description: Activity completion statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     child:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalActivitiesAssigned:
 *                           type: integer
 *                           example: 15
 *                         completedAssignments:
 *                           type: integer
 *                           example: 12
 *                         totalProgramActivities:
 *                           type: integer
 *                           example: 20
 *                         completedProgramActivities:
 *                           type: integer
 *                           example: 18
 *                         completionRate:
 *                           type: number
 *                           example: 85.7
 *                         averageProgressPercentage:
 *                           type: number
 *                           example: 78.5
 *                         totalTimeSpent:
 *                           type: number
 *                           example: 450
 *                         averageScore:
 *                           type: number
 *                           example: 82.3
 *                     recentCompletions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [assignment, program]
 *                           activityId:
 *                             type: object
 *                           completedAt:
 *                             type: string
 *                             format: date-time
 *                           score:
 *                             type: number
 *                           notes:
 *                             type: string
 *                     activityBreakdown:
 *                       type: object
 *                       additionalProperties:
 *                         type: object
 *                         properties:
 *                           total:
 *                             type: integer
 *                           completed:
 *                             type: integer
 *                     assignments:
 *                       type: array
 *                       items:
 *                         type: object
 *                     programs:
 *                       type: array
 *                       items:
 *                         type: object
 *                     progressEntries:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Invalid userId
 *       403:
 *         description: Access denied
 *       401:
 *         description: Unauthorized
 */
router.get('/:userId/activity-completion', protect, [
  ...validateUserId,
  handleValidationErrors
], getActivityCompletionStats);

/**
 * @swagger
 * /api/progress/children/completion-summary:
 *   get:
 *     summary: Get completion summary for all children
 *     description: Retrieve activity completion summary for all children (therapist/superuser only)
 *     tags: [Progress Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of children per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [completionRate, totalActivities, completedActivities, averageProgress]
 *           default: completionRate
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Children completion summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     children:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           joinedAt:
 *                             type: string
 *                             format: date-time
 *                           statistics:
 *                             type: object
 *                             properties:
 *                               totalActivities:
 *                                 type: integer
 *                               completedActivities:
 *                                 type: integer
 *                               completionRate:
 *                                 type: number
 *                               averageProgress:
 *                                 type: number
 *                               totalAssignments:
 *                                 type: integer
 *                               completedAssignments:
 *                                 type: integer
 *                               totalPrograms:
 *                                 type: integer
 *                               activePrograms:
 *                                 type: integer
 *                               totalProgressEntries:
 *                                 type: integer
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalChildren:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalChildren:
 *                           type: integer
 *                         averageCompletionRate:
 *                           type: number
 *                         totalActivities:
 *                           type: integer
 *                         totalCompleted:
 *                           type: integer
 *       403:
 *         description: Access denied - Only therapists and superusers can view all children
 *       401:
 *         description: Unauthorized
 */
router.get('/children/completion-summary', protect, authorize('therapist', 'superuser'), [
  ...validateProgressQuery,
  handleValidationErrors
], getChildrenCompletionSummary);

/**
 * @swagger
 * /api/progress/{userId}/activity-details:
 *   get:
 *     summary: Get detailed activity completion information for a specific child
 *     description: Retrieve detailed activity completion timeline and statistics for a child
 *     tags: [Progress Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         example: 60f7b3b3b3b3b3b3b3b3b3b3
 *         description: Child user ID
 *       - in: query
 *         name: activityId
 *         schema:
 *           type: string
 *         description: Filter by specific activity ID
 *       - in: query
 *         name: programId
 *         schema:
 *           type: string
 *         description: Filter by specific program ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [assigned, in-progress, completed, cancelled]
 *         description: Filter by assignment status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by activity category
 *     responses:
 *       200:
 *         description: Child activity details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     child:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                     filters:
 *                       type: object
 *                       properties:
 *                         activityId:
 *                           type: string
 *                         programId:
 *                           type: string
 *                         status:
 *                           type: string
 *                         category:
 *                           type: string
 *                     timeline:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [assignment, program, progress]
 *                           activityId:
 *                             type: object
 *                           activityTitle:
 *                             type: string
 *                           completedAt:
 *                             type: string
 *                             format: date-time
 *                           score:
 *                             type: number
 *                           notes:
 *                             type: string
 *                           status:
 *                             type: string
 *                     activityStatistics:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           activityId:
 *                             type: object
 *                           activityTitle:
 *                             type: string
 *                           category:
 *                             type: string
 *                           difficulty:
 *                             type: string
 *                           totalAttempts:
 *                             type: integer
 *                           totalCompletions:
 *                             type: integer
 *                           averageScore:
 *                             type: number
 *                           lastCompleted:
 *                             type: string
 *                             format: date-time
 *                           completionHistory:
 *                             type: array
 *                             items:
 *                               type: object
 *                     assignments:
 *                       type: array
 *                       items:
 *                         type: object
 *                     programs:
 *                       type: array
 *                       items:
 *                         type: object
 *                     progressEntries:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Invalid userId
 *       403:
 *         description: Access denied
 *       401:
 *         description: Unauthorized
 */
router.get('/:userId/activity-details', protect, [
  ...validateUserId,
  handleValidationErrors
], getChildActivityDetails);

module.exports = router;