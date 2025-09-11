const mongoose = require('mongoose');
const Activity = require('../models/Activity');

// ==================== Helpers ====================
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ==================== GET /api/activities ====================
// Public list of activities (optionally filtered by status, difficulty, age, search)
exports.getAllActivities = async (req, res) => {
  try {
    const { status, difficultyLevel, minAge, maxAge, q, category } = req.query;

    const filter = { isActive: true };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (difficultyLevel) filter.difficultyLevel = difficultyLevel;
    if (minAge || maxAge) {
      filter['ageRange.min'] = { $gte: Number(minAge || 1) };
      filter['ageRange.max'] = { $lte: Number(maxAge || 18) };
    }
    if (q) {
      filter.$text = { $search: q };
    }

    const activities = await Activity.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: activities });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET /api/activities/category/:category ====================
exports.getByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const activities = await Activity.find({ category, isActive: true }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: activities });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== POST /api/activities ====================
// Therapist only
exports.createActivity = async (req, res) => {
  try {
    const payload = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      subcategory: req.body.subcategory,
      difficultyLevel: req.body.difficultyLevel,
      ageRange: req.body.ageRange,
      instructions: req.body.instructions,
      thumbnailImage: req.body.thumbnailImage,
      media: req.body.media,
      estimatedDuration: req.body.estimatedDuration,
      materials: req.body.materials,
      scoringCriteria: req.body.scoringCriteria,
      maxScore: req.body.maxScore,
      passingScore: req.body.passingScore,
      tasks: req.body.tasks,
      therapyGoals: req.body.therapyGoals,
      status: req.body.status,
      isActive: req.body.isActive,
      visibility: req.body.visibility,
      tags: req.body.tags,
      createdBy: req.user._id
    };

    const activity = await Activity.create(payload);
    return res.status(201).json({ success: true, data: activity });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== PUT /api/activities/:id ====================
exports.updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid ID format' });

    const activity = await Activity.findById(id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });

    // Permissions: superuser or therapist; optionally restrict to creator if needed
    if (!(req.user.role === 'superuser' || req.user.role === 'therapist')) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const updatable = [
      'title','description','category','subcategory','difficultyLevel','ageRange','instructions','thumbnailImage','media',
      'estimatedDuration','materials','scoringCriteria','maxScore','passingScore','tasks','therapyGoals','status','isActive','visibility','tags'
    ];
    updatable.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        activity[field] = req.body[field];
      }
    });
    activity.lastModifiedBy = req.user._id;

    await activity.save();
    return res.status(200).json({ success: true, data: activity });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== POST /api/activities/:id/upload ====================
// Upload an artifact of completion; increments stats
exports.uploadCompletion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid ID format' });

    const activity = await Activity.findById(id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });

    // File from multer
    const uploaded = req.file;
    if (!uploaded) return res.status(400).json({ success: false, message: 'No file uploaded' });

    // Save artifact into media.documents list (or images/videos based on mimetype)
    if (!activity.media) activity.media = { images: [], videos: [], audio: [], documents: [] };
    const path = `/uploads/patient-docs/${uploaded.filename}`;
    if (uploaded.mimetype.startsWith('image/')) {
      activity.media.images = activity.media.images || [];
      activity.media.images.push(path);
    } else if (uploaded.mimetype.startsWith('video/')) {
      activity.media.videos = activity.media.videos || [];
      activity.media.videos.push(path);
    } else if (uploaded.mimetype.startsWith('audio/')) {
      activity.media.audio = activity.media.audio || [];
      activity.media.audio.push(path);
    } else {
      activity.media.documents = activity.media.documents || [];
      activity.media.documents.push(path);
    }

    // Increment stats
    activity.stats = activity.stats || {};
    activity.stats.totalAttempts = (activity.stats.totalAttempts || 0) + 1;
    activity.stats.totalCompletions = (activity.stats.totalCompletions || 0) + 1;

    await activity.save();

    return res.status(200).json({ success: true, data: activity });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
