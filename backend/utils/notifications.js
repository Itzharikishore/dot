const { messaging } = require('../config/firebase');

// ==================== NOTIFICATIONS HELPER ====================
// sendToTokens: sends a push notification to a list of FCM tokens.
//
// Example usage:
// await sendToTokens(child.deviceTokens, {
//   title: 'New Activity Assigned',
//   body: 'Your therapist assigned a new activity. Tap to view.'
// }, { screen: 'ActivityDetail', activityId: '...' });

async function sendToTokens(tokens = [], notification = {}, data = {}) {
  if (!Array.isArray(tokens) || tokens.length === 0) return { successCount: 0, failureCount: 0 };

  const message = {
    tokens,
    notification,
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]))
  };

  try {
    const response = await messaging.sendEachForMulticast(message);
    return { successCount: response.successCount, failureCount: response.failureCount, responses: response.responses };
  } catch (err) {
    console.error('Notification send error:', err.message);
    return { successCount: 0, failureCount: tokens.length, error: err.message };
  }
}

module.exports = { sendToTokens };
