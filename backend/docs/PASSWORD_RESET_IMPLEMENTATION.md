# Password Reset Implementation Guide

## 🔐 Professional Password Reset Flow

This document describes the complete password reset implementation following security best practices.

---

## 📋 Overview

The password reset flow consists of two endpoints:
1. **POST /api/auth/forgot-password** - Request password reset
2. **POST /api/auth/reset-password** - Reset password with token

---

## 🔒 Security Features Implemented

### 1. **Email Enumeration Prevention**
- Always returns the same success message regardless of whether email exists
- Prevents attackers from discovering valid email addresses
- Adds artificial delay to prevent timing attacks

### 2. **Rate Limiting**
- Prevents multiple reset requests within 10 minutes
- Returns 429 status code if too many requests
- Protects against brute force attacks

### 3. **Secure Token Generation**
- Uses cryptographically secure random bytes (20 bytes = 40 hex characters)
- Tokens are hashed before storage (SHA-256)
- Original token only sent via email, never stored in plain text

### 4. **Token Expiration**
- Tokens expire after 10 minutes (configurable via `PASSWORD_RESET_EXPIRY`)
- Expired tokens are automatically rejected
- Prevents token reuse

### 5. **Password Validation**
- Minimum 6 characters
- Requires uppercase, lowercase, and number
- Validated on both client and server

### 6. **Account Status Checks**
- Only active accounts can reset passwords
- Deactivated accounts are rejected with appropriate message

### 7. **Audit Logging**
- All password resets are logged with timestamp
- Helps with security monitoring and forensics

---

## 📧 Email Service Configuration

### Environment Variables Required

Add these to your `.env` file:

```env
# Email Service Configuration
SMTP_HOST=smtp.gmail.com          # SMTP server host
SMTP_PORT=587                     # SMTP port (587 for TLS, 465 for SSL)
SMTP_SECURE=false                 # true for SSL (port 465), false for TLS (port 587)
SMTP_USER=your-email@gmail.com    # SMTP username (usually your email)
SMTP_PASS=your-app-password       # SMTP password (use App Password for Gmail)

# Email Display
EMAIL_FROM_NAME=DOT Therapy       # Display name in emails

# Frontend URL (for reset links)
FRONTEND_URL=http://localhost:3000

# Token Expiry (optional, defaults to 10 minutes)
PASSWORD_RESET_EXPIRY=10 minutes
```

### Gmail Setup (Example)

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Create app password for "Mail"
   - Use the generated password as `SMTP_PASS`

### Other Email Providers

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-access-key-id
SMTP_PASS=your-secret-access-key
```

#### Outlook/Office365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

---

## 🚀 API Endpoints

### 1. POST /api/auth/forgot-password

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "If an account exists with this email, a reset link has been sent to your email address."
}
```

**Response (Rate Limited):**
```json
{
  "success": false,
  "message": "Password reset request already sent. Please check your email or wait a few minutes before requesting again."
}
```

**Response (Development - Email Not Configured):**
```json
{
  "success": true,
  "message": "If an account exists with this email, a reset link has been sent to your email address.",
  "resetToken": "abc123def456...",
  "note": "Email service not configured. Use this token for testing."
}
```

