const mongoose = require('mongoose');
const PatientDetail = require('../models/PatientDetail');

// ==================== Helpers ====================
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const isOwnerOrTherapist = (req, targetUserId) => {
  if (req.user.role === 'superuser') return true;
  if (req.user._id.toString() === targetUserId.toString()) return true; // owner (user viewing own)
  if (req.user.role === 'therapist') {
    return req.user.assignedPatients?.some((id) => id.toString() === targetUserId.toString());
  }
  return false;
};

// ==================== GET /api/patient-details/:id ====================
// Fetch patient detail by its document id (RBAC enforced)
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid ID format' });

    const doc = await PatientDetail.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Patient detail not found' });

    const targetUserId = doc.userId || doc.childId;
    if (!isOwnerOrTherapist(req, targetUserId)) return res.status(403).json({ success: false, message: 'Access denied' });

    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET /api/patient-details/lookup ====================
// Query by userId or childId to prefill during registration
exports.lookup = async (req, res) => {
  try {
    const { userId, childId } = req.query;
    if (!userId && !childId) return res.status(400).json({ success: false, message: 'userId or childId is required' });
    if (userId && !isValidObjectId(userId)) return res.status(400).json({ success: false, message: 'Invalid userId' });
    if (childId && !isValidObjectId(childId)) return res.status(400).json({ success: false, message: 'Invalid childId' });

    const filter = userId ? { userId } : { childId };
    const doc = await PatientDetail.findOne(filter);

    if (!doc) return res.status(200).json({ success: true, data: null });

    const targetUserId = doc.userId || doc.childId;
    if (!isOwnerOrTherapist(req, targetUserId)) return res.status(403).json({ success: false, message: 'Access denied' });

    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== POST /api/patient-details/upsert ====================
// Create or update patient detail for a given userId or childId
exports.upsert = async (req, res) => {
  try {
    const { userId, childId, name, dateOfBirth, gender, medicalHistory, allergies, pastDiseases } = req.body;
    if (!userId && !childId) return res.status(400).json({ success: false, message: 'userId or childId is required' });
    if (userId && !isValidObjectId(userId)) return res.status(400).json({ success: false, message: 'Invalid userId' });
    if (childId && !isValidObjectId(childId)) return res.status(400).json({ success: false, message: 'Invalid childId' });

    const targetUserId = userId || childId;
    if (!isOwnerOrTherapist(req, targetUserId)) return res.status(403).json({ success: false, message: 'Access denied' });

    const filter = userId ? { userId } : { childId };
    const update = {
      userId: userId || undefined,
      childId: childId || undefined,
      name,
      dateOfBirth,
      gender,
      medicalHistory,
      allergies,
      pastDiseases,
      lastUpdatedBy: req.user._id
    };

    const options = { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true };
    const doc = await PatientDetail.findOneAndUpdate(filter, update, options);

    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== POST /api/patient-details/:id/documents ====================
// Append a document metadata to the patient detail (file should be uploaded separately or via request)
exports.addDocument = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid ID format' });

    const doc = await PatientDetail.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Patient detail not found' });

    const targetUserId = doc.userId || doc.childId;
    if (!isOwnerOrTherapist(req, targetUserId)) return res.status(403).json({ success: false, message: 'Access denied' });

    const uploaded = req.file; // from multer
    if (!uploaded) return res.status(400).json({ success: false, message: 'No file uploaded' });

    doc.documents.push({
      name: req.body.name || uploaded.originalname,
      url: `/uploads/patient-docs/${uploaded.filename}`,
      mimeType: uploaded.mimetype,
      uploadedAt: new Date()
    });

    doc.lastUpdatedBy = req.user._id;
    await doc.save();

    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
