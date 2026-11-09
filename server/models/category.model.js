const mongoose = require('mongoose');
const slugify = require('../utils/slug');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 600 },
    imageUrl: { type: String, trim: true, maxlength: 500 },
    sortOrder: { type: Number, min: 0, max: 9999, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ isActive: 1, sortOrder: 1, name: 1 });
categorySchema.pre('validate', function setSlug() {
  if (this.isModified('name') && !this.isModified('slug')) this.slug = slugify(this.name);
});

module.exports = mongoose.model('Category', categorySchema);
