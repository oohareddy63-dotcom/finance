const mongoose = require('mongoose');
const FinancialRecord = require('../models/FinancialRecord');
const { validate, financialRecordSchemas, validateDateRange } = require('../utils/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// Create a new financial record
const createRecord = asyncHandler(async (req, res) => {
  const recordData = {
    ...req.body,
    user_id: req.user.id // Set current user as owner
  };

  const record = await FinancialRecord.create(recordData);

  res.status(201).json({
    message: 'Financial record created successfully',
    record
  });
});

// Get all financial records with filtering
const getRecords = asyncHandler(async (req, res) => {
  const filters = {
    user_id: req.user.role === 'admin' ? req.query.user_id : req.user.id,
    type: req.query.type,
    category: req.query.category
  };

  // Add date filters
  if (req.query.date_from || req.query.date_to) {
    filters.date = {};
    if (req.query.date_from) {
      filters.date.$gte = new Date(req.query.date_from);
    }
    if (req.query.date_to) {
      filters.date.$lte = new Date(req.query.date_to);
    }
  }

  // Add amount filters
  if (req.query.min_amount || req.query.max_amount) {
    filters.amount = {};
    if (req.query.min_amount) {
      filters.amount.$gte = parseFloat(req.query.min_amount);
    }
    if (req.query.max_amount) {
      filters.amount.$lte = parseFloat(req.query.max_amount);
    }
  }

  // Remove undefined filters
  Object.keys(filters).forEach(key => {
    if (filters[key] === undefined || (typeof filters[key] === 'object' && Object.keys(filters[key]).length === 0)) {
      delete filters[key];
    }
  });

  const query = FinancialRecord.find(filters)
    .sort({ date: -1, createdAt: -1 })
    .populate('user_id', 'username email');

  // Apply pagination
  if (req.query.limit) {
    query.limit(parseInt(req.query.limit));
  }
  if (req.query.offset) {
    query.skip(parseInt(req.query.offset));
  }

  const records = await query;

  res.json({
    message: 'Financial records retrieved successfully',
    records,
    count: records.length,
    filters
  });
});

// Get a specific financial record by ID
const getRecordById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: 'Invalid record ID',
      message: 'Record ID must be a valid MongoDB ObjectId'
    });
  }

  const record = await FinancialRecord.findById(id);

  if (!record) {
    return res.status(404).json({
      error: 'Record not found',
      message: `Financial record with ID ${id} not found`
    });
  }

  // Check authorization (owner or admin)
  if (req.user.role !== 'admin' && record.user_id._id.toString() !== req.user.id) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You can only access your own records'
    });
  }

  res.json({
    message: 'Financial record retrieved successfully',
    record
  });
});

// Update a financial record
const updateRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: 'Invalid record ID',
      message: 'Record ID must be a valid MongoDB ObjectId'
    });
  }

  // Check if record exists and user has access
  const existingRecord = await FinancialRecord.findById(id);
  if (!existingRecord) {
    return res.status(404).json({
      error: 'Record not found',
      message: `Financial record with ID ${id} not found`
    });
  }

  // Check authorization (owner or admin)
  if (req.user.role !== 'admin' && existingRecord.user_id._id.toString() !== req.user.id) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You can only update your own records'
    });
  }

  const updatedRecord = await FinancialRecord.findByIdAndUpdate(
    id, 
    req.body, 
    { 
      new: true, 
      runValidators: true 
    }
  );

  res.json({
    message: 'Financial record updated successfully',
    record: updatedRecord
  });
});

// Delete a financial record
const deleteRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: 'Invalid record ID',
      message: 'Record ID must be a valid MongoDB ObjectId'
    });
  }

  // Check if record exists and user has access
  const existingRecord = await FinancialRecord.findById(id);
  if (!existingRecord) {
    return res.status(404).json({
      error: 'Record not found',
      message: `Financial record with ID ${id} not found`
    });
  }

  // Check authorization (owner or admin)
  if (req.user.role !== 'admin' && existingRecord.user_id._id.toString() !== req.user.id) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You can only delete your own records'
    });
  }

  await FinancialRecord.findByIdAndDelete(id);

  res.json({
    message: 'Financial record deleted successfully'
  });
});

// Get financial summary
const getFinancialSummary = asyncHandler(async (req, res) => {
  const userId = req.user.role === 'admin' ? req.query.user_id : req.user.id;
  
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

  const summary = await FinancialRecord.getCategorySummary(userId, filters);

  res.json({
    message: 'Financial summary retrieved successfully',
    summary,
    filters
  });
});

// Get monthly trends
const getMonthlyTrends = asyncHandler(async (req, res) => {
  const userId = req.user.role === 'admin' ? req.query.user_id : req.user.id;
  const year = req.query.year;

  const trends = await FinancialRecord.getMonthlyTrends(userId, year);

  res.json({
    message: 'Monthly trends retrieved successfully',
    trends,
    filters: { user_id: userId, year }
  });
});

// Get categories
const getCategories = asyncHandler(async (req, res) => {
  const userId = req.user.role === 'admin' ? req.query.user_id : req.user.id;

  const categories = await FinancialRecord.distinct('category', { user_id: userId });
  
  res.json({
    message: 'Categories retrieved successfully',
    categories,
    count: categories.length
  });
});

// Get statistics for a user's records
const getRecordStats = asyncHandler(async (req, res) => {
  const userId = req.user.role === 'admin' ? req.query.user_id : req.user.id;
  
  const stats = await FinancialRecord.aggregate([
    { $match: { user_id: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        totalIncome: {
          $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
        },
        totalExpenses: {
          $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
        },
        averageAmount: { $avg: '$amount' },
        maxAmount: { $max: '$amount' },
        minAmount: { $min: '$amount' }
      }
    }
  ]);

  const result = stats[0] || {
    totalRecords: 0,
    totalIncome: 0,
    totalExpenses: 0,
    averageAmount: 0,
    maxAmount: 0,
    minAmount: 0
  };

  result.netBalance = result.totalIncome - result.totalExpenses;

  res.json({
    message: 'Record statistics retrieved successfully',
    stats: result
  });
});

module.exports = {
  createRecord: [validate(financialRecordSchemas.create), validateDateRange, createRecord],
  getRecords: [validate(financialRecordSchemas.filters, 'query'), validateDateRange, getRecords],
  getRecordById,
  updateRecord: [validate(financialRecordSchemas.update), validateDateRange, updateRecord],
  deleteRecord,
  getFinancialSummary: [validateDateRange, getFinancialSummary],
  getMonthlyTrends,
  getCategories,
  getRecordStats
};
