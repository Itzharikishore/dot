const mongoose = require('mongoose');

// ==================== HOME PROGRAM MODEL ====================
// Represents a curated set of activities assigned to a specific child for home practice.
// A HomeProgram contains one or more entries mapping an activity to schedule, notes, and completion history.

const completionEntrySchema = new mongoose.Schema({
  completedAt: { type: Date, default: Date.now },
  score: { type: Number, min: 0 },
  notes: { type: String, trim: true, maxlength: 500 }
}, { _id: false });

const programItemSchema = new mongoose.Schema({
  activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true },
  targetFrequencyPerWeek: { type: Number, min: 0, max: 70, default: 0 },
  dueDate: { type: Date },
  notes: { type: String, trim: true, maxlength: 1000 },
  status: { type: String, enum: ['assigned', 'in-progress', 'completed', 'cancelled'], default: 'assigned' },
  completions: { type: [completionEntrySchema], default: [] }
}, { _id: true });

const homeProgramSchema = new mongoose.Schema({
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // therapist/superuser
  title: { type: String, trim: true, maxlength: 120, default: '' },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  items: { type: [programItemSchema], default: [], validate: v => Array.isArray(v) && v.length > 0 },
  status: { type: String, enum: ['active', 'paused', 'completed'], default: 'active', index: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

homeProgramSchema.index({ childId: 1, status: 1, startDate: -1 });

homeProgramSchema.pre('save', function(next) {
  if (this.endDate && this.endDate < this.startDate) {
    return next(new Error('endDate cannot be earlier than startDate'));
  }
  next();
});

module.exports = mongoose.model('HomeProgram', homeProgramSchema);

/*
Sample create payload:
{
  "childId": "<USER_ID>",
  "title": "Week 1 Home Program",
  "description": "Focus on phonics and memory",
  "items": [
    {
      "activityId": "<ACTIVITY_ID>",
      "targetFrequencyPerWeek": 3,
      "dueDate": "2025-09-20",
      "notes": "Short sessions"
    }
  ]
}
*/
