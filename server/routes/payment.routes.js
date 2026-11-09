const express = require('express');
const controller = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/payments/me', authenticate, controller.listMyPayments);
router.get('/admin/payments', authenticate, authorize('manager', 'owner'), controller.listPayments);
router.delete('/payments', authenticate, controller.clearAllPayments);
router.delete('/payments/:paymentId', authenticate, controller.clearPayment);

module.exports = router;
