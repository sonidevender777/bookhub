const express = require('express');
const controller = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validateObjectId = require('../middleware/validate-object-id');

const router = express.Router();
const adminOnly = [authenticate, authorize('manager', 'owner')];

router.get('/admin/dashboard', ...adminOnly, controller.dashboard);
router.get('/admin/customers', ...adminOnly, controller.customers);
router.get('/admin/books', ...adminOnly, controller.listBooks);
router.get('/admin/books/:bookId/open', ...adminOnly, validateObjectId('bookId'), controller.openBook);

module.exports = router;
