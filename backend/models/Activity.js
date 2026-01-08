const mongoose = require('mongoose');  
// Import mongoose (used to connect and interact with MongoDB)

const activitySchema = new mongoose.Schema({  
  // Create a schema (blueprint) for "Activity"

  // --------- Basic Activity Information ---------
  title: {
    type: String, // Title must be a string
    required: [true, 'Activity title is required'], // Mandatory field
    trim: true, // Removes spaces before/after
    maxlength: [100, 'Title cannot exceed 100 characters'] // Limit title length
  },
  description: {
    type: String,
    required: [true, 'Activity description is required'], // Must have description
    maxlength: [500, 'Description cannot exceed 500 characters'] // Max length 500
  },
  
  // --------- Activity Classification ---------
  category: {
    type: String,
    required: [true, 'Category is required'], // Each activity must have a category
    enum: [ // Allowed only these fixed values
      'speech-articulation',
      'speech-language',
      'speech-fluency',
      'cognitive-memory',
      'cognitive-attention',
      'cognitive-problem-solving',
      'motor-fine',
      'motor-gross',
      'social-communication',
      'social-interaction',
      'behavioral-regulation',
      'sensory-processing'
    ]
  },
  
  subcategory: {
    type: String, // Extra detail under category
    required: true
  },
  
  // --------- Difficulty and Targeting ---------
  difficultyLevel: {
    type: String,
    required: [true, 'Difficulty level is required'],
    enum: ['beginner', 'intermediate', 'advanced'] // Only 3 levels
  },
  
  ageRange: {
    // Defines min & max age for the activity
    min: {
      type: Number,
      required: true,
      min: 1, // Minimum 1 year
      max: 18 // Max 18 years
    },
    max: {
      type: Number,
      required: true,
      min: 1,
      max: 18
    }
  },
  
  // --------- Activity Content ---------
  instructions: [{ // Array of steps
    step: { type: Number, required: true }, // Step number
    description: { type: String, required: true }, // What to do
    image: String, // Optional image
    audio: String  // Optional audio
  }],
  
  // --------- Media Resources ---------
  thumbnailImage: {
    type: String,
    required: true // Every activity must have a thumbnail
  },
  
  media: { // Extra media files
    images: [String],
    videos: [String],
    audio: [String],
    documents: [String]
  },
  
  // --------- Activity Configuration ---------
  estimatedDuration: {
    type: Number, // Time in minutes
    required: [true, 'Estimated duration is required'],
    min: 1, // At least 1 min
    max: 120 // Max 2 hours
  },
  
  materials: [String], // List of required materials
  
  // --------- Scoring and Assessment ---------
  scoringCriteria: {
    type: String,
    enum: ['percentage', 'points', 'completion', 'time-based', 'observation'], // How score is measured
    default: 'completion'
  },
  
  maxScore: { type: Number, default: 100 }, // Default max score
  passingScore: { type: Number, default: 70 }, // Passing marks
  
  // --------- Activity Questions/Tasks ---------
  tasks: [{ // For interactive tasks
    type: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'fill-blank', 'drag-drop', 'voice-recording', 'drawing', 'matching']
    },
    question: String, // Question text
    options: [String], // Choices for MCQ
    correctAnswer: String, // Answer
    points: { type: Number, default: 1 }, // Points for this task
    media: { // Media with the task
      image: String,
      audio: String,
      video: String
    }
  }],
  
  // --------- Therapy Goals Alignment ---------
  therapyGoals: [{
    goalId: {
      type: mongoose.Schema.Types.ObjectId, // Reference another model
      ref: 'TherapyGoal'
    },
    weight: { type: Number, min: 0, max: 1, default: 1 } // Importance of goal
  }],
  
  // --------- Usage Statistics ---------
  stats: {
    totalAttempts: { type: Number, default: 0 }, // How many times activity was tried
    totalCompletions: { type: Number, default: 0 }, // How many times completed
    averageScore: { type: Number, default: 0 }, // Average score of all attempts
    averageCompletionTime: { type: Number, default: 0 } // Avg time taken
  },
  
  // --------- Status and Visibility ---------
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'], // Draft = not ready, Published = active, Archived = old
    default: 'draft'
  },
  
  isActive: { type: Boolean, default: true }, // Whether activity is usable or not
  
  // --------- Creation and Modification ---------
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to User model (who created it)
    required: true
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Who last edited the activity
  },
  
  // --------- Access Control ---------
  visibility: {
    type: String,
    enum: ['public', 'private', 'therapist-only'], // Who can see the activity
    default: 'public'
  },
  
  // --------- Tags ---------
  tags: [String] // For searching/filtering activities
}, {
  timestamps: true, // Auto adds createdAt & updatedAt
  toJSON: { virtuals: true }, // Include virtuals when converting to JSON
  toObject: { virtuals: true } // Include virtuals when converting to object
});

// --------- Virtual Fields ---------
// Virtual = field not stored in DB, but calculated
activitySchema.virtual('completionRate').get(function() {
  if (this.stats.totalAttempts === 0) return 0; // Avoid divide by 0
  return (this.stats.totalCompletions / this.stats.totalAttempts) * 100; // % of completions
});

// --------- Indexes ---------
// Improves search speed
activitySchema.index({ category: 1, difficultyLevel: 1 }); // Search by category & difficulty
activitySchema.index({ 'ageRange.min': 1, 'ageRange.max': 1 }); // Search by age range
activitySchema.index({ title: 'text', description: 'text', tags: 'text' }); // Full text search

// Export the model so it can be used in controllers
module.exports = mongoose.model('Activity', activitySchema);
