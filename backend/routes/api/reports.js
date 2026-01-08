const express = require('express');
const router = express.Router();
const { param, query } = require('express-validator');

const { protect, authorize } = require('../../middleware/auth');
const { handleValidationErrors } = require('../../middleware/validation');
const {
  getChildReport,
  getActivityReport,
  getProgressStatistics,
  getDetailedFeedback,
  compareChildReports,
  generatePDFReport,
  downloadReport
} = require('../../controllers/reportsController');

// ==================== VALIDATORS ====================
const childIdValidator = [
  param('childId').isMongoId().withMessage('Invalid child ID'),
  handleValidationErrors
];

const compareValidator = [
  query('child1Id').isMongoId().withMessage('Invalid child1Id'),
  query('child2Id').isMongoId().withMessage('Invalid child2Id'),
  handleValidationErrors
];

// ==================== ROUTES ====================

/**
 * @swagger
 * /api/reports/child/{childId}:
 *   get:
 *     summary: Get child report
 *     description: Fetch comprehensive report for a specific child
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *     responses:
 *       200:
 *         description: Child report fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     childId:
 *                       type: string
 *                     childName:
 *                       type: string
 *                     grade:
 *                       type: string
 *                     reportPeriod:
 *                       type: string
 *                     totalSessions:
 *                       type: integer
 *                     completedActivities:
 *                       type: integer
 *                     stagesOfPlay:
 *                       type: object
 *                     stagesOfCognitive:
 *                       type: object
 *                     feedback:
 *                       type: string
 *                     improvementAreas:
 *                       type: array
 *                       items:
 *                         type: string
 *                     strengths:
 *                       type: array
 *                       items:
 *                         type: string
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
router.get('/child/:childId', protect, childIdValidator, getChildReport);

/**
 * @swagger
 * /api/reports/activities/{childId}:
 *   get:
 *     summary: Get activity report
 *     description: Fetch activity-specific report for a child
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *     responses:
 *       200:
 *         description: Activity report fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     childId:
 *                       type: string
 *                     totalActivities:
 *                       type: integer
 *                     completedActivities:
 *                       type: integer
 *                     pendingActivities:
 *                       type: integer
 *                     activities:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           status:
 *                             type: string
 *                           date:
 *                             type: string
 *                           duration:
 *                             type: integer
 *                           therapist:
 *                             type: string
 *                     reportPeriod:
 *                       type: string
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
router.get('/activities/:childId', protect, childIdValidator, getActivityReport);

/**
 * @swagger
 * /api/reports/progress/{childId}:
 *   get:
 *     summary: Get progress statistics
 *     description: Fetch detailed progress statistics for a child
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *     responses:
 *       200:
 *         description: Progress statistics fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     childId:
 *                       type: string
 *                     progressMetrics:
 *                       type: object
 *                       properties:
 *                         stagesOfPlay:
 *                           type: object
 *                         stagesOfCognitive:
 *                           type: object
 *                     overallProgress:
 *                       type: number
 *                     lastUpdated:
 *                       type: string
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
router.get('/progress/:childId', protect, childIdValidator, getProgressStatistics);

/**
 * @swagger
 * /api/reports/feedback/{childId}:
 *   get:
 *     summary: Get detailed feedback
 *     description: Fetch detailed feedback and recommendations for a child
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *     responses:
 *       200:
 *         description: Detailed feedback fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     childId:
 *                       type: string
 *                     overallFeedback:
 *                       type: string
 *                     strengths:
 *                       type: array
 *                       items:
 *                         type: string
 *                     improvementAreas:
 *                       type: array
 *                       items:
 *                         type: string
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                     nextSteps:
 *                       type: string
 *                     feedbackDate:
 *                       type: string
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
router.get('/feedback/:childId', protect, childIdValidator, getDetailedFeedback);

/**
 * @swagger
 * /api/reports/compare:
 *   get:
 *     summary: Compare child reports
 *     description: Compare progress and performance between two children
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: child1Id
 *         required: true
 *         schema:
 *           type: string
 *         description: First child ID
 *       - in: query
 *         name: child2Id
 *         required: true
 *         schema:
 *           type: string
 *         description: Second child ID
 *     responses:
 *       200:
 *         description: Comparison report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     child1:
 *                       type: object
 *                       properties:
 *                         childId:
 *                           type: string
 *                         childName:
 *                           type: string
 *                         overallProgress:
 *                           type: number
 *                     child2:
 *                       type: object
 *                       properties:
 *                         childId:
 *                           type: string
 *                         childName:
 *                           type: string
 *                         overallProgress:
 *                           type: number
 *                     comparison:
 *                       type: object
 *                       properties:
 *                         progressDifference:
 *                           type: number
 *                         strengthComparison:
 *                           type: object
 *                         improvementComparison:
 *                           type: object
 *       400:
 *         description: Missing or invalid child IDs
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Child not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/compare', protect, compareValidator, compareChildReports);

/**
 * @swagger
 * /api/reports/generate-pdf/{childId}:
 *   post:
 *     summary: Generate PDF report
 *     description: Generate a PDF report for a specific child
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *     responses:
 *       200:
 *         description: PDF report generated successfully
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
 *                     reportId:
 *                       type: string
 *                     downloadUrl:
 *                       type: string
 *                     fileName:
 *                       type: string
 *                     generatedAt:
 *                       type: string
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
router.post('/generate-pdf/:childId', protect, childIdValidator, generatePDFReport);

/**
 * @swagger
 * /api/reports/{reportId}/download:
 *   get:
 *     summary: Download report
 *     description: Download a generated PDF report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: PDF file downloaded successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Report file not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.get('/:reportId/download', protect, downloadReport);

module.exports = router;
