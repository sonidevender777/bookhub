const mongoose = require('mongoose');

const digitalAccessSchema = new mongoose.Schema(
  {
    accessNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    startTime: { type: Date, default: Date.now },
    expirationTime: { type: Date, required: true, index: true },
    price: { type: Number, min: 0, required: true },
    format: { type: String, enum: ['pdf'], default: 'pdf' },
    assetKey: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: ['active', 'expired', 'revoked'], default: 'active', index: true },
    lastAccessedAt: { type: Date },
  },
  { timestamps: true },
);

digitalAccessSchema.index({ user: 1, status: 1, expirationTime: 1 });

digitalAccessSchema.methods.isActiveNow = function isActiveNow(referenceDate = new Date()) {
  return this.status === 'active' && this.startTime <= referenceDate && this.expirationTime > referenceDate;
};

module.exports = mongoose.model('DigitalAccess', digitalAccessSchema);
