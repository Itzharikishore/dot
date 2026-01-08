const express = require('express');
const router = express.Router();
const { param, body, query } = require('express-validator');

const { protect, authorize } = require('../../middleware/auth');
const { handleValidationErrors } = require('../../middleware/validation');
const {
  getAlerts,
  markAsRead,
  markAllAsRead,
  deleteAlert,
  clearAllAlerts,
  createAlert,
  getUnreadCount
} = require('../../controllers/alertsController');

// ==================== VALIDATORS ====================
const alertIdValidator = [
  param('id').isMongoId().withMessage('Invalid alert ID'),
  handleValidationErrors
];

const createAlertValidator = [
  body('title').isString().trim().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
  body('message').isString().trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be 1-1000 characters'),
  body('type').optional().isIn(['info', 'warning', 'error', 'success', 'reminder', 'appointment', 'progress', 'system']).withMessage('Invalid alert type'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('userId').isMongoId().withMessage('Invalid user ID'),
  body('actionUrl').optional().isURL().withMessage('Invalid action URL'),
  body('actionText').optional().isString().trim().isLength({ max: 50 }).withMessage('Action text must be max 50 characters'),
  handleValidationErrors
];

// ==================== ROUTES ====================

/**
 * @swagger
 * /api/alerts:
 *   get:
 *     summary: Get user alerts
 *     description: Fetch all alerts for the authenticated user with pagination and filtering
 *     tags: [Alerts]
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
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [info, warning, error, success, reminder, appointment, progress, system]
 *         description: Filter by alert type
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority
 *     responses:
 *       200:
 *         description: Alerts fetched successfully
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
 *                       title:
 *                         type: string
 *                       message:
 *                         type: string
 *                       type:
 *                         type: string
 *                       priority:
 *                         type: string
 *                       isRead:
 *                         type: boolean
 *                       date:
 *                         type: string
 *                       actionUrl:
 *                         type: string
 *                       actionText:
 *                         type: string
 *                       metadata:
 *                           type: object
 *                       expiresAt:
 *                         type: string
 *                 unreadCount:
 *                   type: integer
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.get('/', protect, getAlerts);

/**
 * @swagger
 * /api/alerts/unread-count:
 *   get:
 *     summary: Get unread alerts count
 *     description: Get the count of unread alerts for the authenticated user
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count fetched successfully
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
 *                     unreadCount:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.get('/unread-count', protect, getUnreadCount);

/**
 * @swagger
 * /api/alerts/{id}/read:
 *   put:
 *     summary: Mark alert as read
 *     description: Mark a specific alert as read
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Alert ID
 *     responses:
 *       200:
 *         description: Alert marked as read successfully
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
 *         description: Invalid alert ID
 *       404:
 *         description: Alert not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.put('/:id/read', protect, alertIdValidator, markAsRead);

/**
 * @swagger
 * /api/alerts/mark-all-read:
 *   put:
 *     summary: Mark all alerts as read
 *     description: Mark all unread alerts as read for the authenticated user
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All alerts marked as read successfully
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
 *                     modifiedCount:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.put('/mark-all-read', protect, markAllAsRead);

/**
 * @swagger
 * /api/alerts/{id}:
 *   delete:
 *     summary: Delete alert
 *     description: Delete a specific alert (soft delete)
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Alert ID
 *     responses:
 *       200:
 *         description: Alert deleted successfully
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
 *         description: Invalid alert ID
 *       404:
 *         description: Alert not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.delete('/:id', protect, alertIdValidator, deleteAlert);

/**
 * @swagger
 * /api/alerts/clear-all:
 *   delete:
 *     summary: Clear all alerts
 *     description: Clear all alerts for the authenticated user (soft delete)
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All alerts cleared successfully
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
 *                     clearedCount:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.delete('/clear-all', protect, clearAllAlerts);

/**
 * @swagger
 * /api/alerts:
 *   post:
 *     summary: Create alert
 *     description: Create a new alert (admin/superuser only)
 *     tags: [Alerts]
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
 *               - message
 *               - userId
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 description: Alert title
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Alert message
 *               type:
 *                 type: string
 *                 enum: [info, warning, error, success, reminder, appointment, progress, system]
 *                 default: info
 *                 description: Alert type
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *                 description: Alert priority
 *               userId:
 *                 type: string
 *                 description: Target user ID
 *               actionUrl:
 *                 type: string
 *                 format: uri
 *                 description: Optional action URL
 *               actionText:
 *                 type: string
 *                 maxLength: 50
 *                 description: Optional action button text
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Optional expiration date
 *     responses:
 *       201:
 *         description: Alert created successfully
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
 *                     title:
 *                       type: string
 *                     message:
 *                       type: string
 *                     type:
 *                       type: string
 *                     priority:
 *                       type: string
 *                     isRead:
 *                       type: boolean
 *                     date:
 *                       type: string
 *                     actionUrl:
 *                       type: string
 *                     actionText:
 *                       type: string
 *                     metadata:
 *                       type: object
 *                     expiresAt:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal Server Error
 */
router.post('/', protect, authorize('superuser', 'hospital'), createAlertValidator, createAlert);

module.exports = router;
