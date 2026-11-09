const Payment = require('../models/payment.model');
const ApiError = require('../utils/api-error');

const listMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id }).populate('order', 'orderNumber orderStatus').sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

const listPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find().populate('user', 'fullName email').populate('order', 'orderNumber orderStatus').sort({ createdAt: -1 }).limit(150).lean();
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

const clearPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) throw new ApiError('Payment record not found.', 404);
    const isAdmin = ['manager', 'owner'].includes(req.user.role);
    if (!isAdmin && String(payment.user) !== String(req.user._id)) {
      throw new ApiError('You can only clear your own payment records.', 403);
    }
    if (payment.provider !== 'demo') {
      throw new ApiError('Gateway-processed payment records cannot be removed.', 422);
    }
    await payment.deleteOne();
    res.status(200).json({ success: true, message: 'Payment record cleared.' });
  } catch (error) {
    next(error);
  }
};

const clearAllPayments = async (req, res, next) => {
  try {
    const isAdmin = ['manager', 'owner'].includes(req.user.role);
    const filter = { provider: 'demo' };
    if (!isAdmin) filter.user = req.user._id;
    const result = await Payment.deleteMany(filter);
    res.status(200).json({ success: true, message: `${result.deletedCount} payment record${result.deletedCount === 1 ? '' : 's'} cleared.` });
  } catch (error) {
    next(error);
  }
};

module.exports = { listMyPayments, listPayments, clearPayment, clearAllPayments };
