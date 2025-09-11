// This is a CLIENT-SIDE example for React Native apps using @react-native-firebase/messaging
// Place this file in your mobile app project (not in the Node.js backend).
// Usage:
// import { getFcmToken, onTokenRefresh } from './getFcmTokenExample';
// const token = await getFcmToken();
// const unsubscribe = onTokenRefresh(newToken => {/* send to backend */});

import messaging from '@react-native-firebase/messaging';

// Request notification permission (iOS prompts; Android typically auto-granted)
export async function requestNotificationPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                  authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  return { authStatus, enabled };
}

// Fetch the current FCM registration token
export async function getFcmToken() {
  const { enabled } = await requestNotificationPermission();
  if (!enabled) {
    throw new Error('Notifications permission not granted');
  }
  const token = await messaging().getToken();
  console.log('FCM token:', token);
  return token;
}

// Listen for token refresh events (tokens can rotate)
export function onTokenRefresh(callback) {
  // callback receives the new token string
  const unsubscribe = messaging().onTokenRefresh((token) => {
    console.log('FCM token refreshed:', token);
    try { callback && callback(token); } catch {}
  });
  return unsubscribe; // call unsubscribe() to stop listening
}

// Example helper to register the token with your backend API
export async function registerTokenWithBackend({ token, userId, apiBaseUrl, authToken }) {
  if (!token) throw new Error('Missing FCM token');
  if (!apiBaseUrl) throw new Error('Missing API base URL');
  try {
    const res = await fetch(`${apiBaseUrl}/api/users/device-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify({ token, userId })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Backend rejected token (${res.status}): ${text}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('Failed to register FCM token with backend:', err?.message || err);
    throw err;
  }
}
