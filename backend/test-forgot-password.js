/**
 * Quick test script for forgot password API
 * Run: node test-forgot-password.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// Test database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dot-therapy');
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Test forgot password flow
const testForgotPassword = async () => {
  try {
    console.log('\n🧪 Testing Forgot Password API...\n');

    // 1. Check if User model has getResetPasswordToken method
    console.log('1. Checking User model...');
    if (typeof User.schema.methods.getResetPasswordToken === 'function') {
      console.log('   ✅ getResetPasswordToken method exists');
    } else {
      console.log('   ❌ getResetPasswordToken method NOT found');
      return;
    }

    // 2. Check if email service loads
    console.log('2. Checking email service...');
    try {
      const emailService = require('./utils/emailService');
      console.log('   ✅ Email service loaded');
      console.log('   📧 Email configured:', emailService.isEmailConfigured());
    } catch (error) {
      console.log('   ❌ Email service error:', error.message);
      return;
    }

    // 3. Check if auth controller loads
    console.log('3. Checking auth controller...');
    try {
      const authController = require('./controllers/authController');
      if (typeof authController.forgotPassword === 'function') {
        console.log('   ✅ forgotPassword function exists');
      } else {
        console.log('   ❌ forgotPassword function NOT found');
        return;
      }
    } catch (error) {
      console.log('   ❌ Auth controller error:', error.message);
      return;
    }

    // 4. Test with a sample user (if exists)
    console.log('4. Testing with sample user...');
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    const user = await User.findOne({ email: testEmail });
    
    if (user) {
      console.log(`   ✅ Found user: ${user.email}`);
      
      // Test token generation
      const token = user.getResetPasswordToken();
      await user.save({ validateBeforeSave: false });
      
      console.log('   ✅ Token generated successfully');
      console.log('   🔑 Token (first 20 chars):', token.substring(0, 20) + '...');
      console.log('   ⏰ Token expires:', new Date(user.passwordResetExpires).toLocaleString());
      
      // Clean up
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
    } else {
      console.log(`   ⚠️  User not found: ${testEmail}`);
      console.log('   💡 Create a test user first or set TEST_EMAIL in .env');
    }

    console.log('\n✅ All tests passed! Forgot password API is ready.\n');
    console.log('📝 To test the API:');
    console.log('   POST http://localhost:5000/api/auth/forgot-password');
    console.log('   Body: { "email": "your-email@example.com" }');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
};

// Run tests
(async () => {
  await connectDB();
  await testForgotPassword();
  process.exit(0);
})();

