# Web FCM Demo

This mini demo helps you obtain a valid Web FCM registration token and receive notifications.

## Prerequisites
- Firebase project: `dot-occupational-therapy-dddc2`
- VAPID public key from Firebase Console → Cloud Messaging → Web configuration

## Configure
Edit both files and replace placeholders:
- `index.html`: `YOUR_WEB_API_KEY`, `YOUR_WEB_APP_ID`, `YOUR_VAPID_PUBLIC_KEY`
- `firebase-messaging-sw.js`: `YOUR_WEB_API_KEY`, `YOUR_WEB_APP_ID`

## Run locally
From this folder:

```bash
npx serve -p 8080
```

Open http://localhost:8080 and click "Get FCM Token". Copy the token.

## Verify in Firebase Console
- Cloud Messaging → Send test message → paste the token → Send.

## Register token in backend
POST http://localhost:5000/api/notifications/register-token

```json
{ "token": "PASTE_WEB_FCM_TOKEN", "userId": "<CHILD_USER_ID>" }
```

## Send test from backend
POST http://localhost:5000/api/notifications/test

```json
{ "userId": "<CHILD_USER_ID>", "title": "Test", "body": "Hello Web" }
```
