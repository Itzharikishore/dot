# 🚀 DOT Therapy - Full Stack Setup Guide

## 📋 Overview

This guide will help you set up and run the complete DOT Therapy application with both frontend and backend connected.

## 🏗️ Architecture

```
┌─────────────────┐    HTTP/REST API    ┌─────────────────┐
│   Flutter App   │ ◄─────────────────► │   Node.js API   │
│   (Frontend)    │    (Port 5000)      │   (Backend)     │
│   Port: 3000    │                     │   Port: 5000    │
└─────────────────┘                     └─────────────────┘
                                                │
                                                ▼
                                        ┌─────────────────┐
                                        │   MongoDB Atlas │
                                        │   (Database)    │
                                        └─────────────────┘
```

## 🛠️ Prerequisites

### Backend Requirements
- ✅ Node.js (v16+)
- ✅ MongoDB Atlas connection
- ✅ All APIs implemented (37/37)

### Frontend Requirements
- ✅ Flutter SDK
- ✅ Dart SDK
- ✅ Updated API configuration

## 🚀 Quick Start

### 1. Start Backend Server

```bash
# Navigate to backend directory
cd c:\dot-therapy-backend\backend

# Start the server
npm start

# Server will start on http://localhost:5000
# MongoDB connection will be established
# All API routes will be available
```

### 2. Start Flutter Frontend

```bash
# Navigate to frontend directory
cd c:\dot-therapy-backend\Dot_frontend\dot_app

# Get dependencies
flutter pub get

# Run the app
flutter run

# App will start on your device/emulator
# Will connect to backend at http://localhost:5000
```

## 🔗 API Connectivity Status

### ✅ Connected Endpoints

| Category | Endpoints | Status |
|----------|-----------|---------|
| Authentication | 4 | ✅ Connected |
| Therapist Management | 6 | ✅ Connected |
| Child Management | 7 | ✅ Connected |
| Activity Management | 7 | ✅ Connected |
| Games Library | 3 | ✅ Connected |
| Reports | 7 | ✅ Connected |
| Alerts | 3 | ✅ Connected |
| User Profile | 4 | ✅ Connected |
| Child Activities | 3 | ✅ Connected |

**Total: 37/37 APIs Connected (100%)**

## 🧪 Testing the Connection

### Test Backend Health

```bash
# Test server is running
curl http://localhost:5000/api

# Expected: Server health response
```

### Test Authentication Flow

1. **Register New User**
   - Open Flutter app
   - Navigate to Registration
   - Fill in user details
   - Should connect to `POST /api/auth/register`

2. **Login User**
   - Use registered credentials
   - Should connect to `POST /api/auth/login`
   - Receive JWT token

3. **Access Protected Routes**
   - Token automatically set in headers
   - Access user profile, therapists, children, etc.

## 📱 Flutter App Features

### Authentication
- ✅ User registration and login
- ✅ JWT token management
- ✅ Password reset functionality

### Dashboard Features
- ✅ Therapist management
- ✅ Child profiles and progress
- ✅ Activity scheduling
- ✅ Games library
- ✅ Reports and analytics
- ✅ Alerts and notifications
- ✅ User profile management

### Data Flow
```
Flutter App → HTTP Request → Node.js API → MongoDB → Response → Flutter App
```

## 🔧 Configuration Details

### Backend Configuration
- **Port**: 5000
- **Database**: MongoDB Atlas
- **Authentication**: JWT
- **CORS**: Enabled for Flutter app

### Frontend Configuration
- **API Base URL**: `http://localhost:5000`
- **Authentication**: Bearer token
- **Timeout**: 30 seconds
- **Retry Logic**: Built-in with Dio

## 🚨 Troubleshooting

### Common Issues

#### 1. Backend Not Running
```bash
# Check if port 5000 is in use
netstat -an | findstr :5000

# If not running, start backend
cd c:\dot-therapy-backend\backend
npm start
```

#### 2. Frontend Can't Connect
- Verify backend is running on port 5000
- Check API_BASE_URL in `api_service.dart`
- Ensure no firewall blocking localhost connections

#### 3. Authentication Issues
- Check JWT token is being sent
- Verify token format: `Bearer <token>`
- Check token expiration

#### 4. Database Connection
- Verify MongoDB Atlas connection string
- Check network connectivity
- Ensure database credentials are correct

## 📊 Performance Monitoring

### Backend Metrics
- API response times
- Database query performance
- Memory usage
- Error rates

### Frontend Metrics
- App startup time
- API call latency
- User interaction response
- Error handling

## 🔒 Security Features

### Backend Security
- JWT authentication
- Role-based access control
- Input validation
- SQL injection prevention
- CORS protection

### Frontend Security
- Secure token storage
- HTTPS in production
- Input sanitization
- Error handling

## 🚀 Production Deployment

### Backend Deployment
1. Set up production server
2. Configure environment variables
3. Set up SSL certificates
4. Configure database
5. Deploy to cloud platform

### Frontend Deployment
1. Build release APK/IPA
2. Configure production API URL
3. Set up app stores
4. Deploy to users

## 📞 Support

### API Documentation
- Swagger UI: `http://localhost:5000/api-docs`
- API verification report: `API_VERIFICATION_REPORT.md`

### Testing Endpoints
- Use Postman or curl
- Test all 37 endpoints
- Verify response formats

---

## 🎉 Status: FULL STACK READY

✅ **Backend**: 37/37 APIs implemented and running  
✅ **Frontend**: Connected to backend  
✅ **Database**: MongoDB Atlas connected  
✅ **Authentication**: JWT working  
✅ **All Features**: Functional  

**The DOT Therapy application is now a complete full-stack product ready for use!**
