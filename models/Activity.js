const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Activity title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Activity description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Activity categorization
  category: {
    type: String,
    required: true,
    enum: ['fine_motor', 'gross_motor', 'cognitive', 'sensory', 'communication', 'social']
  },
  
  // Difficulty and age appropriateness
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  ageRange: {
    min: {
      type: Number,
      required: true,
      min: 2
    },
    max: {
      type: Number,
      required: true,
      max: 18
    }
  },
  
  // Activity content
  instructions: [{
    step: {
      type: Number,
      required: true
    },
    instruction: {
      type: String,
      required: true
    },
    image: String
  }],
  
  thumbnailImage: {
    type: String,
    required: true
  },
  
  // Activity properties
  duration: {
    type: Number, // in minutes
    required: true,
    min: 1,
    max: 120
  },
  
  pointsValue: {
    type: Number,
    default: 10,
    min: 1,
    max: 100
  },
  
  // Creator and status
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'active'
  },
  
  // Analytics
  completionCount: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  tags: [String]

}, {
  timestamps: true
});

// Indexes
ActivitySchema.index({ category: 1, difficulty: 1 });
ActivitySchema.index({ 'ageRange.min': 1, 'ageRange.max': 1 });
ActivitySchema.index({ status: 1 });

module.exports = mongoose.model('Activity', ActivitySchema);