const Therapist = require('../models/Therapist');
const User = require('../models/User');

// ==================== GET /api/therapists/list ====================
// Fetch all therapists (with optional filtering)
exports.getTherapists = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, hospitalId } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { qualification: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    // Role-based access control
    if (req.user.role === 'therapist') {
      // Therapists can only see themselves
      query.userId = req.user._id;
    } else if (req.user.role === 'hospital') {
      // Hospitals can see their therapists
      query.hospitalId = req.user._id;
    }
    // Superusers can see all therapists

    const therapists = await Therapist.find(query)
      .populate('userId', 'firstName lastName email profilePicture')
      .populate('hospitalId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Therapist.countDocuments(query);

    res.status(200).json({
      success: true,
      data: therapists,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching therapists:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch therapists',
      error: error.message
    });
  }
};

// ==================== GET /api/therapists/:id ====================
// Fetch therapist details by ID
exports.getTherapistById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid therapist ID'
      });
    }

    const therapist = await Therapist.findById(id)
      .populate('userId', 'firstName lastName email profilePicture isActive')
      .populate('hospitalId', 'name email');

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'therapist' && therapist.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role === 'hospital' && therapist.hospitalId?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: therapist
    });
  } catch (error) {
    console.error('Error fetching therapist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch therapist',
      error: error.message
    });
  }
};

// ==================== POST /api/therapists/create ====================
// Create a new therapist
exports.createTherapist = async (req, res) => {
  try {
    const {
      name,
      email,
      age,
      gender,
      contactNo,
      address,
      qualification,
      experience,
      // Optional: Create user account for therapist
      password,
      firstName,
      lastName
    } = req.body;

    // Validate required fields
    if (!name || !email || !age || !gender || !contactNo || !address || !qualification || !experience) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Check if therapist email already exists
    const existingTherapist = await Therapist.findOne({ email });
    if (existingTherapist) {
      return res.status(400).json({
        success: false,
        message: 'Therapist with this email already exists'
      });
    }

    let userId = req.body.userId;

    // If userId not provided, create a new user account
    if (!userId) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Create user account for therapist
      const nameParts = name.trim().split(' ');
      const userFirstName = firstName || nameParts[0] || '';
      const userLastName = lastName || nameParts.slice(1).join(' ') || '';

      const newUser = await User.create({
        firstName: userFirstName,
        lastName: userLastName,
        email,
        password: password || 'defaultPassword123', // Should be changed on first login
        role: 'therapist',
        hospitalId: req.user.role === 'hospital' ? req.user._id : null,
        isEmailVerified: true
      });

      userId = newUser._id;
    }

    // Create therapist profile
    const therapist = await Therapist.create({
      name,
      email,
      age,
      gender,
      contactNo,
      address,
      qualification,
      experience,
      userId,
      hospitalId: req.user.role === 'hospital' ? req.user._id : null
    });

    const populatedTherapist = await Therapist.findById(therapist._id)
      .populate('userId', 'firstName lastName email profilePicture')
      .populate('hospitalId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Therapist created successfully',
      data: populatedTherapist
    });
  } catch (error) {
    console.error('Error creating therapist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create therapist',
      error: error.message
    });
  }
};

// ==================== PUT /api/therapists/:id ====================
// Update therapist by ID
exports.updateTherapist = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid therapist ID'
      });
    }

    const therapist = await Therapist.findById(id);
    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'therapist' && therapist.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role === 'hospital' && therapist.hospitalId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Don't allow email change to existing email
    if (updateData.email && updateData.email !== therapist.email) {
      const existingTherapist = await Therapist.findOne({ email: updateData.email });
      if (existingTherapist) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    const updatedTherapist = await Therapist.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('userId', 'firstName lastName email profilePicture')
      .populate('hospitalId', 'name email');

    res.status(200).json({
      success: true,
      message: 'Therapist updated successfully',
      data: updatedTherapist
    });
  } catch (error) {
    console.error('Error updating therapist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update therapist',
      error: error.message
    });
  }
};

// ==================== DELETE /api/therapists/:id ====================
// Delete therapist by ID
exports.deleteTherapist = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid therapist ID'
      });
    }

    const therapist = await Therapist.findById(id);
    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'therapist' && therapist.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role === 'hospital' && therapist.hospitalId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Soft delete - set isActive to false
    await Therapist.findByIdAndUpdate(id, { isActive: false });

    // Optionally deactivate the associated user account
    await User.findByIdAndUpdate(therapist.userId, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'Therapist deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting therapist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete therapist',
      error: error.message
    });
  }
};

// ==================== GET /api/therapists/search ====================
// Search therapists
exports.searchTherapists = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    let query = {
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { qualification: { $regex: q, $options: 'i' } },
        { experience: { $regex: q, $options: 'i' } }
      ]
    };

    // Role-based filtering
    if (req.user.role === 'therapist') {
      query.userId = req.user._id;
    } else if (req.user.role === 'hospital') {
      query.hospitalId = req.user._id;
    }

    const therapists = await Therapist.find(query)
      .populate('userId', 'firstName lastName email profilePicture')
      .populate('hospitalId', 'name email')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Therapist.countDocuments(query);

    res.status(200).json({
      success: true,
      data: therapists,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error searching therapists:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search therapists',
      error: error.message
    });
  }
};
