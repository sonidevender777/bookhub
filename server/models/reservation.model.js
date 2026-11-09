const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    status: {
      type: String,
      enum: ['waiting', 'notified', 'fulfilled', 'cancelled', 'expired'],
      default: 'waiting',
      index: true,
    },
    position: { type: Number, min: 1 },
    claimExpiresAt: { type: Date },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

reservationSchema.index({ book: 1, status: 1, position: 1 });
reservationSchema.index({ user: 1, book: 1, status: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
