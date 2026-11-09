const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    audience: { type: String, enum: ['customer', 'admin'], default: 'customer', index: true },
    type: {
      type: String,
      enum: [
        'order_created',
        'order_confirmed',
        'order_status_changed',
        'rental_created',
        'rental_due_soon',
        'rental_overdue',
        'rental_returned',
        'rental_issue',
        'digital_access_created',
        'digital_access_expiring',
        'digital_access_expired',
        'system',
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    message: { type: String, required: true, trim: true, maxlength: 800 },
    link: { type: String, trim: true, maxlength: 240 },
    readAt: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
