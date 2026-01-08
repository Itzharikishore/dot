const express = require('express');
const router = express.Router();
const { param, query, body } = require('express-validator');

const { protect, authorize } = require('../../middleware/auth');
const { handleValidationErrors } = require('../../middleware/validation');
const {
  getAllGames,
  searchGames,
  getGameById,
  getGameCategories,
  rateGame,
  getFeaturedGames
} = require('../../controllers/gamesController');

// ==================== VALIDATORS ====================
const gameIdValidator = [
  param('id').isMongoId().withMessage('Invalid game ID'),
  handleValidationErrors
];

const searchValidator = [
  query('q').isString().trim().isLength({ min: 1 }).withMessage('Search query is required'),
  handleValidationErrors
];

const ratingValidator = [
  param('id').isMongoId().withMessage('Invalid game ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  handleValidationErrors
];

// ==================== ROUTES ====================

/**
 * @swagger
 * /api/games/list:
 *   get:
 *     summary: Get all games
 *     description: Fetch a paginated list of games with optional filtering
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Fine Motor, Gross Motor, Speech & Language, Cognitive, Social Skills, Sensory, Daily Living, Emotional Regulation]
 *         description: Filter by category
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [Easy, Medium, Hard]
 *         description: Filter by difficulty
 *       - in: query
 *         name: ageGroup
 *         schema:
 *           type: string
 *           enum: [3-5, 5-7, 7-9, 9-12, 12+]
 *         description: Filter by age group
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name, description, or benefits
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name, averageRating, playCount]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Games fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       image:
 *                         type: string
 *                       category:
 *                         type: string
 *                       description:
 *                         type: string
 *                       difficulty:
 *                         type: string
 *                       ageGroup:
 *                         type: string
 *                       duration:
 *                         type: integer
 *                       benefits:
 *                         type: array
 *                         items:
 *                           type: string
 *                       averageRating:
 *                         type: number
 *                       playCount:
 *                         type: integer
 *                       ratingDisplay:
 *                         type: string
 *                       isPremium:
 *                         type: boolean
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.get('/list', protect, getAllGames);

/**
 * @swagger
 * /api/games/search:
 *   get:
 *     summary: Search games
 *     description: Search games by name, description, category, or benefits
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *         description: Filter by difficulty
 *       - in: query
 *         name: ageGroup
 *         schema:
 *           type: string
 *         description: Filter by age group
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Game'
 *                 pagination:
 *                   type: object
 *       400:
 *         description: Search query required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.get('/search', protect, searchValidator, searchGames);

/**
 * @swagger
 * /api/games/{id}:
 *   get:
 *     summary: Get game details
 *     description: Fetch detailed information about a specific game
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID
 *     responses:
 *       200:
 *         description: Game details fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     image:
 *                       type: string
 *                     category:
 *                       type: string
 *                     description:
 *                       type: string
 *                     difficulty:
 *                       type: string
 *                     ageGroup:
 *                       type: string
 *                     duration:
 *                       type: integer
 *                     benefits:
 *                       type: array
 *                       items:
 *                         type: string
 *                     instructions:
 *                       type: string
 *                     materials:
 *                       type: array
 *                       items:
 *                         type: string
 *                     thumbnailImage:
 *                       type: string
 *                     isPremium:
 *                       type: boolean
 *                     playCount:
 *                       type: integer
 *                     averageRating:
 *                       type: number
 *                     ratingCount:
 *                       type: integer
 *                     ratingDisplay:
 *                       type: string
 *                     settings:
 *                       type: object
 *                     mediaFiles:
 *                       type: array
 *                       items:
 *                         type: string
 *                     therapyGoals:
 *                       type: array
 *                       items:
 *                         type: object
 *                     createdBy:
 *                       type: object
 *                     createdAt:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *       400:
 *         description: Invalid game ID
 *       404:
 *         description: Game not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.get('/:id', protect, gameIdValidator, getGameById);

/**
 * @swagger
 * /api/games/categories:
 *   get:
 *     summary: Get game categories
 *     description: Fetch all available game categories with counts
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                       count:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.get('/categories', protect, getGameCategories);

/**
 * @swagger
 * /api/games/featured:
 *   get:
 *     summary: Get featured games
 *     description: Fetch popular and highly-rated games
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of games to return
 *     responses:
 *       200:
 *         description: Featured games fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Game'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.get('/featured', protect, getFeaturedGames);

/**
 * @swagger
 * /api/games/{id}/rate:
 *   post:
 *     summary: Rate a game
 *     description: Rate a game from 1 to 5 stars
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Game rating (1-5)
 *     responses:
 *       200:
 *         description: Game rated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     newAverageRating:
 *                       type: number
 *                     newRatingCount:
 *                       type: integer
 *       400:
 *         description: Invalid rating or game ID
 *       404:
 *         description: Game not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.post('/:id/rate', protect, ratingValidator, rateGame);

module.exports = router;
