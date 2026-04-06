const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

// All dashboard routes require authentication
router.use(authenticate);

// Get dashboard summary (viewer, analyst, or admin)
router.get('/summary', authorize(['read:dashboard']), dashboardController.getDashboardSummary);

// Get detailed analytics (analyst or admin)
router.get('/analytics', authorize(['read:analytics']), dashboardController.getAnalytics);

// Get user analytics (admin only)
router.get('/user-analytics', authorize(['manage:users']), dashboardController.getUserAnalytics);

// Get top categories (analyst or admin)
router.get('/top-categories', authorize(['read:analytics']), dashboardController.getTopCategories);

// Get spending trends (analyst or admin)
router.get('/spending-trends', authorize(['read:analytics']), dashboardController.getSpendingTrends);

module.exports = router;
