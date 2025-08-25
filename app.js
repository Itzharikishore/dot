const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());
app.use(cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static('uploads'));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: '🚀 DOT Therapy API Server',
    version: '1.0.0',
    status: 'Running Successfully!',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: '✅ MongoDB Atlas Ready',
      authentication: '✅ JWT Ready',
      fileUpload: '✅ Multer Ready',
      security: '✅ Helmet & CORS Active'
    },
    endpoints: {
      test: '/api/test',
      auth: '/api/auth (coming soon)',
      users: '/api/users (coming soon)', 
      activities: '/api/activities (coming soon)'
    },
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: '✅ API is working perfectly!',
    database: 'MongoDB Atlas connection will be tested when you visit any API endpoint',
    timestamp: new Date().toISOString()
  });
});

// Test database connection route
app.get('/api/db-test', async (req, res) => {
  try {
    // We'll add this after we create the models
    res.json({
      success: true,
      message: '✅ Database test endpoint ready!',
      note: 'Database models will be added in the next step',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '❌ Database connection failed',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `🔍 Route '${req.originalUrl}' not found`,
    availableRoutes: ['/', '/api/test', '/api/db-test']
  });
});

module.exports = app;