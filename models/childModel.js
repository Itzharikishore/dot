const mongoose = require('mongoose');

// ==================== CHILD SCHEMA ====================
// Represents a child profile owned by a parent (User with role 'child' is separate in your system).
// Each document belongs to exactly one parent (the authenticated user creating/managing it).
//
// Example document shape:
// {
//   _id: ObjectId,
//   parentId: ObjectId (ref: 'User'),
//   firstName: 'Ava',
//   lastName: 'Smith',
//   dateOfBirth: '2018-06-10T00:00:00.000Z',
//   gender: 'female',
//   notes: 'Peanut allergy',
//   profilePicture: 'https://.../image.jpg',
//   tags: ['allergy', 'speech'],
//   medical: {
//     diagnosis: 'ASD',
//     medications: ['med-1'],
//     allergies: ['Peanut']
//   },
//   isActive: true,
//   createdAt: Date,
//   updatedAt: Date
// }

const childSchema = new mongoose.Schema({
  // ==================== OWNERSHIP ====================
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // ==================== BASIC INFO ====================
  firstName: { type: String, required: true, trim: true, maxlength: 50 },
  lastName: { type: String, required: true, trim: true, maxlength: 50 },
  dateOfBirth: {
    type: Date,
    required: true,
    validate: {
      validator: function (d) { return d <= new Date(); },
      message: 'Date of birth cannot be in the future'
    }
  },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer-not-to-say'], default: 'prefer-not-to-say' },

  // ==================== PROFILE ====================
  profilePicture: { type: String, trim: true, default: '' },
  notes: { type: String, trim: true, maxlength: 1000, default: '' },
  tags: { type: [String], default: [], validate: { validator: arr => Array.isArray(arr) && arr.length <= 20, message: 'Too many tags' } },

  // ==================== MEDICAL ====================
  medical: {
    diagnosis: { type: String, trim: true, maxlength: 200, default: '' },
    medications: { type: [String], default: [] },
    allergies: { type: [String], default: [] }
  },

  // ==================== STATUS ====================
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// ==================== INDEXES ====================
// Ensure common query patterns are optimized
childSchema.index({ parentId: 1, lastName: 1, firstName: 1 });
childSchema.index({ isActive: 1 });

// ==================== VIRTUALS ====================
childSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ==================== SANITIZATION HOOKS ====================
childSchema.pre('save', function (next) {
  if (this.firstName) this.firstName = this.firstName.trim();
  if (this.lastName) this.lastName = this.lastName.trim();
  if (this.notes) this.notes = this.notes.trim();
  next();
});

// ==================== MODEL ====================
module.exports = mongoose.model('Child', childSchema);

/*
API Documentation (Child Model)

- Ownership: Each child is owned by a single parent via `parentId` (User._id).
- Access Control: Only the authenticated owner (or privileged roles like superuser) should manage the child's profile.

Example JSON for creation (request body):
{
  "firstName": "Ava",
  "lastName": "Smith",
  "dateOfBirth": "2018-06-10",
  "gender": "female",
  "notes": "Peanut allergy",
  "tags": ["allergy", "speech"],
  "medical": {
    "diagnosis": "ASD",
    "medications": ["med-1"],
    "allergies": ["Peanut"]
  }
}

*/
