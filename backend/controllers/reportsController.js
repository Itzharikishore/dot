const mongoose = require('mongoose');
const User = require('../models/User');
const Progress = require('../models/Progress');
const ActivityAssignment = require('../models/ActivityAssignment');
const Child = require('../models/childModel');
const fs = require('fs');
const path = require('path');

// ==================== Helpers ====================
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ==================== GET /api/reports/child/:childId ====================
// Fetch report for a specific child
exports.getChildReport = async (req, res) => {
  try {
    const { childId } = req.params;

    if (!isValidObjectId(childId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid child ID'
      });
    }

    // Check permissions
    const child = await User.findById(childId);
    if (!child || child.role !== 'child') {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Role-based access check
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

    // Get child details
    const childDetails = await Child.findOne({ userId: childId })
      .populate('parentId', 'firstName lastName phoneNumber');

    // Get progress data
    const progressData = await Progress.find({ childId })
      .sort({ createdAt: -1 })
      .limit(100);

    // Get activity assignments
    const assignments = await ActivityAssignment.find({ childId })
      .populate('activityId', 'title category')
      .populate('therapistId', 'firstName lastName')
      .sort({ scheduledDate: -1 })
      .limit(50);

    // Calculate weekly progress for charts
    const weeklyData = calculateWeeklyProgress(progressData);
    
    // Get child's grade from notes or calculate
    const grade = childDetails?.notes?.includes('Grade') ? 
      childDetails.notes.match(/Grade\s+\d+/)?.[0] : 
      'Grade 2';

    // Generate report
    const report = {
      childId,
      childName: `${child.firstName} ${child.lastName}`,
      grade,
      reportPeriod: getCurrentMonthYear(),
      totalSessions: assignments.length,
      completedActivities: assignments.filter(a => a.status === 'completed').length,
      stagesOfPlay: {
        labels: weeklyData.labels,
        data: weeklyData.playData
      },
      stagesOfCognitive: {
        labels: weeklyData.labels,
        data: weeklyData.cognitiveData
      },
      feedback: generateFeedback(progressData, assignments),
      improvementAreas: generateImprovementAreas(progressData),
      strengths: generateStrengths(progressData)
    };

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching child report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch child report',
      error: error.message
    });
  }
};

// ==================== GET /api/reports/activities/:childId ====================
// Fetch activity report for a specific child
exports.getActivityReport = async (req, res) => {
  try {
    const { childId } = req.params;

    if (!isValidObjectId(childId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid child ID'
      });
    }

    // Check permissions (same as above)
    const child = await User.findById(childId);
    if (!child || child.role !== 'child') {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Role-based access check
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

    // Get activity assignments
    const assignments = await ActivityAssignment.find({ childId })
      .populate('activityId', 'title description')
      .populate('therapistId', 'firstName lastName')
      .sort({ scheduledDate: -1 })
      .limit(100);

    const completedActivities = assignments.filter(a => a.status === 'completed');
    const pendingActivities = assignments.filter(a => a.status !== 'completed');

    const activityReport = {
      childId,
      totalActivities: assignments.length,
      completedActivities: completedActivities.length,
      pendingActivities: pendingActivities.length,
      activities: assignments.map(assignment => ({
        id: assignment._id,
        name: assignment.activityId?.title || 'Activity',
        status: assignment.status || 'scheduled',
        date: assignment.scheduledDate?.toISOString().split('T')[0],
        duration: calculateDuration(assignment),
        therapist: assignment.therapistId ? 
          `${assignment.therapistId.firstName} ${assignment.therapistId.lastName}` : 
          'Unassigned'
      })),
      reportPeriod: getCurrentMonthYear()
    };

    res.status(200).json({
      success: true,
      data: activityReport
    });
  } catch (error) {
    console.error('Error fetching activity report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity report',
      error: error.message
    });
  }
};

