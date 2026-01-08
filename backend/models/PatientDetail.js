const mongoose = require('mongoose');

// ==================== PATIENT DETAIL MODEL ====================
// Central medical/personal record for a patient (user or child). Other modules
// reference this document to read/write patient information. One PatientDetail
// should map to one logical patient entity.
//
// Notes:
// - Either userId or childId must be present. We enforce via custom validator.
// - Documents can store uploaded file metadata (e.g., links, mimeType).

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., 'Immunization Card'
  url: { type: String, required: true },  // storage URL/path
  mimeType: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const patientDetailSchema = new mongoose.Schema({
  // Ownership / linkage
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // if children are also Users

  // Personal info
  name: { type: String, required: true, trim: true, maxlength: 120 },
  dateOfBirth: {
    type: Date,
    required: true,
    validate: {
      validator: d => d <= new Date(),
      message: 'Date of birth cannot be in the future'
    }
  },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer-not-to-say'], default: 'prefer-not-to-say' },

  // Medical info
  medicalHistory: { type: String, trim: true, maxlength: 5000, default: '' },
  allergies: { type: [String], default: [] },
  pastDiseases: { type: [String], default: [] },

  // Documents (file metadata)
  documents: { type: [documentSchema], default: [] },

  // Audit
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// At least one of userId or childId must be set
patientDetailSchema.pre('validate', function(next) {
  if (!this.userId && !this.childId) {
    return next(new Error('Either userId or childId must be provided'));
  }
  next();
});

// Indexes
patientDetailSchema.index({ userId: 1 }, { unique: false });
patientDetailSchema.index({ childId: 1 }, { unique: false });
patientDetailSchema.index({ name: 1 });

module.exports = mongoose.model('PatientDetail', patientDetailSchema);

/*
Sample document:
{
  "userId": "64f...",
  "name": "Ava Smith",
  "dateOfBirth": "2018-06-10T00:00:00.000Z",
  "gender": "female",
  "medicalHistory": "ASD, ongoing speech therapy",
  "allergies": ["Peanut"],
  "pastDiseases": ["Chickenpox"],
  "documents": [
    { "name": "Immunization Card", "url": "https://storage/.../card.pdf", "mimeType": "application/pdf" }
  ],
  "lastUpdatedBy": "68c..."
}
*/
