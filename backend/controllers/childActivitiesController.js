const mongoose = require('mongoose');
const User = require('../models/User');
const ActivityAssignment = require('../models/ActivityAssignment');
const Activity = require('../models/Activity');

// ==================== Helpers ====================
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ==================== GET /api/children/:childId/activities ====================
// Get all activities assigned to a specific child
exports.getChildActivities = async (req, res) => {
  try {
    const { childId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    if (!isValidObjectId(childId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid child ID'
      });
    }

    // Check if child exists
    const child = await User.findById(childId);
    if (!child || child.role !== 'child') {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Check permissions
    if (req.user.role === 'child' && req.user._id.toString() !== childId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role === 'therapist' && !child.assignedTherapist?.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build query
    let query = { childId };
    if (status) {
      query.status = status;
    }

    // Get activity assignments
    const assignments = await ActivityAssignment.find(query)
      .populate('activityId', 'title description category difficultyLevel duration')
      .populate('therapistId', 'firstName lastName')
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ActivityAssignment.countDocuments(query);

    // Transform to frontend format
    const activities = assignments.map(assignment => ({
      id: assignment._id.toString(),
      activityId: assignment.activityId?._id,
      activityName: assignment.activityId?.title || 'Activity',
      activityDescription: assignment.activityId?.description || '',
      category: assignment.activityId?.category || 'General',
      difficulty: assignment.activityId?.difficultyLevel || 'Medium',
      duration: assignment.activityId?.duration || 30,
      therapistId: assignment.therapistId?._id,
      therapistName: assignment.therapistId ? 
        `${assignment.therapistId.firstName} ${assignment.therapistId.lastName}` : 
        'Unassigned',
      scheduledDate: assignment.scheduledDate,
      completedAt: assignment.completedAt,
      status: assignment.status || 'scheduled',
      notes: assignment.notes || '',
      progress: assignment.progress || {},
      createdAt: assignment.createdAt
    }));

    res.status(200).json({
      success: true,
      data: activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching child activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch child activities',
      error: error.message
    });
  }
};

// ==================== POST /api/children/:childId/activities ====================
// Assign an activity to a child
exports.assignActivityToChild = async (req, res) => {
  try {
    const { childId } = req.params;
    const {
      activityId,
      therapistId,
      scheduledDate,
      notes,
      activityType = 'therapy'
    } = req.body;

    if (!isValidObjectId(childId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid child ID'
      });
    }

    // Validation
    if (!activityId || !therapistId || !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: 'activityId, therapistId, and scheduledDate are required'
      });
    }

    // Check if child exists
    const child = await User.findById(childId);
    if (!child || child.role !== 'child') {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Check permissions
    if (req.user.role === 'therapist' && therapistId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Can only assign activities to yourself'
      });
    }

    // Verify activity exists
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
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
      activityId,
      therapistId,
      scheduledDate: new Date(scheduledDate),
      status: 'scheduled',
      notes: notes || '',
      activityType,
      assignedBy: req.user._id
    });

    // Populate for response
    const populatedAssignment = await ActivityAssignment.findById(assignment._id)
      .populate('activityId', 'title description category difficultyLevel duration')
      .populate('therapistId', 'firstName lastName');

    const activityData = {
      id: assignment._id.toString(),
      activityId: populatedAssignment.activityId?._id,
      activityName: populatedAssignment.activityId?.title || 'Activity',
      activityDescription: populatedAssignment.activityId?.description || '',
      category: populatedAssignment.activityId?.category || 'General',
      difficulty: populatedAssignment.activityId?.difficultyLevel || 'Medium',
      duration: populatedAssignment.activityId?.duration || 30,
      therapistId: populatedAssignment.therapistId?._id,
      therapistName: populatedAssignment.therapistId ? 
        `${populatedAssignment.therapistId.firstName} ${populatedAssignment.therapistId.lastName}` : 
        'Unassigned',
      scheduledDate: populatedAssignment.scheduledDate,
      status: populatedAssignment.status,
      notes: populatedAssignment.notes || '',
      createdAt: populatedAssignment.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'Activity assigned successfully',
      data: activityData
    });
  } catch (error) {
    console.error('Error assigning activity to child:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign activity to child',
      error: error.message
    });
  }
};

// ==================== DELETE /api/children/:childId/activities/:activityId ====================
// Remove an activity assignment from a child
exports.removeActivityFromChild = async (req, res) => {
  try {
    const { childId, activityId } = req.params;

    if (!isValidObjectId(childId) || !isValidObjectId(activityId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid child ID or activity ID'
      });
    }

    // Check if child exists
    const child = await User.findById(childId);
    if (!child || child.role !== 'child') {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Find the activity assignment
    const assignment = await ActivityAssignment.findOne({
      _id: activityId,
      childId: childId
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Activity assignment not found'
      });
    }

    // Check permissions
    if (req.user.role === 'therapist' && 
        assignment.therapistId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Can only remove your own assignments'
      });
    }

    if (req.user.role === 'child' && 
        childId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if activity is already completed
    if (assignment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove completed activity'
      });
    }

    // Delete the assignment
    await ActivityAssignment.findByIdAndDelete(activityId);

    res.status(200).json({
      success: true,
      message: 'Activity removed successfully'
    });
  } catch (error) {
    console.error('Error removing activity from child:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove activity from child',
      error: error.message
    });
  }
};

// ==================== PUT /api/children/:childId/activities/:activityId/status ====================
// Update activity status (helper endpoint)
exports.updateActivityStatus = async (req, res) => {
  try {
    const { childId, activityId } = req.params;
    const { status, progress, notes } = req.body;

    if (!isValidObjectId(childId) || !isValidObjectId(activityId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid child ID or activity ID'
      });
    }

    // Find the activity assignment
    const assignment = await ActivityAssignment.findOne({
      _id: activityId,
      childId: childId
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Activity assignment not found'
      });
    }

    // Check permissions
    if (req.user.role === 'therapist' && 
        assignment.therapistId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Can only update your own assignments'
      });
    }

    // Update status
    if (status) {
      assignment.status = status;
      if (status === 'completed') {
        assignment.completedAt = new Date();
      }
    }

    if (progress) {
      assignment.progress = { ...assignment.progress, ...progress };
    }

    if (notes) {
      assignment.notes = notes;
    }

    await assignment.save();

    res.status(200).json({
      success: true,
      message: 'Activity status updated successfully',
      data: {
        id: assignment._id,
        status: assignment.status,
        progress: assignment.progress,
        notes: assignment.notes,
        completedAt: assignment.completedAt
      }
    });
  } catch (error) {
    console.error('Error updating activity status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update activity status',
      error: error.message
    });
  }
};