// ==================== GET /api/reports/progress/:childId ====================
// Fetch progress statistics for a specific child
exports.getProgressStatistics = async (req, res) => {
  try {
    const { childId } = req.params;

    if (!isValidObjectId(childId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid child ID'
      });
    }

    // Check permissions
    const child = await User.findById(childId);
    if (!child || child.role !== 'child') {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Role-based access check
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

    // Get progress data
    const progressData = await Progress.find({ childId })
      .sort({ createdAt: -1 })
      .limit(200);

    const weeklyData = calculateWeeklyProgress(progressData);
    
    const progressStats = {
      childId,
      progressMetrics: {
        stagesOfPlay: {
          currentStage: calculateCurrentStage(weeklyData.playData),
          progressPercentage: calculateProgressPercentage(weeklyData.playData),
          weeklyData: weeklyData.playData,
          trend: calculateTrend(weeklyData.playData)
        },
        stagesOfCognitive: {
          currentStage: calculateCurrentStage(weeklyData.cognitiveData),
          progressPercentage: calculateProgressPercentage(weeklyData.cognitiveData),
          weeklyData: weeklyData.cognitiveData,
          trend: calculateTrend(weeklyData.cognitiveData)
        }
      },
      overallProgress: calculateOverallProgress(weeklyData),
      lastUpdated: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: progressStats
    });
  } catch (error) {
    console.error('Error fetching progress statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progress statistics',
      error: error.message
    });
  }
};

// ==================== GET /api/reports/feedback/:childId ====================
// Fetch detailed feedback for a specific child
exports.getDetailedFeedback = async (req, res) => {
  try {
    const { childId } = req.params;

    if (!isValidObjectId(childId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid child ID'
      });
    }

    // Check permissions
    const child = await User.findById(childId);
    if (!child || child.role !== 'child') {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Role-based access check
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

    // Get progress and activity data
    const progressData = await Progress.find({ childId })
      .sort({ createdAt: -1 })
      .limit(100);

    const assignments = await ActivityAssignment.find({ childId })
      .populate('therapistId', 'firstName lastName')
      .sort({ scheduledDate: -1 })
      .limit(50);

    const feedback = {
      childId,
      overallFeedback: generateFeedback(progressData, assignments),
      strengths: generateStrengths(progressData),
      improvementAreas: generateImprovementAreas(progressData),
      recommendations: generateRecommendations(progressData),
      nextSteps: generateNextSteps(progressData),
      feedbackDate: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Error fetching detailed feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch detailed feedback',
      error: error.message
    });
  }
};

// ==================== GET /api/reports/compare ====================
// Compare reports between two children
exports.compareChildReports = async (req, res) => {
  try {
    const { child1Id, child2Id } = req.query;

    if (!child1Id || !child2Id) {
      return res.status(400).json({
        success: false,
        message: 'Both child1Id and child2Id are required'
      });
    }

    if (!isValidObjectId(child1Id) || !isValidObjectId(child2Id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid child ID format'
      });
    }

    // Get both children
    const child1 = await User.findById(child1Id);
    const child2 = await User.findById(child2Id);

    if (!child1 || !child2) {
      return res.status(404).json({
        success: false,
        message: 'One or both children not found'
      });
    }

    // Check permissions
    if (req.user.role === 'child') {
      if (req.user._id.toString() !== child1Id && req.user._id.toString() !== child2Id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    if (req.user.role === 'therapist') {
      const canAccessChild1 = child1.assignedTherapist?.equals(req.user._id);
      const canAccessChild2 = child2.assignedTherapist?.equals(req.user._id);
      
      if (!canAccessChild1 && !canAccessChild2) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Get progress data for both children
    const progress1 = await Progress.find({ childId: child1Id })
      .sort({ createdAt: -1 })
      .limit(100);
    
    const progress2 = await Progress.find({ childId: child2Id })
      .sort({ createdAt: -1 })
      .limit(100);

    const progress1Data = calculateWeeklyProgress(progress1);
    const progress2Data = calculateWeeklyProgress(progress2);

    const comparison = {
      child1: {
        childId,
        childName: `${child1.firstName} ${child1.lastName}`,
        overallProgress: calculateOverallProgress(progress1Data)
      },
      child2: {
        childId: child2Id,
        childName: `${child2.firstName} ${child2.lastName}`,
        overallProgress: calculateOverallProgress(progress2Data)
      },
      comparison: {
        progressDifference: Math.abs(
          calculateOverallProgress(progress1Data) - calculateOverallProgress(progress2Data)
        ),
        strengthComparison: compareStrengths(progress1, progress2),
        improvementComparison: compareImprovementAreas(progress1, progress2)
      }
    };

    res.status(200).json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Error comparing child reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to compare child reports',
      error: error.message
    });
  }
};

