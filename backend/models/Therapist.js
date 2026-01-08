const mongoose = require('mongoose');

const therapistSchema = new mongoose.Schema({
  // ==================== BASIC INFO ====================
  name: {
    type: String,
    required: [true, 'Therapist name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [21, 'Therapist must be at least 21 years old'],
    max: [70, 'Age cannot exceed 70']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['Male', 'Female', 'Other', 'Prefer not to say']
  },
  contactNo: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  
  // ==================== PROFESSIONAL INFO ====================
  qualification: {
    type: String,
    required: [true, 'Qualification is required'],
    trim: true,
    maxlength: [200, 'Qualification cannot exceed 200 characters']
  },
  experience: {
    type: String,
    required: [true, 'Experience is required'],
    trim: true,
    maxlength: [100, 'Experience cannot exceed 100 characters']
  },
  
  // ==================== SYSTEM FIELDS ====================
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // ==================== STATISTICS ====================
  childrenAssigned: {
    type: Number,
    default: 0
  },
  activeSessions: {
    type: Number,
    default: 0
  },
  
  // ==================== STATUS ====================
  isActive: {
    type: Boolean,
    default: true
  },
  joinDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==================== INDEXES ====================
therapistSchema.index({ email: 1 });
therapistSchema.index({ userId: 1 });
therapistSchema.index({ hospitalId: 1 });
therapistSchema.index({ isActive: 1 });

// ==================== INSTANCE METHODS ====================
therapistSchema.methods.incrementChildrenAssigned = function() {
  this.childrenAssigned += 1;
  return this.save();
};

therapistSchema.methods.decrementChildrenAssigned = function() {
  if (this.childrenAssigned > 0) {
    this.childrenAssigned -= 1;
  }
  return this.save();
};

therapistSchema.methods.incrementActiveSessions = function() {
  this.activeSessions += 1;
  return this.save();
};

therapistSchema.methods.decrementActiveSessions = function() {
  if (this.activeSessions > 0) {
    this.activeSessions -= 1;
  }
  return this.save();
};

module.exports = mongoose.model('Therapist', therapistSchema);
