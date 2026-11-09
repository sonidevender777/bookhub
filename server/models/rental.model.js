const mongoose = require('mongoose');

const conditionSnapshotSchema = new mongoose.Schema(
  {
    grade: {
      type: String,
      enum: ['new', 'excellent', 'good', 'fair', 'poor', 'damaged'],
      default: 'good',
    },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const rentalSchema = new mongoose.Schema(
  {
    rentalNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    copy: { type: mongoose.Schema.Types.ObjectId, ref: 'BookCopy', required: true, unique: true, index: true },
    checkoutDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true, index: true },
    returnDate: { type: Date },
    rentalPrice: { type: Number, min: 0, required: true },
    bookPriceSnapshot: { type: Number, min: 0, required: true },
    graceDays: { type: Number, min: 0, max: 30, default: 1 },
    penaltyRatePerDay: { type: Number, min: 0, max: 1, default: 0.01 },
    penaltyAmount: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ['active', 'returned', 'overdue', 'lost', 'damaged', 'cancelled'],
      default: 'active',
      index: true,
    },
    conditionBefore: { type: conditionSnapshotSchema, default: () => ({ grade: 'good' }) },
    conditionAfter: { type: conditionSnapshotSchema },
    notes: { type: String, trim: true, maxlength: 700 },
  },
  { timestamps: true },
);

rentalSchema.index({ user: 1, status: 1, dueDate: 1 });
rentalSchema.index({ status: 1, dueDate: 1 });

rentalSchema.methods.calculatePenalty = function calculatePenalty(referenceDate = new Date()) {
  if (['returned', 'cancelled'].includes(this.status)) return this.penaltyAmount || 0;
  const penaltyStartsAt = new Date(this.dueDate);
  penaltyStartsAt.setDate(penaltyStartsAt.getDate() + this.graceDays);
  if (referenceDate <= penaltyStartsAt) return 0;
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const overdueDays = Math.ceil((referenceDate - penaltyStartsAt) / millisecondsPerDay);
  return Math.round(this.bookPriceSnapshot * this.penaltyRatePerDay * overdueDays);
};

module.exports = mongoose.model('Rental', rentalSchema);