// ==================== Helper Functions ====================

function getCurrentMonthYear() {
  const now = new Date();
  const month = now.toLocaleString('default', { month: 'long' });
  const year = now.getFullYear();
  return `${month} ${year}`;
}

function calculateWeeklyProgress(progressData) {
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  const playData = [65, 70, 72, 78]; // Mock data - replace with actual calculation
  const cognitiveData = [60, 65, 70, 75]; // Mock data - replace with actual calculation
  
  return {
    labels: weeks,
    playData,
    cognitiveData
  };
}

function calculateCurrentStage(data) {
  if (!data || data.length === 0) return 1;
  const latest = data[data.length - 1];
  return Math.min(5, Math.max(1, Math.round(latest / 20)));
}

function calculateProgressPercentage(data) {
  if (!data || data.length === 0) return 0;
  const latest = data[data.length - 1];
  return Math.min(100, Math.max(0, latest));
}

function calculateTrend(data) {
  if (!data || data.length < 2) return 'stable';
  const recent = data.slice(-2);
  if (recent[1] > recent[0]) return 'improving';
  if (recent[1] < recent[0]) return 'declining';
  return 'stable';
}

function calculateOverallProgress(weeklyData) {
  if (!weeklyData.playData || !weeklyData.cognitiveData) return 0;
  const avgPlay = weeklyData.playData.reduce((a, b) => a + b, 0) / weeklyData.playData.length;
  const avgCognitive = weeklyData.cognitiveData.reduce((a, b) => a + b, 0) / weeklyData.cognitiveData.length;
  return (avgPlay + avgCognitive) / 2;
}

function generateFeedback(progressData, assignments) {
  const completedCount = assignments?.filter(a => a.status === 'completed').length || 0;
  const totalCount = assignments?.length || 0;
  
  if (completedCount / totalCount > 0.8) {
    return 'Excellent progress in communication skills';
  } else if (completedCount / totalCount > 0.6) {
    return 'Good progress in communication skills';
  } else {
    return 'Needs more practice in communication skills';
  }
}

function generateStrengths(progressData) {
  // Analyze progress data to identify strengths
  return ['Social interaction', 'Following instructions', 'Listening skills'];
}

function generateImprovementAreas(progressData) {
  // Analyze progress data to identify improvement areas
  return ['Pronunciation', 'Speaking confidence', 'Vocabulary expansion'];
}

function generateRecommendations(progressData) {
  return [
    'Continue speech drills',
    'Practice with peer group',
    'Use visual aids for vocabulary'
  ];
}

function generateNextSteps(progressData) {
  return 'Prepare for advanced communication activities';
}

function calculateDuration(assignment) {
  if (!assignment.scheduledDate || !assignment.completedAt) return 30;
  const start = new Date(assignment.scheduledDate);
  const end = new Date(assignment.completedAt);
  return Math.round((end - start) / (1000 * 60)); // Duration in minutes
}

function compareStrengths(progress1, progress2) {
  // Mock comparison - implement actual logic
  return {
    child1Strengths: ['Social interaction', 'Following instructions'],
    child2Strengths: ['Listening skills', 'Vocabulary']
  };
}

function compareImprovementAreas(progress1, progress2) {
  // Mock comparison - implement actual logic
  return {
    child1Improvements: ['Pronunciation', 'Speaking confidence'],
    child2Improvements: ['Vocabulary expansion', 'Grammar']
  };
}

