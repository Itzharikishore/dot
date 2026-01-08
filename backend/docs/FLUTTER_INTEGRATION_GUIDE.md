# Flutter Frontend Integration Guide

## 🔗 Password Reset API - Flutter Integration

This guide explains how to integrate the password reset API with your Flutter frontend.

---

## 📱 API Endpoints for Flutter

### Base URL Configuration

Update your Flutter `api_service.dart`:

```dart
// File: lib/shared/services/api_service.dart
class ApiService {
  // Update this to match your backend
  static const String BASE_URL = 'http://localhost:5000'; // Change to your backend URL
  
  // For Android Emulator, use: 'http://10.0.2.2:5000'
  // For iOS Simulator, use: 'http://localhost:5000'
  // For production, use: 'https://api.yourdomain.com'
}
```

---

## 🔐 Password Reset Flow

### Step 1: Request Password Reset

**Endpoint:** `POST /api/auth/forgot-password`

**Flutter Service Implementation:**

```dart
// File: lib/features/auth/data/services/auth_service.dart

Future<ForgotPasswordResponse> forgotPassword({
  required String email,
}) async {
  try {
    final response = await _apiService.post(
      '/api/auth/forgot-password', // Note: includes /api prefix
      data: {
        'email': email,
      },
    );

    if (response['success'] == true) {
      return ForgotPasswordResponse(
        success: true,
        message: response['message'] ?? 'Reset link sent to your email',
      );
    } else {
      return ForgotPasswordResponse(
        success: false,
        message: response['message'] ?? 'Failed to process request',
      );
    }
  } catch (e) {
    // Handle network errors
    return ForgotPasswordResponse(
      success: false,
      message: 'Network error: ${e.toString()}',
    );
  }
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "If an account exists with this email, a reset link has been sent to your email address."
}
```

**Error Response (Rate Limited):**
```json
{
  "success": false,
  "message": "Password reset request already sent. Please check your email or wait a few minutes before requesting again."
}
```

---

### Step 2: Handle Deep Link / Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Flutter Deep Link Setup:**

#### 1. Configure Deep Links in `pubspec.yaml`

```yaml
flutter:
  # ... other config

# Deep linking configuration
flutter_deep_linking:
  enabled: true
```

#### 2. Configure Android Deep Links

**File:** `android/app/src/main/AndroidManifest.xml`

```xml
<activity
    android:name=".MainActivity"
    android:launchMode="singleTop"
    android:theme="@style/LaunchTheme">
    
    <!-- Deep link intent filter -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data
            android:scheme="dottherapy"
            android:host="reset-password" />
    </intent-filter>
</activity>
```

#### 3. Configure iOS Deep Links

**File:** `ios/Runner/Info.plist`

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleTypeRole</key>
        <string>Editor</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>dottherapy</string>
        </array>
    </dict>
</array>
```

#### 4. Handle Deep Link in Flutter

**File:** `lib/main.dart` or your route handler

```dart
import 'package:uni_links/uni_links.dart';
import 'dart:async';

class MyApp extends StatefulWidget {
  @override
  _MyAppState createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  StreamSubscription? _linkSubscription;

  @override
  void initState() {
    super.initState();
    _initDeepLinks();
  }

  void _initDeepLinks() async {
    // Handle initial link (if app opened from link)
    try {
      final initialLink = await getInitialLink();
      if (initialLink != null) {
        _handleDeepLink(initialLink);
      }
    } catch (e) {
      print('Error getting initial link: $e');
    }

    // Listen for links while app is running
    _linkSubscription = linkStream.listen(
      (String link) => _handleDeepLink(link),
      onError: (err) => print('Link error: $err'),
    );
  }

  void _handleDeepLink(String link) {
    final uri = Uri.parse(link);
    
    if (uri.scheme == 'dottherapy' && uri.host == 'reset-password') {
      final token = uri.queryParameters['token'];
      if (token != null) {
        // Navigate to reset password page with token
        Navigator.pushNamed(
          context,
          '/reset-password',
          arguments: {'token': token},
        );
      }
    }
  }

