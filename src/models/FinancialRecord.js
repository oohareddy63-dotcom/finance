const mongoose = require('mongoose');
const financialRecordSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be positive']
  },
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: ['income', 'expense'],
    lowercase: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  description: String,
  tags: [String]
}, { timestamps: true });


// ==========================
// ✅ DASHBOARD SUMMARY (FIXED)
// ==========================
financialRecordSchema.statics.getDashboardSummary = async function(userId, filters = {}) {
  try {
    const matchStage = {
      user_id: userId
    };

    // ✅ FIX: Proper date filter
    if (filters.date) {
      matchStage.date = filters.date;
    }

    const result = await this.aggregate([
      { $match: matchStage },

      {
        $group: {
          _id: null,

          totalIncome: {
            $sum: {
              $cond: [
                { $eq: ['$type', 'income'] },
                '$amount',
                0
              ]
            }
          },

          totalExpenses: {
            $sum: {
              $cond: [
                { $eq: ['$type', 'expense'] },
                '$amount',
                0
              ]
            }
          },

          totalRecords: { $sum: 1 },
          averageAmount: { $avg: '$amount' },
          maxAmount: { $max: '$amount' },
          minAmount: { $min: '$amount' }
        }
      }
    ]);

    const summary = result[0] || {
      totalIncome: 0,
      totalExpenses: 0,
      totalRecords: 0,
      averageAmount: 0,
      maxAmount: 0,
      minAmount: 0
    };

    // ✅ recent activity
    const recentActivity = await this.find(matchStage)
      .sort({ date: -1 })
      .limit(5);

    return {
      totalIncome: summary.totalIncome || 0,
      totalExpenses: summary.totalExpenses || 0,
      totalRecords: summary.totalRecords || 0,
      averageAmount: summary.averageAmount || 0,
      maxAmount: summary.maxAmount || 0,
      minAmount: summary.minAmount || 0,
      netBalance: (summary.totalIncome || 0) - (summary.totalExpenses || 0),
      recentActivity
    };

  } catch (error) {
    console.error("Aggregation Error:", error);
    throw error;
  }
};


// ==========================
// CATEGORY SUMMARY
// ==========================
financialRecordSchema.statics.getCategorySummary = async function(userId) {
  return await this.aggregate([
    { $match: { user_id: userId } },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
};


// ==========================
// MONTHLY TRENDS
// ==========================
financialRecordSchema.statics.getMonthlyTrends = async function(userId) {
  return await this.aggregate([
    { $match: { user_id: userId } },
    {
      $group: {
        _id: { month: { $month: '$date' }, type: '$type' },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
};


// ==========================
// POPULATE USER
// ==========================
financialRecordSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user_id',
    select: 'username email'
  });
  next();
});


module.exports = mongoose.model('FinancialRecord', financialRecordSchema);
