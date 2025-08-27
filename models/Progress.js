const mongoose = require('mongoose');
// Import mongoose (to interact with MongoDB)

const progressSchema = new mongoose.Schema({
  // --------- User and Activity References ---------
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Link to the User who did activity
    ref: 'User', // References the User model
    required: [true, 'User ID is required'] // Must have a user
  },
  
  activityId: {
    type: mongoose.Schema.Types.ObjectId, // Link to which activity user is doing
    ref: 'Activity', // References the Activity model
    required: [true, 'Activity ID is required']
  },
  
  // --------- Session Information ---------
  sessionId: {
    type: String, // Unique ID for one activity attempt
    required: true,
    unique: true
  },
  
  // --------- Progress Data ---------
  status: {
    type: String,
    enum: ['started', 'in-progress', 'completed', 'abandoned'], // Current stage
    default: 'started'
  },
  
  startTime: { type: Date, default: Date.now }, // When user started
  endTime: Date, // When user ended
  
  duration: { type: Number, default: 0 }, // Time spent in seconds
  
  // --------- Scoring and Performance ---------
  score: { type: Number, min: 0, default: 0 }, // User’s score
  maxPossibleScore: { type: Number, default: 100 }, // Max score
  scorePercentage: { type: Number, min: 0, max: 100, default: 0 }, // % of score
  
  // --------- Detailed Task Results ---------
  taskResults: [{ // Each task/question attempted
    taskIndex: Number, // Which task number
    taskType: String, // Type (mcq, true/false etc.)
    question: String,
    userAnswer: mongoose.Schema.Types.Mixed, // User’s answer (can be text, number, etc.)
    correctAnswer: mongoose.Schema.Types.Mixed, // Correct answer
    isCorrect: Boolean, // Whether correct or not
    points: Number, // Points earned for this task
    timeSpent: Number, // Seconds spent on this task
    attempts: { type: Number, default: 1 } // How many times attempted
  }],
  
  // --------- Behavioral Observations ---------
  observations: {
    attention: { type: String, enum: ['excellent', 'good', 'fair', 'poor'], default: 'fair' },
    motivation: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    frustrationLevel: { type: String, enum: ['none', 'low', 'moderate', 'high'], default: 'none' },
    assistance: { type: String, enum: ['independent', 'minimal', 'moderate', 'maximum'], default: 'independent' },
    engagement: { type: String, enum: ['fully-engaged', 'mostly-engaged', 'partially-engaged', 'not-engaged'], default: 'mostly-engaged' }
  },
  
  // --------- Notes and Feedback ---------
  patientNotes: String, // Notes by patient/parent
  therapistNotes: String, // Notes by therapist
  
  // --------- Difficulty Adjustments ---------
  difficultyAdjustments: [{
    adjustmentType: { type: String, enum: ['increased', 'decreased', 'maintained'] },
    reason: String,
    timestamp: { type: Date, default: Date.now }
  }],
  
  // --------- Media Recordings ---------
  recordings: [{
    type: { type: String, enum: ['audio', 'video', 'image'] }, // Type of recording
    url: String, // File link
    taskIndex: Number, // Which task it belongs to
    timestamp: { type: Date, default: Date.now },
    duration: Number, // For audio/video
    analysis: { // Automated analysis result
      confidence: Number,
      feedback: String,
      suggestions: [String]
    }
  }],
  
  // --------- Goals Progress ---------
  goalProgress: [{
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'TherapyGoal' }, // Related therapy goal
    progressPercentage: { type: Number, min: 0, max: 100, default: 0 },
    milestones: [{ // Sub-goals achieved
      description: String,
      achieved: Boolean,
      achievedDate: Date
    }]
  }],
  
  // --------- Device and Environment Info ---------
  deviceInfo: {
    platform: String, // e.g. web, ios, android
    deviceType: String, // e.g. mobile, tablet, desktop
    browser: String,
    screenSize: String
  },
  
  // --------- Submission and Review ---------
  submittedAt: Date, // When user submitted
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reviewed by therapist/admin
  reviewedAt: Date,
  
  // --------- Flags and Alerts ---------
  flags: [{ // Alerts for issues
    type: String, // Type of flag
    description: String,
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
    flaggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    flaggedAt: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false } // Whether fixed or not
  }],
  
  // --------- Parent/Therapist Rating ---------
  rating: {
    difficulty: { type: Number, min: 1, max: 5 },
    engagement: { type: Number, min: 1, max: 5 },
    effectiveness: { type: Number, min: 1, max: 5 },
    overall: { type: Number, min: 1, max: 5 }
  }
}, {
  timestamps: true, // Auto adds createdAt & updatedAt
  toJSON: { virtuals: true }, // Include virtuals in JSON output
  toObject: { virtuals: true } // Include virtuals in Object output
});

// --------- Virtual Fields ---------

// Virtual: Completion percentage of activity
progressSchema.virtual('completionPercentage').get(function() {
  if (this.status === 'completed') return 100;
  if (this.taskResults.length === 0) return 0;
  
  const completedTasks = this.taskResults.length;
  const totalTasks = this.activityId?.tasks?.length || completedTasks; // Use activity tasks if available
  
  return Math.round((completedTasks / totalTasks) * 100);
});

// Virtual: Performance level based on score %
progressSchema.virtual('performanceLevel').get(function() {
  const percentage = this.scorePercentage;
  if (percentage >= 90) return 'excellent';
  if (percentage >= 80) return 'good';
  if (percentage >= 70) return 'satisfactory';
  if (percentage >= 60) return 'needs-improvement';
  return 'requires-attention';
});

// --------- Middleware ---------
// Runs before saving a document
progressSchema.pre('save', function(next) {
  // Calculate duration if activity ended
  if (this.endTime && this.startTime) {
    this.duration = Math.round((this.endTime - this.startTime) / 1000);
  }
  
  // Calculate score percentage
  if (this.maxPossibleScore > 0) {
    this.scorePercentage = Math.round((this.score / this.maxPossibleScore) * 100);
  }
  
  next(); // Continue saving
});

// --------- Indexes ---------
// For fast searching
progressSchema.index({ userId: 1, activityId: 1, createdAt: -1 }); // Find progress by user & activity
progressSchema.index({ userId: 1, status: 1 }); // Find progress by status
progressSchema.index({ activityId: 1, status: 1 }); // Find activity progress by status
progressSchema.index({ sessionId: 1 }, { unique: true }); // Ensure sessionId is unique

// Export model to use in controllers
module.exports = mongoose.model('Progress', progressSchema);
