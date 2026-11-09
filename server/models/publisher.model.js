const mongoose = require('mongoose');
const slugify = require('../utils/slug');

const publisherSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 1000 },
    website: { type: String, trim: true, maxlength: 300 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

publisherSchema.index({ name: 1 }, { unique: true });
publisherSchema.pre('validate', function setSlug() {
  if (this.isModified('name') && !this.isModified('slug')) this.slug = slugify(this.name);
});

module.exports = mongoose.model('Publisher', publisherSchema);
