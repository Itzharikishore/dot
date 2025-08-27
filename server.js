const express = require('express');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database'); // make sure you have this
require('dotenv').config();

const app = express();

// ==================== MIDDLEWARE ====================
app.use(express.json());
app.use(cookieParser());

// ==================== DATABASE ====================
connectDB();

// ==================== API ROUTES ====================

// Auth routes
const authRoutes = require('./routes/api/auth'); // ✅ path is correct
app.use('/api/auth', authRoutes);
console.log('✅ Auth routes loaded successfully at /api/auth');

// Add other routes as you create them
// app.use('/api/users', require('./routes/users'));
// app.use('/api/activities', require('./routes/activities'));
// app.use('/api/progress', require('./routes/progress'));
// app.use('/api/goals', require('./routes/goals'));
// app.use('/api/patients', require('./routes/patients'));
// app.use('/api/therapists', require('./routes/therapists'));
// app.use('/api/admin', require('./routes/admin'));

// ==================== ERROR HANDLERS ====================

// Error handling middleware (must be before 404)
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({ success: false, message: 'Validation Error', errors });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ success: false, message: `${field} already exists` });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

// 404 handler (MUST be last)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `🔍 Route '${req.originalUrl}' not found`,
    availableRoutes: {
      public: ['/', '/api/health', '/api/db-test'],
      auth: ['/api/auth/register', '/api/auth/login', '/api/auth/profile'],
      protected: ['All other routes require authentication']
    },
    documentation: 'Visit /api/docs for complete API documentation'
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
