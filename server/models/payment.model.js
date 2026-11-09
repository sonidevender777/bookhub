const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, enum: ['demo', 'razorpay', 'stripe', 'paypal'], default: 'demo' },
    mode: { type: String, enum: ['demo', 'test', 'live'], default: 'demo' },
    amount: { type: Number, min: 0, required: true },
    currency: { type: String, enum: ['INR'], default: 'INR' },
    status: { type: String, enum: ['demo_pending', 'requires_provider', 'paid', 'failed', 'refunded'], default: 'demo_pending', index: true },
    gatewayReference: { type: String, trim: true, maxlength: 200 },
    note: { type: String, trim: true, maxlength: 600 },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Payment', paymentSchema);
