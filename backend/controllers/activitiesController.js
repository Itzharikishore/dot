const mongoose = require('mongoose');
const Activity = require('../models/Activity');
const ActivityAssignment = require('../models/ActivityAssignment');
const HomeProgram = require('../models/HomeProgram');
const User = require('../models/User');

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

// ==================== GET /api/activities/schedule ====================
// Get activity schedules (from assignments)
exports.getActivitySchedule = async (req, res) => {
  try {
    let filter = {};
    
    // If user is therapist, show only their assignments
    if (req.user && req.user.role === 'therapist') {
      filter.assignedBy = req.user._id;
    }
    // If user is child, show only their assignments
    else if (req.user && req.user.role === 'child') {
      filter.childId = req.user._id;
    }
    // Superuser can see all

    const assignments = await ActivityAssignment.find(filter)
      .populate('childId', 'firstName lastName')
      .populate('assignedBy', 'firstName lastName')
      .populate('activityId', 'title category')
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    // Transform to frontend format
    const schedule = assignments.map(assignment => {
      const child = assignment.childId;
      const therapist = assignment.assignedBy;
      const activity = assignment.activityId;
      
      // Format time from dueDate
      const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : new Date();
      const timeStr = dueDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });

      // Color based on status
      const colorMap = {
        'assigned': '#FF6B6B',
        'in-progress': '#4ECDC4',
        'completed': '#95E1D3',
        'cancelled': '#999999'
      };

      return {
        id: assignment._id.toString(),
        childName: child ? `${child.firstName} ${child.lastName}`.trim() : 'N/A',
        therapistName: therapist ? `${therapist.firstName} ${therapist.lastName}`.trim() : 'N/A',
        activityName: activity?.title || 'N/A',
        time: timeStr,
        status: assignment.status,
        color: colorMap[assignment.status] || '#999999',
        dueDate: assignment.dueDate,
        notes: assignment.notes
      };
    });

    return res.status(200).json({ 
      success: true, 
      data: schedule 
    });
  } catch (err) {
    console.error('Error fetching activity schedule:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET /api/activities/stats ====================
// Get activity statistics
exports.getActivityStats = async (req, res) => {
  try {
    let filter = {};
    
    // If user is therapist, count only their data
    if (req.user && req.user.role === 'therapist') {
      filter.assignedBy = req.user._id;
    }

    // Count therapists (users with role 'therapist')
    const totalTherapist = await User.countDocuments({ 
      role: 'therapist', 
      isActive: true 
    });

    // Count children (users with role 'child')
    const childrenEnrolled = await User.countDocuments({ 
      role: 'child', 
      isActive: true 
    });

    // Count active home programs
    const activeProgram = await HomeProgram.countDocuments({ 
      status: 'active',
      ...(req.user && req.user.role === 'therapist' ? { assignedBy: req.user._id } : {})
    });

    // Count pending programs (programs with incomplete items)
    const allPrograms = await HomeProgram.find({
      status: 'active',
      ...(req.user && req.user.role === 'therapist' ? { assignedBy: req.user._id } : {})
    }).lean();

    let pendingProgram = 0;
    for (const program of allPrograms) {
      if (program.items && program.items.length > 0) {
        const hasIncomplete = program.items.some(item => 
          item.status !== 'completed' && item.status !== 'skipped'
        );
        if (hasIncomplete) pendingProgram++;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        totalTherapist,
        childrenEnrolled,
        activeProgram,
        pendingProgram
      }
    });
  } catch (err) {
    console.error('Error fetching activity stats:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET /api/activities/schedule ====================
// Get activity schedule for dashboard
exports.getActivitySchedule = async (req, res) => {
  try {
    const { date, therapistId, childId } = req.query;
    
    // Build query for activity assignments
    let query = {};
    
    // Filter by date if provided
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.scheduledDate = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    } else {
      // Default to today
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.scheduledDate = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }
    
    // Role-based filtering
    if (req.user.role === 'therapist') {
      query.therapistId = req.user._id;
    } else if (req.user.role === 'child') {
      query.childId = req.user._id;
    }
    
    // Additional filtering
    if (therapistId) query.therapistId = therapistId;
    if (childId) query.childId = childId;

    // Get activity assignments
    const assignments = await ActivityAssignment.find(query)
      .populate('activityId', 'title description category difficultyLevel')
      .populate('therapistId', 'firstName lastName')
      .populate('childId', 'firstName lastName')
      .sort({ scheduledDate: 1 });

    // Transform to frontend format
    const schedule = assignments.map(assignment => {
      const scheduledTime = assignment.scheduledDate;
      const timeString = scheduledTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      
      // Generate color based on status
      let color = '#FF6B6B'; // Default red
      if (assignment.status === 'completed') {
        color = '#4ECDC4'; // Green
      } else if (assignment.status === 'in-progress') {
        color = '#45B7D1'; // Blue
      }

      return {
        id: assignment._id.toString(),
        childName: assignment.childId ? 
          `${assignment.childId.firstName} ${assignment.childId.lastName}` : 
          'Unassigned',
        therapistName: assignment.therapistId ? 
          `${assignment.therapistId.firstName} ${assignment.therapistId.lastName}` : 
          'Unassigned',
        time: timeString,
        status: assignment.status || 'scheduled',
        color: color,
        activityTitle: assignment.activityId?.title || 'Activity',
        activityId: assignment.activityId?._id,
        scheduledDate: assignment.scheduledDate,
        notes: assignment.notes
      };
    });

    return res.status(200).json({
      success: true,
      data: schedule
    });
  } catch (err) {
    console.error('Error fetching activity schedule:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== POST /api/activities/create ====================
// Create a new activity session (assignment)
exports.createActivitySession = async (req, res) => {
  try {
    const {
      childId,
      therapistId,
      sessionTime,
      activityType,
      notes,
      activityId
    } = req.body;

    // Validation
    if (!childId || !therapistId || !sessionTime) {
      return res.status(400).json({
        success: false,
        message: 'childId, therapistId, and sessionTime are required'
      });
    }

    // Verify permissions
    if (req.user.role === 'therapist' && therapistId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Can only create sessions for yourself'
      });
    }

    // Verify child exists
    const child = await User.findById(childId);
    if (!child || child.role !== 'child') {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Verify therapist exists
    const therapist = await User.findById(therapistId);
    if (!therapist || therapist.role !== 'therapist') {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found'
      });
    }

    // Create activity assignment
    const assignment = await ActivityAssignment.create({
      childId,
      therapistId,
      activityId: activityId || null,
      scheduledDate: new Date(sessionTime),
      status: 'scheduled',
      notes: notes || '',
      activityType: activityType || 'therapy',
      assignedBy: req.user._id
    });

    const populatedAssignment = await ActivityAssignment.findById(assignment._id)
      .populate('activityId', 'title description')
      .populate('therapistId', 'firstName lastName')
      .populate('childId', 'firstName lastName');

    return res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: {
        id: assignment._id,
        childName: `${populatedAssignment.childId.firstName} ${populatedAssignment.childId.lastName}`,
        therapistName: `${populatedAssignment.therapistId.firstName} ${populatedAssignment.therapistId.lastName}`,
        time: populatedAssignment.scheduledDate.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        status: populatedAssignment.status,
        color: '#FF6B6B'
      }
    });
  } catch (err) {
    console.error('Error creating activity session:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
