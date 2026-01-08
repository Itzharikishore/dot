# Flutter API Compatibility Guide

## ✅ Password Reset API - Flutter Ready

The password reset API has been designed with Flutter frontend compatibility in mind.

---

## 🔗 API Endpoints

### 1. POST /api/auth/forgot-password

**Flutter-Compatible Response:**
```json
{
  "success": true,
  "message": "If an account exists with this email, a reset link has been sent to your email address."
}
```

**Features for Flutter:**
- ✅ Simple JSON response format
- ✅ Clear success/error indicators
- ✅ User-friendly messages
- ✅ No complex nested structures
- ✅ Consistent error format

**Flutter Usage:**
```dart
final response = await apiService.post('/api/auth/forgot-password', data: {
  'email': email,
});

if (response['success'] == true) {
  // Show success message
} else {
  // Show error: response['message']
}
```

---

### 2. POST /api/auth/reset-password

**Flutter-Compatible Response:**
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid or expired reset token. Please request a new password reset."
}
```

**Flutter Usage:**
```dart
final response = await apiService.post('/api/auth/reset-password', data: {
  'token': token,
  'password': newPassword,
});

if (response['success'] == true) {
  // Navigate to login
} else {
  // Show error: response['message']
}
```

---

## 📱 Deep Linking Support

### Email Links Format

The backend sends emails with **Flutter-friendly deep links**:

1. **Mobile Deep Link:**
   ```
   dottherapy://reset-password?token=abc123...
   ```

2. **Universal Link (Web + Mobile):**
   ```
   https://yourdomain.com/reset-password?token=abc123...
   ```

### Flutter Deep Link Configuration

The backend is configured to work with Flutter deep links:
- Scheme: `dottherapy`
- Host: `reset-password`
- Parameter: `token`

**Example Deep Link:**
```
dottherapy://reset-password?token=abc123def456ghi789
```

---

## 🔧 Flutter Integration Points

### 1. Base URL Configuration

**Backend runs on:** `http://localhost:5000` (or your configured PORT)

**Flutter should use:**
- **Android Emulator:** `http://10.0.2.2:5000`
- **iOS Simulator:** `http://localhost:5000`
- **Physical Device:** `http://YOUR_COMPUTER_IP:5000`
- **Production:** `https://api.yourdomain.com`

### 2. API Path

All endpoints use `/api` prefix:
- ✅ `/api/auth/forgot-password`
- ✅ `/api/auth/reset-password`
- ✅ `/api/auth/login`
- ✅ `/api/auth/register`

### 3. Response Format

All responses follow this Flutter-friendly format:

```json
{
  "success": boolean,
  "message": "string",
  "data": {} // optional
}
```

### 4. Error Handling

Errors return consistent format:
```json
{
  "success": false,
  "message": "Error description"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `429` - Rate limited
- `500` - Server error

---

## 🧪 Development Mode Features

### Token in Response (Development Only)

When email service is not configured, the API returns the token for testing:

```json
{
  "success": true,
  "message": "...",
  "resetToken": "abc123...",
  "deepLink": "dottherapy://reset-password?token=abc123...",
  "note": "Email service not configured. Use this token for testing."
}
```

**Flutter can use this for testing:**
```dart
if (response.containsKey('resetToken')) {
  // Development mode - use token directly
  final token = response['resetToken'];
  // Navigate to reset password page
}
```

---

## 📋 Flutter Integration Checklist

### Backend Setup ✅
- [x] API endpoints created
- [x] Flutter-friendly response format
- [x] Deep link support in emails
- [x] Error handling
- [x] Validation
- [x] Security best practices

### Flutter Setup (To Do)
- [ ] Update `BASE_URL` in `api_service.dart`
- [ ] Add `forgotPassword()` method
- [ ] Add `resetPassword()` method
- [ ] Configure deep links (Android + iOS)
- [ ] Handle deep link in app
- [ ] Update reset password page
- [ ] Test integration

---

## 🔐 Security Features (Flutter-Compatible)

All security features work seamlessly with Flutter:

1. **Email Enumeration Prevention** ✅
   - Flutter receives same response regardless of email existence
   - No information leakage

2. **Rate Limiting** ✅
   - Flutter receives 429 status code
   - Clear error message for user

3. **Token Security** ✅
   - Tokens sent via email only
   - Flutter receives token through deep link
   - Tokens expire after 10 minutes

4. **Password Validation** ✅
   - Server-side validation
   - Flutter can also validate client-side
   - Consistent rules

---

## 📱 Mobile-Specific Features

### 1. Deep Link Handling
- Backend generates mobile-friendly deep links
- Works with Flutter's deep linking packages
- Supports both Android and iOS

### 2. Token Extraction
- Tokens in URL query parameters
- Easy to extract in Flutter
- URL-encoded for safety

### 3. Error Messages
- User-friendly messages
- No technical jargon
- Actionable feedback

---

## 🚀 Quick Integration Example

```dart
// Complete Flutter integration example

class AuthService {
  final ApiService _apiService;
  
  AuthService(this._apiService);
  
  // Forgot password
  Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final response = await _apiService.post(
        '/api/auth/forgot-password',
        data: {'email': email},
      );
      return response;
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }
  
  // Reset password
  Future<Map<String, dynamic>> resetPassword(String token, String password) async {
    try {
      final response = await _apiService.post(
        '/api/auth/reset-password',
        data: {
          'token': token,
          'password': password,
        },
      );
      return response;
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }
}
```

---

## ✅ Status: Flutter-Ready

The password reset API is **fully compatible** with Flutter and ready for integration!

**Key Features:**
- ✅ Simple JSON responses
- ✅ Deep link support
- ✅ Mobile-friendly
- ✅ Error handling
- ✅ Security best practices
- ✅ Development mode support

---

**Last Updated:** $(date)
**Compatibility:** Flutter 2.0+ ✅
**Status:** Production Ready ✅

