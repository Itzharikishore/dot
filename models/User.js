const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  // ==================== BASIC INFO ====================
  firstName: { type: String, required: true, trim: true, maxlength: 50 },
  lastName: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'] },
  password: { type: String, required: true, minlength: 6, select: false },

  // ==================== ROLE & PERMISSIONS ====================
  role: { type: String, enum: ['superuser', 'hospital', 'therapist', 'child'], default: 'child' },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // ==================== CONTACT ====================
  phoneNumber: { type: String, trim: true, match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number'], default: null },
  
  // ==================== PERSONAL INFO ====================
  dateOfBirth: { type: Date, validate: { validator: d => d <= new Date(), message: 'Date of birth cannot be in the future' } },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer-not-to-say'] },

  // ==================== PROFILE & MEDIA ====================
  profilePicture: { type: String, default: '' },
  bio: { type: String, maxlength: 500 },

  // ==================== ADDRESS ====================
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    zipCode: { type: String, default: '' }
  },

  // ==================== ACCOUNT STATUS ====================
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },

  // ==================== RELATIONSHIPS ====================
  childrenIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedPatients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedTherapist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // ==================== TIMESTAMPS ====================
  lastLogin: { type: Date },
  lastLogout: { type: Date },

  // ==================== THERAPY DATA ====================
  therapyStartDate: { type: Date },
  currentGoals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TherapyGoal' }],

  // ==================== NOTIFICATIONS ====================
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
    activityReminders: { type: Boolean, default: true },
    progressUpdates: { type: Boolean, default: true }
  },

  // ==================== SECURITY ====================
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date,

  // ==================== ACTIVITY TRACKING ====================
  stats: {
    totalActivitiesCompleted: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 }
  },

  // ==================== MEDICAL HISTORY ====================
  medicalHistory: {
    currentLevel: { type: String, default: 'beginner' },
    totalActivitiesCompleted: { type: Number, default: 0 },
    totalTherapyHours: { type: Number, default: 0 }
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: (doc, ret) => {
    delete ret.password;
    delete ret.passwordResetToken;
    delete ret.emailVerificationToken;
    return ret;
  }},
  toObject: { virtuals: true }
});

// ==================== VIRTUALS ====================
userSchema.virtual('fullName').get(function() { return `${this.firstName} ${this.lastName}`; });
userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age--;
  return age;
});

// ==================== INDEXES ====================
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ assignedTherapist: 1 });
userSchema.index({ parentId: 1 });

// ==================== MIDDLEWARE ====================
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ==================== INSTANCE METHODS ====================
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

userSchema.methods.getEmailVerificationToken = function() {
  const token = crypto.randomBytes(20).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

module.exports = mongoose.model('User', userSchema);
