# 🚀 How to Run the Backend

Complete guide to set up and run the DOT Therapy backend server.

---

## 📋 Prerequisites

Before running the backend, ensure you have:

1. **Node.js** (v14 or higher)
   - Check: `node --version`
   - Download: https://nodejs.org/

2. **MongoDB** (local or MongoDB Atlas)
   - Local MongoDB: https://www.mongodb.com/try/download/community
   - MongoDB Atlas (Cloud): https://www.mongodb.com/cloud/atlas

3. **npm** (comes with Node.js)
   - Check: `npm --version`

---

## 🔧 Setup Steps

### Step 1: Install Dependencies

Navigate to the backend folder and install dependencies:

```bash
cd backend
npm install
```

This will install all required packages listed in `package.json`.

---

### Step 2: Configure Environment Variables

Create a `.env` file in the `backend` folder:

```bash
# In backend folder
touch .env
# or on Windows
type nul > .env
```

Add the following environment variables to `.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/dot-therapy
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dot-therapy?retryWrites=true&w=majority

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS Origin (comma-separated for multiple origins)
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Superuser (Default Admin Account)
SUPERUSER_EMAIL=admin@admin.com
SUPERUSER_PASSWORD=admin123

# Email Service (Optional - for password reset emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM_NAME=DOT Therapy

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000

# Password Reset Token Expiry
PASSWORD_RESET_EXPIRY=10 minutes
```

**Important:**
- Replace `JWT_SECRET` with a strong random string
- Update `MONGODB_URI` with your MongoDB connection string
- For email service, set up SMTP credentials (optional for development)

---

### Step 3: Start MongoDB

**Option A: Local MongoDB**
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
# or
mongod
```

**Option B: MongoDB Atlas (Cloud)**
- No local setup needed
- Use the connection string from MongoDB Atlas dashboard

---

## 🚀 Running the Backend

### Development Mode (Recommended)

Runs with auto-reload on file changes:

```bash
cd backend
npm run dev
```

**Output:**
```
✅ Database connected
✅ Auth routes loaded successfully at /api/auth
✅ Children routes loaded successfully at /api/children
...
🚀 Server running on port 5000
```

### Production Mode

Runs without auto-reload:

```bash
cd backend
npm start
```

### Run Both Backend and Frontend (if frontend exists)

```bash
cd backend
npm run dev:all
```

This runs both backend and frontend concurrently.

---

## ✅ Verify Server is Running

### 1. Check Server Status

Open your browser or use curl:

```bash
# Health check endpoint
curl http://localhost:5000/api/health

# Expected response:
# {"status":"ok","message":"Server is running"}
```

### 2. Check API Documentation

Open Swagger UI in browser:

```
http://localhost:5000/api/docs
```

You should see the API documentation with all available endpoints.

### 3. Test an Endpoint

```bash
# Test forgot password endpoint
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## 🔍 Troubleshooting

### Issue 1: Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Change PORT in .env file
PORT=5001

# Or kill the process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:5000 | xargs kill
```

---

### Issue 2: MongoDB Connection Failed

**Error:** `MongoServerError: connect ECONNREFUSED`

**Solutions:**
1. **Check if MongoDB is running:**
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl status mongod
   ```

2. **Check MONGODB_URI in .env:**
   - Verify the connection string is correct
   - For Atlas, check network access settings

3. **Test MongoDB connection:**
   ```bash
   mongosh "mongodb://localhost:27017/dot-therapy"
   ```

---

### Issue 3: Module Not Found

**Error:** `Cannot find module 'xxx'`

**Solution:**
```bash
cd backend
npm install
```

---

### Issue 4: JWT Secret Missing

**Error:** `JWT_SECRET is required`

**Solution:**
- Add `JWT_SECRET=your-secret-key` to `.env` file
- Use a strong random string (at least 32 characters)

---

### Issue 5: Email Service Not Working

**Warning:** `⚠️ Email service not configured`

**Solution:**
- This is normal in development mode
- For production, configure SMTP credentials in `.env`
- See `backend/docs/PASSWORD_RESET_IMPLEMENTATION.md` for email setup

---

## 📝 Available Scripts

From `package.json`:

| Script | Command | Description |
|--------|---------|-------------|
| `start` | `npm start` | Run in production mode |
| `dev` | `npm run dev` | Run in development mode (auto-reload) |
| `dev:server` | `npm run dev:server` | Same as `dev` |
| `dev:all` | `npm run dev:all` | Run backend + frontend together |

---

## 🌐 API Endpoints

Once the server is running, you can access:

- **Base URL:** `http://localhost:5000`
- **API Base:** `http://localhost:5000/api`
- **Health Check:** `http://localhost:5000/api/health`
- **Swagger Docs:** `http://localhost:5000/api/docs`

### Main API Routes:

- `/api/auth` - Authentication (login, register, forgot password)
- `/api/children` - Children management
- `/api/activities` - Activities management
- `/api/users` - User profile management
- `/api/notifications` - Notifications
- `/api/progress` - Progress tracking

---

## 🔐 Default Superuser Account

On first run, a default superuser is created:

- **Email:** `admin@admin.com` (or from `SUPERUSER_EMAIL` in `.env`)
- **Password:** `admin123` (or from `SUPERUSER_PASSWORD` in `.env`)
- **Role:** `superuser`

**⚠️ Change this in production!**

---

## 📱 Flutter Frontend Connection

To connect your Flutter app:

1. **Update Flutter `BASE_URL`:**
   ```dart
   // For Android Emulator:
   static const String BASE_URL = 'http://10.0.2.2:5000';
   
   // For iOS Simulator:
   static const String BASE_URL = 'http://localhost:5000';
   
   // For Physical Device:
   static const String BASE_URL = 'http://YOUR_COMPUTER_IP:5000';
   ```

2. **Find your computer's IP:**
   ```bash
   # Windows
   ipconfig
   
   # macOS/Linux
   ifconfig
   # or
   ip addr
   ```

3. **Update CORS in backend `.env`:**
   ```env
   CORS_ORIGIN=http://localhost:3000,http://YOUR_COMPUTER_IP:3000
   ```

---

## ✅ Quick Start Checklist

- [ ] Node.js installed
- [ ] MongoDB running (local or Atlas)
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with required variables
- [ ] Server started (`npm run dev`)
- [ ] Health check passed (`/api/health`)
- [ ] Swagger docs accessible (`/api/docs`)

---

## 🎉 You're Ready!

Your backend is now running! You can:

1. Test APIs using Swagger UI: `http://localhost:5000/api/docs`
2. Connect your Flutter frontend
3. Start developing!

---

**Need Help?**
- Check server logs for error messages
- Verify all environment variables are set
- Ensure MongoDB is running
- Check port availability

---

**Last Updated:** $(date)

