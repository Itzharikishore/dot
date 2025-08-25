const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  phone: {
    type: String,
    trim: true
  },
  
  // User Role and Status
  role: {
    type: String,
    enum: ['child', 'parent', 'therapist', 'super_admin'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Profile Information
  avatar: {
    type: String,
    default: null
  },
  dateOfBirth: {
    type: Date
  },
  
  // Role-specific fields
  childProfile: {
    age: Number,
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedTherapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    currentLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    }
  },
  
  parentProfile: {
    children: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  
  therapistProfile: {
    specialization: [String],
    assignedChildren: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  
  // Device tokens for push notifications
  deviceTokens: [{
    token: String,
    platform: {
      type: String,
      enum: ['android', 'ios', 'web']
    },
    lastUsed: {
      type: Date,
      default: Date.now
    }
  }],
  
  lastLogin: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true
});

// Indexes for better performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to check password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);