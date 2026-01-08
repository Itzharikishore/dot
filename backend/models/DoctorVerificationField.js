const mongoose = require('mongoose');

// ==================== DOCTOR VERIFICATION FIELD MODEL ====================
// Defines custom verification fields that a hospital requires from doctors
// during registration. Hospitals can create any number of fields with
// type-specific rules and options.
//
// Example:
// {
//   hospitalId: ObjectId('...'),
//   fieldName: 'Medical License',
//   fieldType: 'file', // text|textarea|number|date|dropdown|checkbox|file|image|email|phone
//   required: true,
//   validationRules: { maxLength: 200, mimeTypes: ['application/pdf'], maxSizeMB: 5 },
//   options: [ { value: 'cardiology', label: 'Cardiology' } ] // for dropdown/checkbox
// }

const optionSchema = new mongoose.Schema({
  value: { type: String, required: true },
  label: { type: String, required: true }
}, { _id: false });

const validationRulesSchema = new mongoose.Schema({
  // generic string rules
  minLength: { type: Number },
  maxLength: { type: Number },
  regex: { type: String },
  // number rules
  min: { type: Number },
  max: { type: Number },
  // file rules
  mimeTypes: { type: [String], default: [] },
  maxSizeMB: { type: Number },
}, { _id: false });

const doctorVerificationFieldSchema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fieldName: { type: String, required: true, trim: true, maxlength: 120 },
  fieldType: {
    type: String,
    required: true,
    enum: [ 'text', 'textarea', 'number', 'date', 'dropdown', 'checkbox', 'file', 'image', 'email', 'phone' ]
  },
  required: { type: Boolean, default: true },
  validationRules: { type: validationRulesSchema, default: undefined },
  options: { type: [optionSchema], default: [] },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Indexes
doctorVerificationFieldSchema.index({ hospitalId: 1, fieldName: 1 }, { unique: true });
doctorVerificationFieldSchema.index({ isActive: 1 });

// Sanitization
doctorVerificationFieldSchema.pre('save', function(next) {
  if (this.fieldName) this.fieldName = this.fieldName.trim();
  next();
});

module.exports = mongoose.model('DoctorVerificationField', doctorVerificationFieldSchema);

/*
Sample Create (Hospital):
POST /api/doctors/verification/fields
{
  "fieldName": "Medical License",
  "fieldType": "file",
  "required": true,
  "validationRules": { "mimeTypes": ["application/pdf"], "maxSizeMB": 5 }
}
*/
