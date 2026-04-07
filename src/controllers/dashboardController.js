const FinancialRecord = require('../models/FinancialRecord');
const User = require('../models/User');
const mongoose = require('mongoose');
const { validateDateRange } = require('../utils/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// ==========================
// GET DASHBOARD SUMMARY

// ==========================
const getDashboardSummary = asyncHandler(async (req, res) => {
  let userId = req.user.role === 'admin' ? req.query.user_id : req.user.id;

  // ✅ Convert to ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      error: 'Invalid user ID'
    });
  }

  userId = new mongoose.Types.ObjectId(userId);

  // Filters
  const filters = {};
  if (req.query.date_from || req.query.date_to) {
    filters.date = {};
    if (req.query.date_from) {
      filters.date.$gte = new Date(req.query.date_from);
    }
    if (req.query.date_to) {
      filters.date.$lte = new Date(req.query.date_to);
    }
  }

  const summary = await FinancialRecord.getDashboardSummary(userId, filters);

  res.json({
    message: 'Dashboard summary retrieved successfully',
    summary,
    filters
  });
});


// ==========================
// GET ANALYTICS
// ==========================
const getAnalytics = asyncHandler(async (req, res) => {
  let userId = req.user.role === 'admin' ? req.query.user_id : req.user.id;

  userId = new mongoose.Types.ObjectId(userId);

  const filters = {};
  if (req.query.date_from || req.query.date_to) {
    filters.date = {};
    if (req.query.date_from) {
      filters.date.$gte = new Date(req.query.date_from);
    }
    if (req.query.date_to) {
      filters.date.$lte = new Date(req.query.date_to);
    }
  }

  const dashboardSummary = await FinancialRecord.getDashboardSummary(userId, filters);
  const categorySummary = await FinancialRecord.getCategorySummary(userId, filters);
  const monthlyTrends = await FinancialRecord.getMonthlyTrends(userId, req.query.year);

  const analytics = {
    overview: {
      total_income: dashboardSummary.totalIncome,
      total_expenses: dashboardSummary.totalExpenses,
      net_balance: dashboardSummary.netBalance,
      total_records: dashboardSummary.totalRecords,
      average_amount: dashboardSummary.averageAmount,
      max_amount: dashboardSummary.maxAmount,
      min_amount: dashboardSummary.minAmount
    },
    by_category: categorySummary,
    monthly_trends: monthlyTrends,
    recent_activity: dashboardSummary.recentActivity
  };

  const insights = generateInsights(analytics);
  analytics.insights = insights;

  res.json({
    message: 'Analytics retrieved successfully',
    analytics,
    filters
  });
});


// ==========================
// USER ANALYTICS (ADMIN)
// ==========================
const getUserAnalytics = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied'
    });
  }

  const users = await User.find({ status: 'active' });

  const userAnalytics = [];

  for (const user of users) {
    const summary = await FinancialRecord.getDashboardSummary(user._id);

    userAnalytics.push({
      user: user.profile,
      summary: {
        total_income: summary.totalIncome,
        total_expenses: summary.totalExpenses,
        net_balance: summary.netBalance,
        total_records: summary.totalRecords,
        average_amount: summary.averageAmount
      }
    });
  }

  const systemStats = await FinancialRecord.aggregate([
    {
      $group: {
        _id: null,
        total_income: {
          $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
        },
        total_expenses: {
          $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
        },
        total_records: { $sum: 1 },
        average_amount: { $avg: '$amount' }
      }
    }
  ]);

  const stats = systemStats[0] || {
    total_income: 0,
    total_expenses: 0,
    total_records: 0,
    average_amount: 0
  };

  stats.net_balance = stats.total_income - stats.total_expenses;

  res.json({
    message: 'User analytics retrieved successfully',
    system_stats: stats,
    user_analytics: userAnalytics
  });
});


// ==========================
// TOP CATEGORIES
// ==========================
const getTopCategories = asyncHandler(async (req, res) => {
  let userId = req.user.role === 'admin' ? req.query.user_id : req.user.id;
  userId = new mongoose.Types.ObjectId(userId);

  const limit = parseInt(req.query.limit) || 10;

  const topCategories = await FinancialRecord.aggregate([
    { $match: { user_id: userId } },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        type: { $first: '$type' }
      }
    },
    { $sort: { totalAmount: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        category: '$_id',
        totalAmount: 1,
        count: 1,
        type: 1
      }
    }
  ]);

  res.json({
    message: 'Top categories retrieved successfully',
    categories: topCategories
  });
});


// ==========================
// SPENDING TRENDS
// ==========================
const getSpendingTrends = asyncHandler(async (req, res) => {
  let userId = req.user.role === 'admin' ? req.query.user_id : req.user.id;
  userId = new mongoose.Types.ObjectId(userId);

  const trends = await FinancialRecord.aggregate([
    { $match: { user_id: userId } },
    {
      $group: {
        _id: { month: { $month: '$date' }, type: '$type' },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  res.json({
    message: 'Spending trends retrieved successfully',
    trends
  });
});


// ==========================
// INSIGHTS
// ==========================
const generateInsights = (analytics) => {
  const insights = [];
  const { overview } = analytics;

  if (overview.net_balance < 0) {
    insights.push({
      type: 'warning',
      message: 'Expenses are higher than income'
    });
  } else {
    insights.push({
      type: 'success',
      message: 'Good financial balance'
    });
  }

  return insights;
};


// ==========================
// EXPORTS
// ==========================
module.exports = {
  getDashboardSummary: [validateDateRange, getDashboardSummary],
  getAnalytics: [validateDateRange, getAnalytics],
  getUserAnalytics,
  getTopCategories,
  getSpendingTrends
};
