const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const { protect } = require('../../middleware/auth');
const { handleValidationErrors, allowOnlyBodyKeys } = require('../../middleware/validation');
const { registerToken, sendTest } = require('../../controllers/notificationsController');

// Register device token
router.post('/register-token', protect, [
  allowOnlyBodyKeys(['token','userId']),
  body('token').isString().isLength({ min: 10 }),
  body('userId').optional().isMongoId(),
  handleValidationErrors
], registerToken);

// Send test push
router.post('/test', protect, [
  allowOnlyBodyKeys(['userId','title','body']),
  body('userId').optional().isMongoId(),
  body('title').optional().isString(),
  body('body').optional().isString(),
  handleValidationErrors
], sendTest);

module.exports = router;
