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
  uploadCompletion,
  getActivitySchedule,
  getActivityStats,
  createActivitySession
} = require('../../controllers/activitiesController');

/**
 * @swagger
 * /api/activities:
 *   get:
 *     summary: Get all activities
 *     description: Retrieve all activities with optional filtering
 *     tags: [Activities]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *         description: Filter by activity status
 *       - in: query
 *         name: difficultyLevel
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         description: Filter by difficulty level
 *       - in: query
 *         name: minAge
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 18
 *         description: Minimum age filter
 *       - in: query
 *         name: maxAge
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 18
 *         description: Maximum age filter
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: Activities retrieved successfully
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
 *                   example: 5
 *                 activities:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Activity'
 */
router.get('/', [
  query('status').optional().isIn(['draft','published','archived']),
  query('difficultyLevel').optional().isIn(['beginner','intermediate','advanced']),
  query('minAge').optional().isInt({ min: 1, max: 18 }),
  query('maxAge').optional().isInt({ min: 1, max: 18 }),
  query('q').optional().isString(),
  query('category').optional().isString(),
  handleValidationErrors
], getAllActivities);

/**
 * @swagger
 * /api/activities/schedule:
 *   get:
 *     summary: Get activity schedules
 *     description: Retrieve activity schedules from assignments. Therapists see their assignments, children see their own.
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Schedules retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: act_001
 *                       childName:
 *                         type: string
 *                         example: John Doe
 *                       therapistName:
 *                         type: string
 *                         example: Dr. Smith
 *                       activityName:
 *                         type: string
 *                         example: Speech Therapy
 *                       time:
 *                         type: string
 *                         example: 08:00 AM
 *                       status:
 *                         type: string
 *                         enum: [assigned, in-progress, completed, cancelled]
 *                       color:
 *                         type: string
 *                         example: "#FF6B6B"
 */
router.get('/schedule', protect, getActivitySchedule);

/**
 * @swagger
 * /api/activities/stats:
 *   get:
 *     summary: Get activity statistics
 *     description: Retrieve activity statistics (total therapists, children enrolled, active/pending programs)
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                     totalTherapist:
 *                       type: number
 *                       example: 20
 *                     childrenEnrolled:
 *                       type: number
 *                       example: 40
 *                     activeProgram:
 *                       type: number
 *                       example: 35
 *                     pendingProgram:
 *                       type: number
 *                       example: 20
 */
router.get('/stats', protect, getActivityStats);

/**
 * @swagger
 * /api/activities/create:
 *   post:
 *     summary: Create activity session
 *     description: Create a new activity session/assignment
 *     tags: [Activities]
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
 *               - therapistId
 *               - sessionTime
 *             properties:
 *               childId:
 *                 type: string
 *                 description: Child ID
 *               therapistId:
 *                 type: string
 *                 description: Therapist ID
 *               sessionTime:
 *                 type: string
 *                 format: date-time
 *                 description: Session time
 *               activityType:
 *                 type: string
 *                 description: Type of activity
 *               notes:
 *                 type: string
 *                 description: Session notes
 *     responses:
 *       201:
 *         description: Activity created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/create', protect, authorize('therapist', 'superuser'), createActivitySession);

/**
 * @swagger
 * /api/activities/category/{category}:
 *   get:
 *     summary: Get activities by category
 *     description: Retrieve activities filtered by specific category
 *     tags: [Activities]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         example: fine-motor
 *         description: Activity category
 *     responses:
 *       200:
 *         description: Activities retrieved successfully
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
 *                 activities:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Activity'
 *       400:
 *         description: Invalid category
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/category/:category', [
  param('category').isString().isLength({ min: 1 }),
  handleValidationErrors
], getByCategory);

/**
 * @swagger
 * /api/activities:
 *   post:
 *     summary: Create activity
 *     description: Create a new activity (therapist only)
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - subcategory
 *               - difficultyLevel
 *               - ageRange
 *               - thumbnailImage
 *               - estimatedDuration
 *             properties:
 *               title:
 *                 type: string
 *                 example: Fine Motor Skills - Button Practice
 *               description:
 *                 type: string
 *                 example: Practice buttoning and unbuttoning to improve fine motor skills
 *               category:
 *                 type: string
 *                 example: fine-motor
 *               subcategory:
 *                 type: string
 *                 example: dressing-skills
 *               difficultyLevel:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 example: beginner
 *               ageRange:
 *                 type: object
 *                 properties:
 *                   min:
 *                     type: number
 *                     example: 3
 *                   max:
 *                     type: number
 *                     example: 8
 *               instructions:
 *                 type: string
 *                 example: Step-by-step instructions for the activity
 *               thumbnailImage:
 *                 type: string
 *                 example: https://example.com/activity.jpg
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [https://example.com/video.mp4]
 *               estimatedDuration:
 *                 type: number
 *                 example: 15
 *               materials:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [buttons, shirt, mirror]
 *               scoringCriteria:
 *                 type: string
 *                 enum: [percentage, points, completion, time-based, observation]
 *                 example: completion
 *               maxScore:
 *                 type: number
 *                 example: 100
 *               passingScore:
 *                 type: number
 *                 example: 70
 *               tasks:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [Button 5 buttons, Unbutton 3 buttons]
 *               therapyGoals:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [Improve fine motor control, Enhance independence]
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 example: published
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               visibility:
 *                 type: string
 *                 enum: [public, private]
 *                 example: public
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [fine-motor, dressing]
 *     responses:
 *       201:
 *         description: Activity created successfully
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
 *                   example: Activity created successfully
 *                 activity:
 *                   $ref: '#/components/schemas/Activity'
 *       403:
 *         description: Forbidden - Therapist role required
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

/**
 * @swagger
 * /api/activities/{id}:
 *   put:
 *     summary: Update activity
 *     description: Update an existing activity (therapist/superuser only)
 *     tags: [Activities]
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
 *               title:
 *                 type: string
 *                 example: Updated Fine Motor Skills Activity
 *               description:
 *                 type: string
 *                 example: Updated description
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 example: published
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Activity updated successfully
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
 *                   example: Activity updated successfully
 *                 activity:
 *                   $ref: '#/components/schemas/Activity'
 *       403:
 *         description: Forbidden - Therapist/Superuser role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Activity not found
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
], updateActivity);

/**
 * @swagger
 * /api/activities/{id}/upload:
 *   post:
 *     summary: Upload activity completion
 *     description: Upload completion artifacts for an activity
 *     tags: [Activities]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Activity completion file (image, video, audio, PDF)
 *     responses:
 *       200:
 *         description: File uploaded successfully
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
 *                   example: File uploaded successfully
 *                 fileUrl:
 *                   type: string
 *                   example: /uploads/activity-completion/filename.jpg
 *       400:
 *         description: Invalid file or activity
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Activity not found
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
router.post('/:id/upload', protect, [
  param('id').isMongoId(),
  handleValidationErrors
], uploader.single('file'), uploadCompletion);

module.exports = router;
