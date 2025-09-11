const User = require('../models/User');
const { sendToTokens } = require('../utils/notifications');

// ==================== POST /api/notifications/register-token ====================
// Body: { token: string, userId?: string }
// If userId is provided and requester is superuser/therapist (and owns patient), allow registering for that user.
// Otherwise, registers the token for the current user.
exports.registerToken = async (req, res) => {
  try {
    const { token, userId } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid token' });
    }

    let targetUserId = req.user._id;

    if (userId) {
      // Permission check: superuser can set anyone; therapist can set assigned patients; user can set self
      if (req.user.role === 'superuser') {
        targetUserId = userId;
      } else if (req.user.role === 'therapist') {
        const isAssigned = req.user.assignedPatients?.some(id => id.toString() === userId);
        if (!isAssigned) return res.status(403).json({ success: false, message: 'Not allowed for this user' });
        targetUserId = userId;
      } else if (req.user._id.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Not allowed for this user' });
      } else {
        targetUserId = userId;
      }
    }

    const target = await User.findById(targetUserId);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });

    const tokens = new Set(target.deviceTokens || []);
    tokens.add(token);
    target.deviceTokens = Array.from(tokens);
    await target.save();

    return res.status(200).json({ success: true, message: 'Token registered', deviceTokens: target.deviceTokens });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== POST /api/notifications/test ====================
// Body: { userId?: string, title?: string, body?: string }
exports.sendTest = async (req, res) => {
  try {
    const { userId, title = 'Test', body = 'Hello from backend' } = req.body;

    let targetUserId = userId || req.user._id;

    // Permission similar to registerToken
    if (userId && req.user.role !== 'superuser') {
      if (req.user.role === 'therapist') {
        const isAssigned = req.user.assignedPatients?.some(id => id.toString() === userId);
        if (!isAssigned) return res.status(403).json({ success: false, message: 'Not allowed for this user' });
      } else if (req.user._id.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Not allowed for this user' });
      }
    }

    const target = await User.findById(targetUserId);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });
    const tokens = target.deviceTokens || [];
    if (!tokens.length) return res.status(400).json({ success: false, message: 'No device tokens registered for this user' });

    const result = await sendToTokens(tokens, { title, body }, { screen: 'ActivityDetail' });
    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
