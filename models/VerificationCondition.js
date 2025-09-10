const mongoose = require('mongoose');

// ==================== VERIFICATION CONDITION MODEL ====================
// This model defines dynamic verification conditions that a superuser can configure
// for hospital registration. Each condition can describe one or more fields the
// hospital must provide (text, date, select, file upload, etc.).
//
// Example document:
// {
//   name: "Accreditation Details",
//   description: "Submit NABH certificate and validity dates",
//   isActive: true,
//   fields: [
//     {
//       key: "nabhCertificate",
//       label: "NABH Certificate",
//       type: "file", // text|textarea|number|date|select|checkbox|file|image|email|phone
//       required: true,
//       file: { mimeTypes: ["application/pdf"], maxSizeMB: 10 }
//     },
//     {
//       key: "validFrom",
//       label: "Valid From",
//       type: "date",
//       required: true
//     },
//     {
//       key: "validTo",
//       label: "Valid To",
//       type: "date",
//       required: true
//     },
//     {
//       key: "contactEmail",
//       label: "Accreditation Contact Email",
//       type: "email",
//       required: false
//     }
//   ],
//   createdBy: ObjectId(User with role superuser)
// }

const fieldValidationSchema = new mongoose.Schema({
  // For text/textarea/email/phone
  minLength: { type: Number },
  maxLength: { type: Number },
  // For number
  min: { type: Number },
  max: { type: Number },
  // For regex validation on strings
  regex: { type: String }, // store as string to avoid BSON regex pitfalls; compile in app layer
}, { _id: false });

const fileConstraintSchema = new mongoose.Schema({
  mimeTypes: { type: [String], default: [] }, // e.g. ["application/pdf", "image/png"]
  maxSizeMB: { type: Number, default: 5 },
}, { _id: false });

const selectableOptionSchema = new mongoose.Schema({
  value: { type: String, required: true },
  label: { type: String, required: true }
}, { _id: false });

const conditionFieldSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true }, // unique per condition
  label: { type: String, required: true, trim: true },
  type: {
    type: String,
    required: true,
    enum: [
      'text', 'textarea', 'number', 'date', 'select', 'checkbox',
      'file', 'image', 'email', 'phone'
    ]
  },
  required: { type: Boolean, default: true },
  placeholder: { type: String, default: '' },
  helpText: { type: String, default: '' },
  // For select/checkbox types
  options: { type: [selectableOptionSchema], default: [] },
  // Validation rules for scalar types
  validation: { type: fieldValidationSchema, default: undefined },
  // File/image specific constraints
  file: { type: fileConstraintSchema, default: undefined },
  // Whether hospitals can edit this after initial submission
  editableAfterSubmit: { type: Boolean, default: false }
}, { _id: false });

const verificationConditionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  isActive: { type: Boolean, default: true },
  // Versioning allows evolving conditions without breaking existing submissions
  version: { type: Number, default: 1, min: 1 },
  // Fields to be collected from hospitals
  fields: { type: [conditionFieldSchema], default: [], validate: v => Array.isArray(v) && v.length > 0 },
  // Auditing
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Indexes for quick queries
verificationConditionSchema.index({ isActive: 1 });
verificationConditionSchema.index({ name: 1 });
verificationConditionSchema.index({ version: 1 });

// Basic sanitization before save
verificationConditionSchema.pre('save', function(next) {
  if (this.name) this.name = this.name.trim();
  if (this.description) this.description = this.description.trim();
  // Ensure field keys are unique within the condition
  if (Array.isArray(this.fields)) {
    const keys = this.fields.map(f => f.key);
    const unique = new Set(keys);
    if (unique.size !== keys.length) {
      return next(new Error('Duplicate field keys are not allowed within a condition'));
    }
  }
  next();
});

module.exports = mongoose.model('VerificationCondition', verificationConditionSchema);

/*
Sample Create Condition (Superuser):
POST /api/verification/conditions
{
  "name": "Accreditation Details",
  "description": "Submit NABH certificate and validity",
  "version": 1,
  "fields": [
    { "key": "nabhCertificate", "label": "NABH Certificate", "type": "file", "required": true, "file": { "mimeTypes": ["application/pdf"], "maxSizeMB": 10 } },
    { "key": "validFrom", "label": "Valid From", "type": "date", "required": true },
    { "key": "validTo", "label": "Valid To", "type": "date", "required": true },
    { "key": "contactEmail", "label": "Contact Email", "type": "email", "required": false }
  ]
}
*/
