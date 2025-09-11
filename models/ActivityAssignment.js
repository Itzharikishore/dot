const mongoose = require('mongoose');

// ==================== ACTIVITY ASSIGNMENT MODEL ====================
// Links a therapist-assigned Activity to a specific child (patient).
// Tracks due date, notes, status, progress, and submission artifacts.
//
// Status lifecycle: 'assigned' -> 'in-progress' -> 'completed' (or 'cancelled')

const artifactSchema = new mongoose.Schema({
  url: { type: String, required: true },
  mimeType: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const progressSchema = new mongoose.Schema({
  completionPercent: { type: Number, min: 0, max: 100, default: 0 },
  score: { type: Number, min: 0 },
  submittedAt: { type: Date },
  artifacts: { type: [artifactSchema], default: [] },
  notesFromTherapist: { type: String, trim: true, maxlength: 1000 },
  notesFromParent: { type: String, trim: true, maxlength: 1000 }
}, { _id: false });

const activityAssignmentSchema = new mongoose.Schema({
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // child user
  activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true, index: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // therapist

  dueDate: { type: Date },
  notes: { type: String, trim: true, maxlength: 1000 },

  status: {
    type: String,
    enum: ['assigned', 'in-progress', 'completed', 'cancelled'],
    default: 'assigned',
    index: true
  },

  progress: { type: progressSchema, default: () => ({}) },

  // Audit
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Compound indexes to support common queries
activityAssignmentSchema.index({ childId: 1, status: 1, dueDate: 1 });
activityAssignmentSchema.index({ assignedBy: 1, status: 1 });
activityAssignmentSchema.index({ activityId: 1, childId: 1 }, { unique: false });

// Basic sanitization
activityAssignmentSchema.pre('save', function(next) {
  if (this.notes) this.notes = this.notes.trim();
  next();
});

module.exports = mongoose.model('ActivityAssignment', activityAssignmentSchema);

/*
Sample create (therapist assigns to child):
{
  "childId": "68c...", 
  "activityId": "68d...",
  "dueDate": "2025-09-20",
  "notes": "Practice daily"
}
*/
