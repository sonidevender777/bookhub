const mongoose = require('mongoose');

const conditionSchema = new mongoose.Schema(
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

const copyHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['created', 'moved', 'status_changed', 'condition_updated'],
      required: true,
    },
    fromLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    toLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    fromStatus: { type: String },
    toStatus: { type: String },
    note: { type: String, trim: true, maxlength: 500 },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const bookCopySchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true, index: true },
    copyCode: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 40 },
    barcode: { type: String, unique: true, sparse: true, uppercase: true, trim: true, maxlength: 80 },
    qrPayload: { type: String, trim: true, maxlength: 300 },
    status: {
      type: String,
      enum: ['available', 'rented', 'reserved', 'sold', 'damaged', 'lost', 'maintenance'],
      default: 'available',
      index: true,
    },
    acquisitionPrice: { type: Number, min: 0 },
    condition: { type: conditionSchema, default: () => ({ grade: 'good' }) },
    history: { type: [copyHistorySchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

bookCopySchema.index({ book: 1, status: 1 });
bookCopySchema.index({ branch: 1, location: 1, status: 1 });

bookCopySchema.pre('validate', function setQrPayload() {
  if (!this.qrPayload && this.copyCode) this.qrPayload = `BOOKHUB:COPY:${this.copyCode}`;
  if (!this.barcode && this.copyCode) this.barcode = this.copyCode;
});

module.exports = mongoose.model('BookCopy', bookCopySchema);
