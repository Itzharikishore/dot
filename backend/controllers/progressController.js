const mongoose = require('mongoose');
const Progress = require('../models/Progress');
const User = require('../models/User');
const HomeProgram = require('../models/HomeProgram');
const ActivityAssignment = require('../models/ActivityAssignment');
const Activity = require('../models/Activity');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ==================== POST /api/progress ====================
// Add new progress entry
exports.createProgress = async (req, res) => {
  try {
    const { programId, activityId, progressPercentage, completedTasks, notes, milestone, customMilestone, score, timeSpent, difficulty, mood, tags, isPublic } = req.body;

    // Validate programId
    if (!isValidObjectId(programId)) {
      return res.status(400).json({ success: false, message: 'Invalid programId' });
    }

    // Check if program exists
    const program = await HomeProgram.findById(programId);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Program not found' });
    }

    // Check if user has access to this program
    const isOwner = req.user._id.toString() === program.childId.toString();
    const isTherapist = req.user.role === 'therapist' && program.assignedBy.toString() === req.user._id.toString();
    const isSuperuser = req.user.role === 'superuser';
    
    if (!isOwner && !isTherapist && !isSuperuser) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Validate activityId if provided
    if (activityId && !isValidObjectId(activityId)) {
      return res.status(400).json({ success: false, message: 'Invalid activityId' });
    }

    // Create progress entry
    const progress = await Progress.create({
      userId: req.user._id,
      programId,
      activityId: activityId || undefined,
      progressPercentage,
      completedTasks: completedTasks || [],
      notes,
      milestone,
      customMilestone,
      score,
      timeSpent: timeSpent || 0,
      difficulty: difficulty || 'medium',
      mood: mood || 'okay',
      tags: tags || [],
      isPublic: isPublic || false
    });

    return res.status(201).json({ 
      success: true, 
      message: 'Progress entry created successfully',
      data: progress 
    });
  } catch (err) {
    console.error('Create Progress Error:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => ({ 
        field: e.path, 
        message: e.message 
      }));
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// ==================== GET /api/progress/:userId ====================
// Get all progress records of a user
exports.getUserProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, programId, status, milestone } = req.query;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId' });
    }

    // Check if user has access to this user's progress
    const isOwner = req.user._id.toString() === userId.toString();
    const isSuperuser = req.user.role === 'superuser';
    const isTherapist = req.user.role === 'therapist';
    
    if (!isOwner && !isSuperuser && !isTherapist) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Build query
    const query = { userId };
    if (programId) query.programId = programId;
    if (status) query.status = status;
    if (milestone) query.milestone = milestone;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Get progress entries with pagination
    const progress = await Progress.find(query)
      .populate('programId', 'title description status')
      .populate('activityId', 'title description')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Progress.countDocuments(query);

    // Get progress summary
    const summary = await Progress.getProgressSummary(userId, programId);

    return res.status(200).json({
      success: true,
      data: {
        progress,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limitNum),
          totalEntries: total,
          hasNext: skip + limitNum < total,
          hasPrev: parseInt(page) > 1
        },
        summary
      }
    });
  } catch (err) {
    console.error('Get User Progress Error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// ==================== GET /api/progress/:userId/:programId ====================
// Get progress for a specific program
exports.getProgramProgress = async (req, res) => {
  try {
    const { userId, programId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(userId) || !isValidObjectId(programId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId or programId' });
    }

    // Check if user has access
    const isOwner = req.user._id.toString() === userId.toString();
    const isSuperuser = req.user.role === 'superuser';
    const isTherapist = req.user.role === 'therapist';
    
    if (!isOwner && !isSuperuser && !isTherapist) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Check if program exists
    const program = await HomeProgram.findById(programId);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Program not found' });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Get progress entries for specific program
    const progress = await Progress.find({ userId, programId })
      .populate('activityId', 'title description')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await Progress.countDocuments({ userId, programId });

    // Get progress summary for this program
    const summary = await Progress.getProgressSummary(userId, programId);

    return res.status(200).json({
      success: true,
      data: {
        program: {
          _id: program._id,
          title: program.title,
          description: program.description,
          status: program.status
        },
        progress,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limitNum),
          totalEntries: total,
          hasNext: skip + limitNum < total,
          hasPrev: parseInt(page) > 1
        },
        summary
      }
    });
  } catch (err) {
    console.error('Get Program Progress Error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// ==================== PUT /api/progress/:progressId ====================
// Update progress entry
exports.updateProgress = async (req, res) => {
  try {
    const { progressId } = req.params;
    const updateData = req.body;

    if (!isValidObjectId(progressId)) {
      return res.status(400).json({ success: false, message: 'Invalid progressId' });
    }

    // Find progress entry
    const progress = await Progress.findById(progressId);
    if (!progress) {
      return res.status(404).json({ success: false, message: 'Progress entry not found' });
    }

    // Check if user has access to update this progress
    const isOwner = req.user._id.toString() === progress.userId.toString();
    const isSuperuser = req.user.role === 'superuser';
    const isTherapist = req.user.role === 'therapist';
    
    if (!isOwner && !isSuperuser && !isTherapist) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Update progress entry
    const updatedProgress = await Progress.findByIdAndUpdate(
      progressId,
      updateData,
      { new: true, runValidators: true }
    ).populate('programId', 'title description')
     .populate('activityId', 'title description')
     .populate('reviewedBy', 'firstName lastName');

    return res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      data: updatedProgress
    });
  } catch (err) {
    console.error('Update Progress Error:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => ({ 
        field: e.path, 
        message: e.message 
      }));
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// ==================== DELETE /api/progress/:progressId ====================
// Remove a progress entry
exports.deleteProgress = async (req, res) => {
  try {
    const { progressId } = req.params;

    if (!isValidObjectId(progressId)) {
      return res.status(400).json({ success: false, message: 'Invalid progressId' });
    }

    // Find progress entry
    const progress = await Progress.findById(progressId);
    if (!progress) {
      return res.status(404).json({ success: false, message: 'Progress entry not found' });
    }

    // Check if user has access to delete this progress
    const isOwner = req.user._id.toString() === progress.userId.toString();
    const isSuperuser = req.user.role === 'superuser';
    const isTherapist = req.user.role === 'therapist';
    
    if (!isOwner && !isSuperuser && !isTherapist) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Delete progress entry
    await Progress.findByIdAndDelete(progressId);

    return res.status(200).json({
      success: true,
      message: 'Progress entry deleted successfully'
    });
  } catch (err) {
    console.error('Delete Progress Error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// ==================== GET /api/progress/:progressId ====================
// Get single progress entry
exports.getProgressById = async (req, res) => {
  try {
    const { progressId } = req.params;

    if (!isValidObjectId(progressId)) {
      return res.status(400).json({ success: false, message: 'Invalid progressId' });
    }

    // Find progress entry
    const progress = await Progress.findById(progressId)
      .populate('programId', 'title description status')
      .populate('activityId', 'title description')
      .populate('reviewedBy', 'firstName lastName');

    if (!progress) {
      return res.status(404).json({ success: false, message: 'Progress entry not found' });
    }

    // Check if user has access to view this progress
    const isOwner = req.user._id.toString() === progress.userId.toString();
    const isSuperuser = req.user.role === 'superuser';
    const isTherapist = req.user.role === 'therapist';
    
    if (!isOwner && !isSuperuser && !isTherapist) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.status(200).json({
      success: true,
      data: progress
    });
  } catch (err) {
    console.error('Get Progress by ID Error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// ==================== POST /api/progress/:progressId/review ====================
// Review progress entry (therapist/superuser only)
exports.reviewProgress = async (req, res) => {
  try {
    const { progressId } = req.params;
    const { status, reviewNotes } = req.body;

    if (!isValidObjectId(progressId)) {
      return res.status(400).json({ success: false, message: 'Invalid progressId' });
    }

    // Check if user has permission to review
    if (!['therapist', 'superuser'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Only therapists and superusers can review progress' });
    }

    // Find progress entry
    const progress = await Progress.findById(progressId);
    if (!progress) {
      return res.status(404).json({ success: false, message: 'Progress entry not found' });
    }

    // Update review information
    const updatedProgress = await Progress.findByIdAndUpdate(
      progressId,
      {
        status: status || 'reviewed',
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        reviewNotes
      },
      { new: true, runValidators: true }
    ).populate('programId', 'title description')
     .populate('activityId', 'title description')
     .populate('reviewedBy', 'firstName lastName');

    return res.status(200).json({
      success: true,
      message: 'Progress reviewed successfully',
      data: updatedProgress
    });
  } catch (err) {
    console.error('Review Progress Error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// ==================== GET /api/progress/:userId/activity-completion ====================
// Get detailed activity completion statistics for a child
exports.getActivityCompletionStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const { programId, startDate, endDate } = req.query;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId' });
    }

    // Check if user has access to this child's data
    const isOwner = req.user._id.toString() === userId.toString();
    const isSuperuser = req.user.role === 'superuser';
    const isTherapist = req.user.role === 'therapist';
    
    if (!isOwner && !isSuperuser && !isTherapist) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Get activity assignments completion stats
    const assignmentFilter = { childId: userId };
    if (Object.keys(dateFilter).length > 0) {
      assignmentFilter['progress.submittedAt'] = dateFilter;
    }

    const assignments = await ActivityAssignment.find(assignmentFilter)
      .populate('activityId', 'title description category difficulty')
      .populate('assignedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Get home program completions
    const programFilter = { childId: userId };
    if (programId) programFilter._id = programId;

    const programs = await HomeProgram.find(programFilter)
      .populate('items.activityId', 'title description category difficulty')
      .populate('assignedBy', 'firstName lastName');

    // Get progress entries
    const progressFilter = { userId };
    if (programId) progressFilter.programId = programId;
    if (Object.keys(dateFilter).length > 0) {
      progressFilter.createdAt = dateFilter;
    }

    const progressEntries = await Progress.find(progressFilter)
      .populate('programId', 'title description')
      .populate('activityId', 'title description category difficulty')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const stats = {
      totalActivitiesAssigned: assignments.length,
      completedAssignments: assignments.filter(a => a.status === 'completed').length,
      inProgressAssignments: assignments.filter(a => a.status === 'in-progress').length,
      pendingAssignments: assignments.filter(a => a.status === 'assigned').length,
      
      totalProgramActivities: programs.reduce((total, program) => 
        total + program.items.length, 0),
      completedProgramActivities: programs.reduce((total, program) => 
        total + program.items.reduce((itemTotal, item) => 
          itemTotal + item.completions.length, 0), 0),
      
      totalProgressEntries: progressEntries.length,
      averageProgressPercentage: progressEntries.length > 0 ? 
        progressEntries.reduce((sum, entry) => sum + entry.progressPercentage, 0) / progressEntries.length : 0,
      
      completionRate: 0,
      totalTimeSpent: progressEntries.reduce((total, entry) => total + (entry.timeSpent || 0), 0),
      averageScore: 0
    };

    // Calculate completion rate
    const totalActivities = stats.totalActivitiesAssigned + stats.totalProgramActivities;
    const completedActivities = stats.completedAssignments + stats.completedProgramActivities;
    stats.completionRate = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

    // Calculate average score
    const scoredEntries = progressEntries.filter(entry => entry.score !== undefined);
    stats.averageScore = scoredEntries.length > 0 ? 
      scoredEntries.reduce((sum, entry) => sum + entry.score, 0) / scoredEntries.length : 0;

    // Get recent activity completions
    const recentCompletions = [
      ...assignments.filter(a => a.status === 'completed').map(a => ({
        type: 'assignment',
        activityId: a.activityId,
        completedAt: a.progress.submittedAt,
        score: a.progress.score,
        notes: a.progress.notesFromParent || a.progress.notesFromTherapist,
        assignedBy: a.assignedBy
      })),
      ...programs.flatMap(program => 
        program.items.flatMap(item => 
          item.completions.map(completion => ({
            type: 'program',
            activityId: item.activityId,
            programId: program._id,
            programTitle: program.title,
            completedAt: completion.completedAt,
            score: completion.score,
            notes: completion.notes,
            assignedBy: program.assignedBy
          }))
        )
      )
    ].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    // Get activity breakdown by category
    const activityCategories = {};
    const allActivities = [
      ...assignments.map(a => a.activityId).filter(Boolean),
      ...programs.flatMap(p => p.items.map(i => i.activityId)).filter(Boolean),
      ...progressEntries.map(p => p.activityId).filter(Boolean)
    ];

    for (const activity of allActivities) {
      if (activity && activity.category) {
        if (!activityCategories[activity.category]) {
          activityCategories[activity.category] = { total: 0, completed: 0 };
        }
        activityCategories[activity.category].total++;
      }
    }

    // Count completed activities by category
    const completedActivitiesData = [
      ...assignments.filter(a => a.status === 'completed').map(a => a.activityId),
      ...programs.flatMap(p => 
        p.items.filter(i => i.completions.length > 0).map(i => i.activityId)
      )
    ].filter(Boolean);

    for (const activity of completedActivitiesData) {
      if (activity && activity.category) {
        if (activityCategories[activity.category]) {
          activityCategories[activity.category].completed++;
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        child: {
          _id: userId,
          name: `${req.user.firstName} ${req.user.lastName}` // Assuming user is the child
        },
        statistics: stats,
        recentCompletions: recentCompletions.slice(0, 10), // Last 10 completions
        activityBreakdown: activityCategories,
        assignments: assignments,
        programs: programs.map(program => ({
          _id: program._id,
          title: program.title,
          description: program.description,
          status: program.status,
          totalItems: program.items.length,
          completedItems: program.items.reduce((total, item) => 
            total + item.completions.length, 0),
          items: program.items.map(item => ({
            _id: item._id,
            activityId: item.activityId,
            status: item.status,
            completions: item.completions.length,
            targetFrequency: item.targetFrequencyPerWeek,
            dueDate: item.dueDate
          }))
        })),
        progressEntries: progressEntries
      }
    });
  } catch (err) {
    console.error('Get Activity Completion Stats Error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// ==================== GET /api/progress/children/completion-summary ====================
// Get completion summary for all children (therapist/superuser only)
exports.getChildrenCompletionSummary = async (req, res) => {
  try {
    // Check if user has permission to view all children
    if (!['therapist', 'superuser'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { page = 1, limit = 10, sortBy = 'completionRate', sortOrder = 'desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get all children
    let childrenQuery = { role: 'child' };
    
    // If therapist, only show assigned patients
    if (req.user.role === 'therapist') {
      childrenQuery._id = { $in: req.user.assignedPatients || [] };
    }

    const children = await User.find(childrenQuery)
      .select('firstName lastName email createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const childrenWithStats = await Promise.all(
      children.map(async (child) => {
        // Get assignment stats
        const assignments = await ActivityAssignment.find({ childId: child._id });
        const completedAssignments = assignments.filter(a => a.status === 'completed').length;

        // Get program stats
        const programs = await HomeProgram.find({ childId: child._id });
        const totalProgramActivities = programs.reduce((total, program) => 
          total + program.items.length, 0);
        const completedProgramActivities = programs.reduce((total, program) => 
          total + program.items.reduce((itemTotal, item) => 
            itemTotal + item.completions.length, 0), 0);

        // Get progress entries
        const progressEntries = await Progress.find({ userId: child._id });
        const averageProgress = progressEntries.length > 0 ? 
          progressEntries.reduce((sum, entry) => sum + entry.progressPercentage, 0) / progressEntries.length : 0;

        const totalActivities = assignments.length + totalProgramActivities;
        const completedActivities = completedAssignments + completedProgramActivities;
        const completionRate = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

        return {
          _id: child._id,
          name: `${child.firstName} ${child.lastName}`,
          email: child.email,
          joinedAt: child.createdAt,
          statistics: {
            totalActivities,
            completedActivities,
            completionRate: Math.round(completionRate * 100) / 100,
            averageProgress: Math.round(averageProgress * 100) / 100,
            totalAssignments: assignments.length,
            completedAssignments,
            totalPrograms: programs.length,
            activePrograms: programs.filter(p => p.status === 'active').length,
            totalProgressEntries: progressEntries.length
          }
        };
      })
    );

    // Sort results
    childrenWithStats.sort((a, b) => {
      const aValue = a.statistics[sortBy] || 0;
      const bValue = b.statistics[sortBy] || 0;
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    // Get total count for pagination
    const totalChildren = await User.countDocuments(childrenQuery);

    return res.status(200).json({
      success: true,
      data: {
        children: childrenWithStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalChildren / parseInt(limit)),
          totalChildren,
          hasNext: skip + parseInt(limit) < totalChildren,
          hasPrev: parseInt(page) > 1
        },
        summary: {
          totalChildren,
          averageCompletionRate: childrenWithStats.length > 0 ? 
            childrenWithStats.reduce((sum, child) => sum + child.statistics.completionRate, 0) / childrenWithStats.length : 0,
          totalActivities: childrenWithStats.reduce((sum, child) => sum + child.statistics.totalActivities, 0),
          totalCompleted: childrenWithStats.reduce((sum, child) => sum + child.statistics.completedActivities, 0)
        }
      }
    });
  } catch (err) {
    console.error('Get Children Completion Summary Error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// ==================== GET /api/progress/:userId/activity-details ====================
// Get detailed activity completion information for a specific child
exports.getChildActivityDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const { activityId, programId, status, category } = req.query;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId' });
    }

    // Check access permissions
    const isOwner = req.user._id.toString() === userId.toString();
    const isSuperuser = req.user.role === 'superuser';
    const isTherapist = req.user.role === 'therapist';
    
    if (!isOwner && !isSuperuser && !isTherapist) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Build filters
    const assignmentFilter = { childId: userId };
    const programFilter = { childId: userId };
    const progressFilter = { userId };

    if (activityId) {
      assignmentFilter.activityId = activityId;
      progressFilter.activityId = activityId;
    }
    if (programId) {
      programFilter._id = programId;
      progressFilter.programId = programId;
    }
    if (status) {
      assignmentFilter.status = status;
    }

    // Get assignments with activity details
    const assignments = await ActivityAssignment.find(assignmentFilter)
      .populate('activityId', 'title description category difficulty tags')
      .populate('assignedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Get programs with activity details
    const programs = await HomeProgram.find(programFilter)
      .populate('items.activityId', 'title description category difficulty tags')
      .populate('assignedBy', 'firstName lastName');

    // Get progress entries
    const progressEntries = await Progress.find(progressFilter)
      .populate('programId', 'title description')
      .populate('activityId', 'title description category difficulty tags')
      .sort({ createdAt: -1 });

    // Filter by category if specified
    let filteredAssignments = assignments;
    let filteredPrograms = programs;
    let filteredProgress = progressEntries;

    if (category) {
      filteredAssignments = assignments.filter(a => 
        a.activityId && a.activityId.category === category);
      filteredPrograms = programs.map(program => ({
        ...program.toObject(),
        items: program.items.filter(item => 
          item.activityId && item.activityId.category === category)
      })).filter(program => program.items.length > 0);
      filteredProgress = progressEntries.filter(p => 
        p.activityId && p.activityId.category === category);
    }

    // Create activity completion timeline
    const timeline = [];
    
    // Add assignment completions to timeline
    filteredAssignments.forEach(assignment => {
      if (assignment.status === 'completed' && assignment.progress.submittedAt) {
        timeline.push({
          type: 'assignment',
          activityId: assignment.activityId,
          activityTitle: assignment.activityId?.title,
          completedAt: assignment.progress.submittedAt,
          score: assignment.progress.score,
          notes: assignment.progress.notesFromParent || assignment.progress.notesFromTherapist,
          assignedBy: assignment.assignedBy,
          status: assignment.status
        });
      }
    });

    // Add program completions to timeline
    filteredPrograms.forEach(program => {
      program.items.forEach(item => {
        item.completions.forEach(completion => {
          timeline.push({
            type: 'program',
            activityId: item.activityId,
            activityTitle: item.activityId?.title,
            programId: program._id,
            programTitle: program.title,
            completedAt: completion.completedAt,
            score: completion.score,
            notes: completion.notes,
            assignedBy: program.assignedBy,
            status: item.status
          });
        });
      });
    });

    // Add progress entries to timeline
    filteredProgress.forEach(progress => {
      timeline.push({
        type: 'progress',
        activityId: progress.activityId,
        activityTitle: progress.activityId?.title,
        programId: progress.programId,
        programTitle: progress.programId?.title,
        completedAt: progress.createdAt,
        score: progress.score,
        notes: progress.notes,
        progressPercentage: progress.progressPercentage,
        milestone: progress.milestone,
        status: progress.status
      });
    });

    // Sort timeline by completion date
    timeline.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    // Calculate activity-specific statistics
    const activityStats = {};
    timeline.forEach(item => {
      if (item.activityId) {
        const activityId = item.activityId._id.toString();
        if (!activityStats[activityId]) {
          activityStats[activityId] = {
            activityId: item.activityId,
            activityTitle: item.activityTitle,
            category: item.activityId.category,
            difficulty: item.activityId.difficulty,
            totalAttempts: 0,
            totalCompletions: 0,
            averageScore: 0,
            lastCompleted: null,
            completionHistory: []
          };
        }
        
        activityStats[activityId].totalAttempts++;
        if (item.type === 'assignment' && item.status === 'completed') {
          activityStats[activityId].totalCompletions++;
        } else if (item.type === 'program') {
          activityStats[activityId].totalCompletions++;
        }
        
        if (item.score !== undefined) {
          const currentAvg = activityStats[activityId].averageScore;
          const totalAttempts = activityStats[activityId].totalAttempts;
          activityStats[activityId].averageScore = 
            ((currentAvg * (totalAttempts - 1)) + item.score) / totalAttempts;
        }
        
        if (!activityStats[activityId].lastCompleted || 
            new Date(item.completedAt) > new Date(activityStats[activityId].lastCompleted)) {
          activityStats[activityId].lastCompleted = item.completedAt;
        }
        
        activityStats[activityId].completionHistory.push({
          completedAt: item.completedAt,
          score: item.score,
          type: item.type,
          notes: item.notes
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        child: {
          _id: userId,
          name: `${req.user.firstName} ${req.user.lastName}`
        },
        filters: {
          activityId,
          programId,
          status,
          category
        },
        timeline: timeline.slice(0, 50), // Limit to last 50 entries
        activityStatistics: Object.values(activityStats),
        assignments: filteredAssignments,
        programs: filteredPrograms,
        progressEntries: filteredProgress
      }
    });
  } catch (err) {
    console.error('Get Child Activity Details Error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};