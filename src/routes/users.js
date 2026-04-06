const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize, authorizeSelfOrAdmin } = require('../middleware/auth');

// All user routes require authentication
router.use(authenticate);

// Get all users (admin only)
router.get('/', authorize(['manage:users']), userController.getUsers);

// Get user statistics (admin only)
router.get('/stats', authorize(['manage:users']), userController.getUserStats);

// Toggle user status (admin only)
router.patch('/:id/toggle-status', authorize(['manage:users']), userController.toggleUserStatus);

// Get specific user (self or admin)
router.get('/:id', authorizeSelfOrAdmin, userController.getUserById);

// Update user (self or admin)
router.put('/:id', authorizeSelfOrAdmin, userController.updateUser);

// Delete user (admin only)
router.delete('/:id', authorize(['manage:users']), userController.deleteUser);

module.exports = router;