  @override
  void dispose() {
    _linkSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      // ... your app config
    );
  }
}
```

#### 5. Reset Password Service Method

**File:** `lib/features/auth/data/services/auth_service.dart`

```dart
/// Reset password with token
/// 
/// ═══════════════════════════════════════════════════════════════════
/// RESET PASSWORD ENDPOINT DETAILS
/// ═══════════════════════════════════════════════════════════════════
/// 
/// FULL URL: POST http://localhost:5000/api/auth/reset-password
/// 
/// REQUEST FORMAT:
/// {
///   "token": "abc123def456...",
///   "password": "NewPassword123"
/// }
/// 
/// RESPONSE FORMAT (Success):
/// {
///   "success": true,
///   "message": "Password has been reset successfully. You can now login with your new password."
/// }
/// 
/// RESPONSE FORMAT (Error):
/// {
///   "success": false,
///   "message": "Invalid or expired reset token. Please request a new password reset."
/// }
/// 
/// ═══════════════════════════════════════════════════════════════════
Future<ResetPasswordResponse> resetPassword({
  required String token,
  required String password,
}) async {
  try {
    final response = await _apiService.post(
      '/api/auth/reset-password',
      data: {
        'token': token,
        'password': password,
      },
    );

    if (response['success'] == true) {
      return ResetPasswordResponse(
        success: true,
        message: response['message'] ?? 'Password reset successfully',
      );
    } else {
      return ResetPasswordResponse(
        success: false,
        message: response['message'] ?? 'Failed to reset password',
      );
    }
  } catch (e) {
    return ResetPasswordResponse(
      success: false,
      message: 'Error: ${e.toString()}',
    );
  }
}
```

#### 6. Response Models

**File:** `lib/features/auth/data/services/auth_service.dart`

```dart
class ResetPasswordResponse {
  final bool success;
  final String message;

  ResetPasswordResponse({
    required this.success,
    required this.message,
  });
}
```

#### 7. Update Reset Password Page

**File:** `lib/features/auth/presentation/pages/reset_password_page.dart`

```dart
class ResetPasswordPage extends StatefulWidget {
  final String? token; // Token from deep link or route arguments
  
  const ResetPasswordPage({Key? key, this.token}) : super(key: key);

  @override
  State<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends State<ResetPasswordPage> {
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();
  final AuthService _authService = AuthService(ApiService());
  bool _isLoading = false;
  String? _token;

  @override
  void initState() {
    super.initState();
    // Get token from route arguments or widget parameter
    _token = widget.token ?? 
             (ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?)?['token'];
    
    if (_token == null) {
      // No token provided, show error
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _showError('Invalid reset link. Please request a new password reset.');
        Navigator.of(context).pop();
      });
    }
  }

  Future<void> _submit() async {
    if (_token == null) {
      _showError('Invalid reset token');
      return;
    }

    final newPass = _newPasswordController.text.trim();
    final confirm = _confirmPasswordController.text.trim();

    if (newPass.isEmpty || confirm.isEmpty) {
      _showError('Please fill both fields');
      return;
    }
    
    if (newPass.length < 6) {
      _showError('Password must be at least 6 characters');
      return;
    }
    
    if (newPass != confirm) {
      _showError('Passwords do not match');
      return;
    }

    // Validate password strength (uppercase, lowercase, number)
    if (!RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)').hasMatch(newPass)) {
      _showError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final result = await _authService.resetPassword(
        token: _token!,
        password: newPass,
      );

      setState(() => _isLoading = false);

      if (result.success) {
        // Show success and navigate to login
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result.message),
            backgroundColor: Colors.green,
          ),
        );
        
        // Navigate to login page
        Navigator.of(context).pushReplacementNamed('/login');
      } else {
        _showError(result.message);
      }
    } catch (e) {
      setState(() => _isLoading = false);
      _showError('Error: ${e.toString()}');
    }
  }

  void _showError(String msg) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Error'),
        content: Text(msg),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  // ... rest of your widget code
}
```

---

## 📧 Email Deep Link Format

The backend sends emails with two types of links:

### 1. Deep Link (for Mobile App)
```
dottherapy://reset-password?token=abc123def456...
```

### 2. Web URL (for Web Browser)
```
https://yourdomain.com/reset-password?token=abc123def456...
```

**Note:** The universal link (`https://yourdomain.com/reset-password?token=...`) will:
- Open in mobile app if deep linking is configured
- Open in web browser if accessed from desktop

