const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ==================== MULTER UPLOAD (PATIENT DOCUMENTS) ====================
// Stores files under /uploads/patient-docs with sanitized filenames.
// Restricts mime types and size. Use per-route to validate allowed mime types.

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'patient-docs');
    ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeBase = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}_${safeBase}`);
  }
});

const defaultAllowed = [
  'application/pdf',
  'image/png',
  'image/jpeg'
];

const fileFilter = (allowedMimeTypes = defaultAllowed) => (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Invalid file type'));
};

// Factory to create configured multer instance
const createPatientDocUploader = ({ maxSizeMB = 10, allowedMimeTypes = defaultAllowed } = {}) => {
  return multer({
    storage,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
    fileFilter: fileFilter(allowedMimeTypes)
  });
};

module.exports = { createPatientDocUploader };
