const mongoose = require('mongoose');

// ==================== PROGRESS TRACKING MODEL ====================
// Tracks individual progress entries for users across different programs/activities.
// Each progress entry represents a milestone, completion, or update in a user's journey.

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  programId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'HomeProgram', 
    required: true, 
    index: true 
  },
  activityId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Activity', 
    index: true 
  },
  progressPercentage: { 
    type: Number, 
    min: 0, 
    max: 100, 
    default: 0,
    required: true 
  },
  completedTasks: [{ 
    type: String, 
    trim: true, 
    maxlength: 200 
  }],
  notes: { 
    type: String, 
    trim: true, 
    maxlength: 1000 
  },
  milestone: {
    type: String,
    trim: true,
    maxlength: 100,
    enum: ['started', 'quarter', 'half', 'three-quarters', 'completed', 'custom']
  },
  customMilestone: {
    type: String,
    trim: true,
    maxlength: 100
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  timeSpent: {
    type: Number,
    min: 0,
    default: 0 // in minutes
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  mood: {
    type: String,
    enum: ['excellent', 'good', 'okay', 'difficult', 'frustrated'],
    default: 'okay'
  },
  attachments: [{
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{ 
    type: String, 
    trim: true, 
    maxlength: 50 
  }],
  status: {
    type: String,
    enum: ['draft', 'submitted', 'reviewed', 'approved'],
    default: 'submitted'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, { 
  timestamps: true 
});

// Indexes for efficient querying
progressSchema.index({ userId: 1, programId: 1, createdAt: -1 });
progressSchema.index({ userId: 1, activityId: 1, createdAt: -1 });
progressSchema.index({ programId: 1, status: 1 });
progressSchema.index({ createdAt: -1 });

// Virtual for formatted progress percentage
progressSchema.virtual('formattedProgress').get(function() {
  return `${this.progressPercentage}%`;
});

// Virtual for time spent in hours
progressSchema.virtual('timeSpentHours').get(function() {
  return Math.round((this.timeSpent / 60) * 100) / 100;
});

// Pre-save middleware for validation
progressSchema.pre('save', function(next) {
  // Validate milestone and customMilestone relationship
  if (this.milestone === 'custom' && !this.customMilestone) {
    return next(new Error('customMilestone is required when milestone is "custom"'));
  }
  
  if (this.milestone !== 'custom' && this.customMilestone) {
    this.customMilestone = undefined;
  }
  
  // Validate progress percentage based on milestone
  if (this.milestone === 'started' && this.progressPercentage > 25) {
    return next(new Error('Progress percentage should be ≤ 25% for "started" milestone'));
  }
  
  if (this.milestone === 'quarter' && (this.progressPercentage < 20 || this.progressPercentage > 35)) {
    return next(new Error('Progress percentage should be between 20-35% for "quarter" milestone'));
  }
  
  if (this.milestone === 'half' && (this.progressPercentage < 40 || this.progressPercentage > 60)) {
    return next(new Error('Progress percentage should be between 40-60% for "half" milestone'));
  }
  
  if (this.milestone === 'three-quarters' && (this.progressPercentage < 65 || this.progressPercentage > 85)) {
    return next(new Error('Progress percentage should be between 65-85% for "three-quarters" milestone'));
  }
  
  if (this.milestone === 'completed' && this.progressPercentage < 90) {
    return next(new Error('Progress percentage should be ≥ 90% for "completed" milestone'));
  }
  
  next();
});

// Instance method to calculate overall progress
progressSchema.methods.calculateOverallProgress = function() {
  const milestones = {
    'started': 10,
    'quarter': 25,
    'half': 50,
    'three-quarters': 75,
    'completed': 100
  };
  
  if (this.milestone && milestones[this.milestone]) {
    return Math.max(this.progressPercentage, milestones[this.milestone]);
  }
  
  return this.progressPercentage;
};

// Static method to get progress summary for a user
progressSchema.statics.getProgressSummary = async function(userId, programId = null) {
  const matchStage = { userId: new mongoose.Types.ObjectId(userId) };
  if (programId) {
    matchStage.programId = new mongoose.Types.ObjectId(programId);
  }
  
  const summary = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalEntries: { $sum: 1 },
        averageProgress: { $avg: '$progressPercentage' },
        maxProgress: { $max: '$progressPercentage' },
        totalTimeSpent: { $sum: '$timeSpent' },
        completedMilestones: {
          $sum: { $cond: [{ $eq: ['$milestone', 'completed'] }, 1, 0] }
        },
        lastUpdated: { $max: '$updatedAt' }
      }
    }
  ]);
  
  return summary[0] || {
    totalEntries: 0,
    averageProgress: 0,
    maxProgress: 0,
    totalTimeSpent: 0,
    completedMilestones: 0,
    lastUpdated: null
  };
};

module.exports = mongoose.model('Progress', progressSchema);

/*
Sample create payload:
{
  "userId": "<USER_ID>",
  "programId": "<PROGRAM_ID>",
  "activityId": "<ACTIVITY_ID>",
  "progressPercentage": 75,
  "completedTasks": ["Task 1", "Task 2", "Task 3"],
  "notes": "Making good progress on this activity",
  "milestone": "three-quarters",
  "score": 85,
  "timeSpent": 45,
  "difficulty": "medium",
  "mood": "good",
  "tags": ["math", "concentration"],
  "isPublic": false
}
*/