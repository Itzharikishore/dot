const mongoose = require('mongoose');
const Game = require('../models/Game');

// ==================== Helpers ====================
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ==================== GET /api/games/list ====================
// Fetch all games with optional filtering and pagination
exports.getAllGames = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      difficulty, 
      ageGroup, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    let query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    if (ageGroup) {
      query.ageGroup = ageGroup;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { benefits: { $elemMatch: { $regex: search, $options: 'i' } } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const games = await Game.find(query)
      .populate('createdBy', 'firstName lastName')
      .populate('therapyGoals', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Game.countDocuments(query);

    // Transform to frontend format
    const transformedGames = games.map(game => ({
      id: game._id.toString(),
      name: game.name,
      image: game.image,
      category: game.category,
      description: game.description,
      difficulty: game.difficulty,
      ageGroup: game.ageGroup,
      duration: game.duration,
      benefits: game.benefits,
      instructions: game.instructions,
      materials: game.materials,
      thumbnailImage: game.thumbnailImage,
      isPremium: game.isPremium,
      playCount: game.playCount,
      averageRating: game.averageRating,
      ratingCount: game.ratingCount,
      ratingDisplay: game.ratingDisplay,
      settings: game.settings,
      createdBy: game.createdBy ? {
        id: game.createdBy._id,
        name: `${game.createdBy.firstName} ${game.createdBy.lastName}`
      } : null
    }));

    res.status(200).json({
      success: true,
      data: transformedGames,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch games',
      error: error.message
    });
  }
};

// ==================== GET /api/games/search ====================
// Search games by name or category
exports.searchGames = async (req, res) => {
  try {
    const { q, page = 1, limit = 20, category, difficulty, ageGroup } = req.query;
    const skip = (page - 1) * limit;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Build search query
    let query = { 
      isActive: true,
      $or: [
        { name: { $regex: q.trim(), $options: 'i' } },
        { description: { $regex: q.trim(), $options: 'i' } },
        { category: { $regex: q.trim(), $options: 'i' } },
        { benefits: { $elemMatch: { $regex: q.trim(), $options: 'i' } } }
      ]
    };

    // Add filters
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (ageGroup) query.ageGroup = ageGroup;

    const games = await Game.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ averageRating: -1, playCount: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Game.countDocuments(query);

    // Transform to frontend format
    const transformedGames = games.map(game => ({
      id: game._id.toString(),
      name: game.name,
      image: game.image,
      category: game.category,
      description: game.description,
      difficulty: game.difficulty,
      ageGroup: game.ageGroup,
      duration: game.duration,
      benefits: game.benefits,
      averageRating: game.averageRating,
      playCount: game.playCount,
      ratingDisplay: game.ratingDisplay,
      createdBy: game.createdBy ? {
        id: game.createdBy._id,
        name: `${game.createdBy.firstName} ${game.createdBy.lastName}`
      } : null
    }));

    res.status(200).json({
      success: true,
      data: transformedGames,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error searching games:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search games',
      error: error.message
    });
  }
};

// ==================== GET /api/games/:id ====================
// Get game details by ID
exports.getGameById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid game ID'
      });
    }

    const game = await Game.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('therapyGoals', 'name description');

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    if (!game.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Game is not available'
      });
    }

    // Transform to frontend format
    const transformedGame = {
      id: game._id.toString(),
      name: game.name,
      image: game.image,
      category: game.category,
      description: game.description,
      difficulty: game.difficulty,
      ageGroup: game.ageGroup,
      duration: game.duration,
      benefits: game.benefits,
      instructions: game.instructions,
      materials: game.materials,
      thumbnailImage: game.thumbnailImage,
      isPremium: game.isPremium,
      playCount: game.playCount,
      averageRating: game.averageRating,
      ratingCount: game.ratingCount,
      ratingDisplay: game.ratingDisplay,
      settings: game.settings,
      mediaFiles: game.mediaFiles,
      therapyGoals: game.therapyGoals,
      createdBy: game.createdBy ? {
        id: game.createdBy._id,
        name: `${game.createdBy.firstName} ${game.createdBy.lastName}`,
        email: game.createdBy.email
      } : null,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt
    };

    // Increment play count (optional - only if user actually plays)
    // await game.incrementPlayCount();

    res.status(200).json({
      success: true,
      data: transformedGame
    });
  } catch (error) {
    console.error('Error fetching game details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch game details',
      error: error.message
    });
  }
};

// ==================== GET /api/games/categories ====================
// Get all available game categories
exports.getGameCategories = async (req, res) => {
  try {
    const categories = await Game.distinct('category', { isActive: true });
    
    const categoryStats = await Promise.all(
      categories.map(async (category) => {
        const count = await Game.countDocuments({ 
          category, 
          isActive: true 
        });
        return { category, count };
      })
    );

    res.status(200).json({
      success: true,
      data: categoryStats
    });
  } catch (error) {
    console.error('Error fetching game categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch game categories',
      error: error.message
    });
  }
};

// ==================== POST /api/games/:id/rate ====================
// Rate a game
exports.rateGame = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid game ID'
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const game = await Game.findById(id);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    await game.updateRating(rating);

    res.status(200).json({
      success: true,
      message: 'Game rated successfully',
      data: {
        newAverageRating: game.averageRating,
        newRatingCount: game.ratingCount
      }
    });
  } catch (error) {
    console.error('Error rating game:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rate game',
      error: error.message
    });
  }
};

// ==================== GET /api/games/featured ====================
// Get featured/popular games
exports.getFeaturedGames = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const games = await Game.find({ isActive: true })
      .populate('createdBy', 'firstName lastName')
      .sort({ averageRating: -1, playCount: -1 })
      .limit(parseInt(limit));

    const transformedGames = games.map(game => ({
      id: game._id.toString(),
      name: game.name,
      image: game.image,
      category: game.category,
      description: game.description.substring(0, 150) + '...',
      difficulty: game.difficulty,
      ageGroup: game.ageGroup,
      duration: game.duration,
      benefits: game.benefits.slice(0, 3),
      averageRating: game.averageRating,
      playCount: game.playCount,
      ratingDisplay: game.ratingDisplay,
      isPremium: game.isPremium
    }));

    res.status(200).json({
      success: true,
      data: transformedGames
    });
  } catch (error) {
    console.error('Error fetching featured games:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured games',
      error: error.message
    });
  }
};
