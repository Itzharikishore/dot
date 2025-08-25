const app = require('./app');
const connectDB = require('./config/database');
const http = require('http');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// Connect to database
connectDB();

// Create HTTP server
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('🚀========================================');
  console.log(`🚀 DOT Therapy Server Running!`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV}`);
  console.log(`🚀 Server URL: http://localhost:${PORT}`);
  console.log(`🚀 Test URL: http://localhost:${PORT}/api/test`);
  console.log('🚀========================================');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('❌ UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = server;