**Status Codes:**
- `200` - Success (always returns this, even if email doesn't exist)
- `400` - Validation error (invalid email format)
- `429` - Too many requests (rate limited)
- `500` - Server error

---

### 2. POST /api/auth/reset-password

**Request:**
```json
{
  "token": "abc123def456...",
  "password": "NewPassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

**Response (Invalid/Expired Token):**
```json
{
  "success": false,
  "message": "Invalid or expired reset token. Please request a new password reset."
}
```

**Status Codes:**
- `200` - Password reset successful
- `400` - Invalid token, expired token, or validation error
- `403` - Account deactivated
- `500` - Server error

---

## 📝 Frontend Integration

### Step 1: Request Password Reset

```javascript
// Frontend code example
const requestPasswordReset = async (email) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    
    if (data.success) {
      // Show success message
      alert('If an account exists, a reset link has been sent to your email.');
    } else {
      // Handle error
      alert(data.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Step 2: Reset Password

```javascript
// Frontend code example
const resetPassword = async (token, newPassword) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        token: token, // From URL query parameter
        password: newPassword 
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      // Redirect to login page
      window.location.href = '/login';
    } else {
      // Show error
      alert(data.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Step 3: Handle Reset Link

```javascript
// In your reset-password page component
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (!token) {
    // Redirect to forgot-password page
    window.location.href = '/forgot-password';
  }
  
  // Store token for form submission
  setResetToken(token);
}, []);
```

---

## 🧪 Testing

### Development Mode

When email service is not configured, the API returns the reset token in the response for testing:

```bash
# Request password reset
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Response includes token for testing
{
  "success": true,
  "message": "...",
  "resetToken": "abc123...",
  "note": "Email service not configured. Use this token for testing."
}

# Use token to reset password
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"abc123...","password":"NewPass123"}'
```

### Production Mode

In production, tokens are only sent via email. Never expose tokens in API responses.

---

## 🔍 Monitoring & Logging

### Successful Password Reset
```
✅ Password reset successful: {
  userId: '...',
  email: 'user@example.com',
  timestamp: '2024-01-15T10:30:00Z'
}
```

### Email Sending
```
✅ Email sent successfully: {
  to: 'user@example.com',
  subject: 'Password Reset Request - DOT Therapy',
  messageId: '...'
}
```

### Errors
```
❌ Email sending failed: Error message
❌ Reset password error: Error message
```

---

## 🛡️ Security Checklist

- ✅ Email enumeration prevention
- ✅ Rate limiting (10 minutes)
- ✅ Secure token generation (crypto.randomBytes)
- ✅ Token hashing (SHA-256)
- ✅ Token expiration (10 minutes)
- ✅ Password strength validation
- ✅ Account status checks
- ✅ Audit logging
- ✅ Error message sanitization
- ✅ HTTPS enforcement (recommended in production)
- ✅ CORS configuration
- ✅ Input validation and sanitization

---

## 📚 Best Practices Followed

1. **Never reveal if email exists** - Prevents email enumeration
2. **Hash tokens before storage** - Even if DB is compromised, tokens are safe
3. **Short token expiration** - Reduces attack window
4. **Rate limiting** - Prevents abuse
5. **Strong password requirements** - Enhances security
6. **Comprehensive logging** - Aids in security monitoring
7. **Graceful error handling** - Doesn't leak sensitive information
8. **Email service abstraction** - Easy to switch providers
9. **Development-friendly** - Returns tokens in dev mode for testing
10. **Production-ready** - Secure by default in production

---

## 🔧 Troubleshooting

### Email Not Sending

1. **Check SMTP credentials** in `.env`
2. **Verify email service is configured**: Check logs for "✅ Email service configured"
3. **Test SMTP connection**: Use email service test function
4. **Check spam folder**: Reset emails might be filtered
5. **Review email provider limits**: Some providers have sending limits

### Token Not Working

1. **Check token expiration**: Tokens expire after 10 minutes
2. **Verify token format**: Should be 40-character hex string
3. **Check URL encoding**: Tokens in URLs should be properly encoded
4. **Verify user account is active**: Deactivated accounts can't reset

### Rate Limiting Issues

1. **Wait 10 minutes** between reset requests
2. **Check user's passwordResetExpires** field in database
3. **Clear expired tokens** if needed (automatic cleanup)

---

## 📞 Support

For issues or questions:
- Check server logs for detailed error messages
- Verify environment variables are set correctly
- Test email service configuration separately
- Review security best practices documentation

---

**Last Updated:** $(date)
**Version:** 1.0.0
**Status:** Production Ready ✅

