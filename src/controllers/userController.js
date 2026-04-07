const mongoose = require('mongoose');
const User = require('../models/User');
const FinancialRecord = require('../models/FinancialRecord');
const { validate, userSchemas, querySchemas } = require('../utils/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// Get all users (admin only)
const getUsers = asyncHandler(async (req, res) => {
  const filters = {
    status: req.query.status,
    role: req.query.role
  };
  // Remove undefined filters
  Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

  const users = await User.findActiveUsers(filters)
    .sort({ createdAt: -1 })
    .limit(parseInt(req.query.limit) || 50);

  res.json({
    message: 'Users retrieved successfully',
    users: users.map(user => user.profile),
    count: users.length
  });
});

// Get user by ID
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: 'Invalid user ID',
      message: 'User ID must be a valid MongoDB ObjectId'
    });
  }

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      message: `User with ID ${id} not found`
    });
  }

  // Check authorization (self or admin)
  if (req.user.role !== 'admin' && req.user.id !== id) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You can only access your own profile'
    });
  }

  res.json({
    message: 'User retrieved successfully',
    user: user.profile
  });
});

// Update user
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: 'Invalid user ID',
      message: 'User ID must be a valid MongoDB ObjectId'
    });
  }

  // Check if user exists
  const existingUser = await User.findById(id);
  if (!existingUser) {
    return res.status(404).json({
      error: 'User not found',
      message: `User with ID ${id} not found`
    });
  }

  // Check authorization (self or admin)
  if (req.user.role !== 'admin' && req.user.id !== id) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You can only update your own profile'
    });
  }

  // Non-admin users cannot change their role or status
  const updateData = { ...req.body };
  if (req.user.role !== 'admin') {
    delete updateData.role;
    delete updateData.status;
  }

  // Check for duplicate email/username if being updated
  if (updateData.email && updateData.email !== existingUser.email) {
    const emailExists = await User.findByEmail(updateData.email);
    if (emailExists) {
      return res.status(409).json({
        error: 'Update failed',
        message: 'Email is already in use by another user'
      });
    }
  }

  if (updateData.username && updateData.username !== existingUser.username) {
    const usernameExists = await User.findByUsername(updateData.username);
    if (usernameExists) {
      return res.status(409).json({
        error: 'Update failed',
        message: 'Username is already taken by another user'
      });
    }
  }

  const updatedUser = await User.findByIdAndUpdate(id, updateData, { 
    new: true, 
    runValidators: true 
  });

  res.json({
    message: 'User updated successfully',
    user: updatedUser.profile
  });
});

// Delete user (admin only)
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: 'Invalid user ID',
      message: 'User ID must be a valid MongoDB ObjectId'
    });
  }

  // Prevent self-deletion
  if (req.user.id === id) {
    return res.status(400).json({
      error: 'Cannot delete yourself',
      message: 'You cannot delete your own account'
    });
  }

  // Check if user has financial records
  const recordCount = await FinancialRecord.countDocuments({ user_id: id });
  if (recordCount > 0) {
    return res.status(400).json({
      error: 'Cannot delete user',
      message: 'User has financial records. Please delete records first or deactivate user account.'
    });
  }

  const deletedUser = await User.findByIdAndDelete(id);

  if (!deletedUser) {
    return res.status(404).json({
      error: 'User not found',
      message: `User with ID ${id} not found`
    });
  }

  res.json({
    message: 'User deleted successfully'
  });
});

// Get user statistics (admin only)
const getUserStats = asyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        inactiveUsers: {
          $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
        }
      }
    }
  ]);

  const roleStats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = stats[0] || { totalUsers: 0, activeUsers: 0, inactiveUsers: 0 };
  
  // Format role stats
  const roles = {};
  roleStats.forEach(stat => {
    roles[stat._id] = stat.count;
  });

  res.json({
    message: 'User statistics retrieved successfully',
    stats: {
      ...result,
      by_role: roles
    }
  });
});

// Deactivate/Activate user (admin only)
const toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: 'Invalid user ID',
      message: 'User ID must be a valid MongoDB ObjectId'
    });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      message: `User with ID ${id} not found`
    });
  }

  // Prevent self-deactivation
  if (req.user.id === id) {
    return res.status(400).json({
      error: 'Cannot change your own status',
      message: 'You cannot change your own account status'
    });
  }

  user.status = user.status === 'active' ? 'inactive' : 'active';
  await user.save();

  res.json({
    message: `User ${user.status === 'active' ? 'activated' : 'deactivated'} successfully`,
    user: user.profile
  });
});

module.exports = {
  getUsers: [validate(querySchemas.pagination, 'query'), getUsers],
  getUserById,
  updateUser: [validate(userSchemas.update), updateUser],
  deleteUser,
  getUserStats,
  toggleUserStatus
};
