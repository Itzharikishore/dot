const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  child: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true
  },
  
  // Session information
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  
  // Completion status
  status: {
    type: String,
    enum: ['started', 'in_progress', 'completed', 'abandoned'],
    default: 'started'
  },
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Performance metrics
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  
  // Feedback
  childFeedback: {
    enjoymentRating: {
      type: Number,
      min: 1,
      max: 5
    },
    emoji: String
  },
  
  parentFeedback: {
    notes: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  }

}, {
  timestamps: true
});

// Indexes for efficient querying
ProgressSchema.index({ child: 1, activity: 1 });
ProgressSchema.index({ child: 1, createdAt: -1 });
ProgressSchema.index({ sessionId: 1 });

module.exports = mongoose.model('Progress', ProgressSchema);