const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    itemType: { type: String, enum: ['purchase', 'physical_rental', 'digital_rental'], required: true },
    quantity: { type: Number, min: 1, max: 20, default: 1 },
  },
  { _id: true, timestamps: true },
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Cart', cartSchema);
