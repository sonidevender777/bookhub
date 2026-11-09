const mongoose = require('mongoose');

const addressSnapshotSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, maxlength: 80 },
    phone: { type: String, trim: true, maxlength: 20 },
    line1: { type: String, trim: true, maxlength: 120 },
    line2: { type: String, trim: true, maxlength: 120 },
    city: { type: String, trim: true, maxlength: 80 },
    state: { type: String, trim: true, maxlength: 80 },
    postalCode: { type: String, trim: true, maxlength: 16 },
  },
  { _id: false },
);

const orderItemSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    title: { type: String, required: true, trim: true, maxlength: 240 },
    itemType: { type: String, enum: ['purchase', 'physical_rental', 'digital_rental'], required: true },
    quantity: { type: Number, min: 1, max: 20, required: true },
    unitPrice: { type: Number, min: 0, required: true },
    rentalDurationDays: { type: Number, min: 1, max: 365 },
    lineTotal: { type: Number, min: 0, required: true },
  },
  { _id: true },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    fulfillmentMethod: { type: String, enum: ['store_pickup', 'delivery'], default: 'store_pickup' },
    address: { type: addressSnapshotSchema, default: () => ({}) },
    subtotal: { type: Number, min: 0, required: true },
    discountTotal: { type: Number, min: 0, default: 0 },
    taxTotal: { type: Number, min: 0, default: 0 },
    grandTotal: { type: Number, min: 0, required: true },
    paymentMode: { type: String, enum: ['demo'], default: 'demo' },
    paymentStatus: { type: String, enum: ['demo_pending', 'paid', 'failed', 'refunded'], default: 'demo_pending' },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'ready', 'completed', 'cancelled', 'refunded'],
      default: 'pending',
      index: true,
    },
    notes: { type: String, trim: true, maxlength: 600 },
  },
  { timestamps: true },
);

orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
