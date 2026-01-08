const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const { protect } = require('../../middleware/auth');
const { handleValidationErrors, allowOnlyBodyKeys } = require('../../middleware/validation');
const { registerToken, sendTest } = require('../../controllers/notificationsController');

/**
 * @swagger
 * /api/notifications/register-token:
 *   post:
 *     summary: Register FCM device token
 *     description: Register a Firebase Cloud Messaging device token for push notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: fCM_TOKEN_HERE_1234567890
 *                 description: FCM registration token from client device
 *               userId:
 *                 type: string
 *                 example: 60f7b3b3b3b3b3b3b3b3b3b3
 *                 description: User ID (optional, defaults to current user)
 *     responses:
 *       200:
 *         description: Token registered successfully
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
 *                   example: Device token registered successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid token
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
router.post('/register-token', protect, [
  allowOnlyBodyKeys(['token','userId']),
  body('token').isString().isLength({ min: 10 }),
  body('userId').optional().isMongoId(),
  handleValidationErrors
], registerToken);

/**
 * @swagger
 * /api/notifications/test:
 *   post:
 *     summary: Send test push notification
 *     description: Send a test push notification to a user's device
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 60f7b3b3b3b3b3b3b3b3b3b3
 *                 description: User ID to send notification to (optional, defaults to current user)
 *               title:
 *                 type: string
 *                 example: Test Notification
 *                 description: Notification title (optional)
 *               body:
 *                 type: string
 *                 example: This is a test push notification
 *                 description: Notification body (optional)
 *     responses:
 *       200:
 *         description: Test notification sent successfully
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
 *                   example: Test notification sent successfully
 *                 response:
 *                   type: object
 *                   properties:
 *                     successCount:
 *                       type: number
 *                       example: 1
 *                     failureCount:
 *                       type: number
 *                       example: 0
 *       400:
 *         description: Invalid parameters or no device tokens
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
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
router.post('/test', protect, [
  allowOnlyBodyKeys(['userId','title','body']),
  body('userId').optional().isMongoId(),
  body('title').optional().isString(),
  body('body').optional().isString(),
  handleValidationErrors
], sendTest);

module.exports = router;
