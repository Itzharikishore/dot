require('dotenv').config({ path: __dirname + '/../.env' });
const connectDB = require('../config/database');
const User = require('../models/User');

(async () => {
  try {
    await connectDB();
    const user = await User.findOne({ email: 'test+api@dot.local' }).lean();
    console.log('User found:', JSON.stringify(user, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();