---

## 🔧 Required Flutter Packages

Add these to `pubspec.yaml`:

```yaml
dependencies:
  # ... existing dependencies
  
  # Deep linking
  uni_links: ^0.5.1
  
  # HTTP client (if not already using)
  dio: ^5.0.0  # or http: ^1.0.0
```

Install:
```bash
flutter pub get
```

---

## 🧪 Testing Deep Links

### Android
```bash
# Test deep link
adb shell am start -W -a android.intent.action.VIEW -d "dottherapy://reset-password?token=test123" com.your.package.name
```

### iOS
```bash
# Test deep link in simulator
xcrun simctl openurl booted "dottherapy://reset-password?token=test123"
```

### Development Testing

When email service is not configured, the API returns the token in development mode:

```json
{
  "success": true,
  "message": "...",
  "resetToken": "abc123...",
  "deepLink": "dottherapy://reset-password?token=abc123...",
  "note": "Email service not configured. Use this token for testing."
}
```

You can use this token directly in your Flutter app for testing.

---

## 📱 Mobile-Specific Considerations

### 1. Token Handling
- Tokens are URL-encoded in email links
- Flutter should decode tokens properly
- Handle special characters in tokens

### 2. App State
- Handle deep links when app is:
  - Closed (cold start)
  - Background (warm start)
  - Foreground (hot start)

### 3. Error Handling
- Network errors
- Invalid tokens
- Expired tokens
- Token format errors

### 4. User Experience
- Show loading states
- Clear error messages
- Success confirmations
- Auto-navigate to login after success

---

## 🔒 Security Best Practices for Flutter

1. **Never log tokens** in production
2. **Clear tokens** from memory after use
3. **Validate tokens** before sending to API
4. **Handle errors** gracefully without exposing sensitive info
5. **Use HTTPS** in production
6. **Store tokens securely** if needed temporarily

---

## 📋 Integration Checklist

- [ ] Update `BASE_URL` in `api_service.dart`
- [ ] Add `forgotPassword()` method to `AuthService`
- [ ] Add `resetPassword()` method to `AuthService`
- [ ] Add `ResetPasswordResponse` model
- [ ] Configure deep links (Android + iOS)
- [ ] Add `uni_links` package
- [ ] Handle deep links in `main.dart`
- [ ] Update `ResetPasswordPage` to accept token
- [ ] Test forgot password flow
- [ ] Test reset password flow
- [ ] Test deep link handling
- [ ] Test error scenarios

---

## 🚀 Quick Start Example

### Complete Flutter Integration

```dart
// 1. Request password reset
final authService = AuthService(ApiService());
final result = await authService.forgotPassword(email: 'user@example.com');

if (result.success) {
  // Show success message
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(result.message)),
  );
}

// 2. Handle deep link token
void handleResetToken(String token) {
  Navigator.push(
    context,
    MaterialPageRoute(
      builder: (_) => ResetPasswordPage(token: token),
    ),
  );
}

// 3. Reset password
final resetResult = await authService.resetPassword(
  token: token,
  password: newPassword,
);

if (resetResult.success) {
  // Navigate to login
  Navigator.pushReplacementNamed(context, '/login');
}
```

---

## 📞 Support

For Flutter-specific issues:
- Check deep link configuration
- Verify token format
- Test network connectivity
- Review error logs

**Last Updated:** $(date)
**Flutter Version:** Compatible with all Flutter versions
**Status:** ✅ Ready for Integration