// ==================== POST /api/reports/generate-pdf/:childId ====================
// Generate PDF report for a child
exports.generatePDFReport = async (req, res) => {
  try {
    const { childId } = req.params;

    if (!isValidObjectId(childId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid child ID'
      });
    }

    // Check permissions (same as other report endpoints)
    const child = await User.findById(childId);
    if (!child || child.role !== 'child') {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Role-based access check
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

    // Get report data
    const reportData = await getChildReportData(childId);

    // Generate PDF content (simplified version - in production, use a proper PDF library like puppeteer)
    const pdfContent = generatePDFContent(reportData);
    
    // Create PDF file
    const fileName = `report_${childId}_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '../uploads/reports', fileName);
    
    // Ensure directory exists
    const reportsDir = path.dirname(filePath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Write PDF file (simplified - actual PDF generation would use a library)
    fs.writeFileSync(filePath, pdfContent, 'utf8');

    // Store file info in database or return file path
    const reportFile = {
      id: fileName.replace('.pdf', ''),
      fileName,
      filePath: `/uploads/reports/${fileName}`,
      childId,
      generatedBy: req.user._id,
      generatedAt: new Date(),
      reportType: 'comprehensive'
    };

    res.status(200).json({
      success: true,
      message: 'PDF report generated successfully',
      data: {
        reportId: reportFile.id,
        downloadUrl: `/api/reports/${reportFile.id}/download`,
        fileName: reportFile.fileName,
        generatedAt: reportFile.generatedAt
      }
    });
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF report',
      error: error.message
    });
  }
};

// ==================== GET /api/reports/:reportId/download ====================
// Download a generated report
exports.downloadReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    // In a real implementation, you would fetch report info from database
    // For now, we'll construct the file path
    const fileName = `${reportId}.pdf`;
    const filePath = path.join(__dirname, '../uploads/reports', fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Report file not found'
      });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Send file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error downloading file'
        });
      }
    });

  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download report',
      error: error.message
    });
  }
};

// ==================== Helper Functions for PDF Generation ====================

async function getChildReportData(childId) {
  // Get child details
  const child = await User.findById(childId);
  const childDetails = await Child.findOne({ userId: childId })
    .populate('parentId', 'firstName lastName phoneNumber');

  // Get progress data
  const progressData = await Progress.find({ childId })
    .sort({ createdAt: -1 })
    .limit(100);

  // Get activity assignments
  const assignments = await ActivityAssignment.find({ childId })
    .populate('activityId', 'title category')
    .populate('therapistId', 'firstName lastName')
    .sort({ scheduledDate: -1 })
    .limit(50);

  const weeklyData = calculateWeeklyProgress(progressData);
  
  return {
    childId,
    childName: `${child.firstName} ${child.lastName}`,
    grade: childDetails?.notes?.includes('Grade') ? 
      childDetails.notes.match(/Grade\s+\d+/)?.[0] : 
      'Grade 2',
    reportPeriod: getCurrentMonthYear(),
    totalSessions: assignments.length,
    completedActivities: assignments.filter(a => a.status === 'completed').length,
    stagesOfPlay: weeklyData.playData,
    stagesOfCognitive: weeklyData.cognitiveData,
    feedback: generateFeedback(progressData, assignments),
    improvementAreas: generateImprovementAreas(progressData),
    strengths: generateStrengths(progressData)
  };
}

function generatePDFContent(reportData) {
  // Simplified PDF content generation
  // In production, use a proper PDF library like puppeteer or jsPDF
  
  const content = `
CHILD PROGRESS REPORT
=====================

Child Name: ${reportData.childName}
Grade: ${reportData.grade}
Report Period: ${reportData.reportPeriod}

SUMMARY
-------
Total Sessions: ${reportData.totalSessions}
Completed Activities: ${reportData.completedActivities}

PROGRESS CHARTS
--------------
Stages of Play: ${reportData.stagesOfPlay.join(', ')}
Stages of Cognitive: ${reportData.stagesOfCognitive.join(', ')}

FEEDBACK
--------
${reportData.feedback}

STRENGTHS
---------
${reportData.strengths.join(', ')}

AREAS FOR IMPROVEMENT
---------------------
${reportData.improvementAreas.join(', ')}

Generated on: ${new Date().toLocaleDateString()}
  `.trim();

  return content;
}
