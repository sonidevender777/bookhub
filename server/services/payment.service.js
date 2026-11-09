const Payment = require('../models/payment.model');
const config = require('../config/env');

const createDemoPayment = async ({ order, user }) => {
  const status = config.demoPaymentMode ? 'demo_pending' : 'requires_provider';
  return Payment.create({
    paymentNumber: `PAY-${Date.now().toString(36).toUpperCase()}`,
    order: order._id,
    user,
    provider: 'demo',
    mode: 'demo',
    amount: order.grandTotal,
    status,
    note: 'BookHub recorded this payment for store review. Online settlement will follow the configured payment provider workflow.',
  });
};

module.exports = { createDemoPayment };
