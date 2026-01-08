const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  // ==================== BASIC INFO ====================
  name: {
    type: String,
    required: [true, 'Game name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  image: {
    type: String,
    required: [true, 'Game image is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Fine Motor',
      'Gross Motor',
      'Speech & Language',
      'Cognitive',
      'Social Skills',
      'Sensory',
      'Daily Living',
      'Emotional Regulation'
    ]
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // ==================== GAME DETAILS ====================
  difficulty: {
    type: String,
    required: [true, 'Difficulty is required'],
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Easy'
  },
  ageGroup: {
    type: String,
    required: [true, 'Age group is required'],
    enum: ['3-5', '5-7', '7-9', '9-12', '12+']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
    max: [120, 'Duration cannot exceed 120 minutes']
  },
  
  // ==================== THERAPEUTIC INFO ====================
  benefits: [{
    type: String,
    trim: true,
    maxlength: [100, 'Benefit cannot exceed 100 characters']
  }],
  instructions: {
    type: String,
    required: [true, 'Instructions are required'],
    trim: true,
    maxlength: [2000, 'Instructions cannot exceed 2000 characters']
  },
  materials: [{
    type: String,
    trim: true,
    maxlength: [100, 'Material cannot exceed 100 characters']
  }],
  
  // ==================== SYSTEM FIELDS ====================
  isActive: {
    type: Boolean,
    default: true
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  playCount: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot exceed 5']
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  
  // ==================== RELATIONSHIPS ====================
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  therapyGoals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TherapyGoal'
  }],
  
  // ==================== MEDIA ====================
  thumbnailImage: {
    type: String,
    trim: true
  },
  mediaFiles: [{
    type: String,
    trim: true
  }],
  
  // ==================== SETTINGS ====================
  settings: {
    maxPlayers: {
      type: Number,
      default: 1,
      min: [1, 'Minimum 1 player'],
      max: [10, 'Maximum 10 players']
    },
    isMultiplayer: {
      type: Boolean,
      default: false
    },
    requiresSupervision: {
      type: Boolean,
      default: true
    },
    accessibility: {
      type: [String],
      enum: ['visual', 'audio', 'motor', 'cognitive'],
      default: []
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==================== INDEXES ====================
gameSchema.index({ name: 1 });
gameSchema.index({ category: 1 });
gameSchema.index({ difficulty: 1 });
gameSchema.index({ ageGroup: 1 });
gameSchema.index({ isActive: 1 });
gameSchema.index({ createdBy: 1 });
gameSchema.index({ averageRating: -1 });

// ==================== INSTANCE METHODS ====================
gameSchema.methods.incrementPlayCount = function() {
  this.playCount += 1;
  return this.save();
};

gameSchema.methods.updateRating = function(newRating) {
  const totalRating = this.averageRating * this.ratingCount + newRating;
  this.ratingCount += 1;
  this.averageRating = totalRating / this.ratingCount;
  return this.save();
};

// ==================== VIRTUALS ====================
gameSchema.virtual('ratingDisplay').get(function() {
  if (this.ratingCount === 0) return 'Not Rated';
  return `${this.averageRating.toFixed(1)} (${this.ratingCount} reviews)`;
});

module.exports = mongoose.model('Game', gameSchema);
