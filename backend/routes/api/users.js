const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { protect } = require('../../middleware/auth');
const { handleValidationErrors } = require('../../middleware/validation');
const { createPatientDocUploader } = require('../../middleware/upload');

const {
  getUserProfile,
  updateUserProfile,
  changePassword,
  uploadProfilePicture
} = require('../../controllers/usersController');

// Profile picture uploader
const profilePicUploader = createPatientDocUploader({ 
  maxSizeMB: 5, 
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'] 
});

// ==================== VALIDATORS ====================
const userIdValidator = [
  param('userId').isMongoId().withMessage('Invalid user ID format'),
  handleValidationErrors
];

const updateProfileValidators = [
  param('userId').isMongoId().withMessage('Invalid user ID format'),
  body('name').optional().isString().trim().isLength({ min: 2, max: 100 }),
  body('firstName').optional().isString().trim().isLength({ min: 2, max: 50 }),
  body('lastName').optional().isString().trim().isLength({ min: 2, max: 50 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().isMobilePhone(),
  body('phoneNumber').optional().isMobilePhone(),
  body('dateOfBirth').optional().isISO8601(),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer-not-to-say']),
  body('bio').optional().isString().isLength({ max: 500 }),
  body('profilePic').optional().isString(),
  body('profilePicture').optional().isString(),
  handleValidationErrors
];

const changePasswordValidators = [
  param('userId').isMongoId().withMessage('Invalid user ID format'),
  body('oldPassword').notEmpty().withMessage('Old password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  handleValidationErrors
];

// ==================== ROUTES ====================

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve user profile by ID. Users can view their own profile, therapists can view assigned patients, superusers can view anyone.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         example: 60f7b3b3b3b3b3b3b3b3b3b3
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
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
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     role:
 *                       type: string
 *                     profilePic:
 *                       type: string
 *                     joinDate:
 *                       type: string
 *                       format: date-time
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.get('/:userId', protect, userIdValidator, getUserProfile);

/**
 * @swagger
 * /api/users/{userId}:
 *   put:
 *     summary: Update user profile
 *     description: Update user profile. Users can only update their own profile unless superuser.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               profilePic:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.put('/:userId', protect, updateProfileValidators, updateUserProfile);

/**
 * @swagger
 * /api/users/{userId}/password:
 *   put:
 *     summary: Change user password
 *     description: Change user password. Users must provide old password unless superuser.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password is incorrect
 *       403:
 *         description: Access denied
 */
router.put('/:userId/password', protect, changePasswordValidators, changePassword);

/**
 * @swagger
 * /api/users/{userId}/upload-profile-pic:
 *   post:
 *     summary: Upload profile picture
 *     description: Upload user profile picture. Users can only upload their own picture unless superuser.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Picture uploaded successfully
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
 *                     profilePicUrl:
 *                       type: string
 */
router.post('/:userId/upload-profile-pic', protect, userIdValidator, profilePicUploader.single('file'), uploadProfilePicture);

module.exports = router;

