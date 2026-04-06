const express = require('express');
const router = express.Router();
const financialRecordController = require('../controllers/financialRecordController');
const { authenticate, authorize, authorizeSelfOrAdmin } = require('../middleware/auth');

// All record routes require authentication
router.use(authenticate);

// Create record (analyst or admin)
router.post('/', authorize(['write:records']), financialRecordController.createRecord);

// Get records (viewer, analyst, or admin)
router.get('/', authorize(['read:records']), financialRecordController.getRecords);

// Get financial summary (analyst or admin)
router.get('/summary', authorize(['read:analytics']), financialRecordController.getFinancialSummary);

// Get monthly trends (analyst or admin)
router.get('/trends', authorize(['read:analytics']), financialRecordController.getMonthlyTrends);

// Get categories (viewer, analyst, or admin)
router.get('/categories', authorize(['read:records']), financialRecordController.getCategories);

// Get record statistics (analyst or admin)
router.get('/stats', authorize(['read:analytics']), financialRecordController.getRecordStats);

// Get specific record (owner or admin)
router.get('/:id', authorize(['read:records']), financialRecordController.getRecordById);

// Update record (owner or admin)
router.put('/:id', authorize(['write:records']), financialRecordController.updateRecord);

// Delete record (owner or admin)
router.delete('/:id', authorize(['delete:records']), financialRecordController.deleteRecord);

module.exports = router;
