const mongoose = require('mongoose');

// Alert Schema (inline since it's a simple model)
const alertSchema = new mongoose.Schema({
  // ==================== BASIC INFO ====================
  title: {
    type: String,
    required: [true, 'Alert title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Alert message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  type: {
    type: String,
    required: [true, 'Alert type is required'],
    enum: ['info', 'warning', 'error', 'success', 'reminder', 'appointment', 'progress', 'system'],
    default: 'info'
  },
  
  // ==================== USER RELATIONSHIP ====================
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // ==================== STATUS ====================
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // ==================== ACTIONS ====================
  actionUrl: {
    type: String,
    trim: true
  },
  actionText: {
    type: String,
    trim: true,
    maxlength: [50, 'Action text cannot exceed 50 characters']
  },
  
  // ==================== METADATA ====================
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  expiresAt: {
    type: Date
  },
  
  // ==================== SYSTEM FIELDS ====================
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add indexes
alertSchema.index({ userId: 1, isRead: 1 });
alertSchema.index({ userId: 1, createdAt: -1 });
alertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Alert = mongoose.model('Alert', alertSchema);

// ==================== Helpers ====================
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ==================== GET /api/alerts ====================
// Get all alerts for authenticated user
exports.getAlerts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      isRead, 
      priority 
    } = req.query;
    
    const skip = (page - 1) * limit;

    // Build query
    let query = { 
      userId: req.user._id,
      isActive: true 
    };
    
    if (type) {
      query.type = type;
    }
    
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }
    
    if (priority) {
      query.priority = priority;
    }

    // Get alerts
    const alerts = await Alert.find(query)
      .sort({ createdAt: -1, priority: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Alert.countDocuments(query);
    const unreadCount = await Alert.countDocuments({ 
      userId: req.user._id, 
      isRead: false, 
      isActive: true 
    });

    // Transform to frontend format
    const transformedAlerts = alerts.map(alert => ({
      id: alert._id.toString(),
      title: alert.title,
      message: alert.message,
      type: alert.type,
      priority: alert.priority,
      isRead: alert.isRead,
      date: alert.createdAt.toISOString(),
      actionUrl: alert.actionUrl,
      actionText: alert.actionText,
      metadata: alert.metadata,
      expiresAt: alert.expiresAt?.toISOString()
    }));

    res.status(200).json({
      success: true,
      data: transformedAlerts,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error.message
    });
  }
};

// ==================== PUT /api/alerts/:id/read ====================
// Mark alert as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid alert ID'
      });
    }

    const alert = await Alert.findOne({ 
      _id: id, 
      userId: req.user._id,
      isActive: true 
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    if (alert.isRead) {
      return res.status(200).json({
        success: true,
        message: 'Alert already marked as read'
      });
    }

    alert.isRead = true;
    await alert.save();

    res.status(200).json({
      success: true,
      message: 'Alert marked as read successfully'
    });
  } catch (error) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark alert as read',
      error: error.message
    });
  }
};

// ==================== PUT /api/alerts/mark-all-read ====================
// Mark all alerts as read for user
exports.markAllAsRead = async (req, res) => {
  try {
    const result = await Alert.updateMany(
      { 
        userId: req.user._id, 
        isRead: false, 
        isActive: true 
      },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'All alerts marked as read successfully',
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error marking all alerts as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all alerts as read',
      error: error.message
    });
  }
};

// ==================== DELETE /api/alerts/:id ====================
// Delete alert
exports.deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid alert ID'
      });
    }

    const alert = await Alert.findOne({ 
      _id: id, 
      userId: req.user._id,
      isActive: true 
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    // Soft delete
    alert.isActive = false;
    await alert.save();

    res.status(200).json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete alert',
      error: error.message
    });
  }
};

// ==================== DELETE /api/alerts/clear-all ====================
// Clear all alerts for user
exports.clearAllAlerts = async (req, res) => {
  try {
    const result = await Alert.updateMany(
      { 
        userId: req.user._id, 
        isActive: true 
      },
      { isActive: false }
    );

    res.status(200).json({
      success: true,
      message: 'All alerts cleared successfully',
      data: {
        clearedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error clearing all alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear all alerts',
      error: error.message
    });
  }
};

// ==================== POST /api/alerts ====================
// Create new alert (for system/admin use)
exports.createAlert = async (req, res) => {
  try {
    const {
      title,
      message,
      type = 'info',
      priority = 'medium',
      userId,
      actionUrl,
      actionText,
      metadata,
      expiresAt
    } = req.body;

    // Validation
    if (!title || !message || !userId) {
      return res.status(400).json({
        success: false,
        message: 'title, message, and userId are required'
      });
    }

    // Only allow admins/superusers to create alerts for other users
    if (req.user.role !== 'superuser' && req.user.role !== 'hospital' && userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const alert = await Alert.create({
      title,
      message,
      type,
      priority,
      userId,
      actionUrl,
      actionText,
      metadata: metadata || {},
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.user._id
    });

    const transformedAlert = {
      id: alert._id.toString(),
      title: alert.title,
      message: alert.message,
      type: alert.type,
      priority: alert.priority,
      isRead: alert.isRead,
      date: alert.createdAt.toISOString(),
      actionUrl: alert.actionUrl,
      actionText: alert.actionText,
      metadata: alert.metadata,
      expiresAt: alert.expiresAt?.toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      data: transformedAlert
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create alert',
      error: error.message
    });
  }
};

// ==================== GET /api/alerts/unread-count ====================
// Get unread alerts count
exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Alert.countDocuments({ 
      userId: req.user._id, 
      isRead: false, 
      isActive: true 
    });

    res.status(200).json({
      success: true,
      data: {
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
};
