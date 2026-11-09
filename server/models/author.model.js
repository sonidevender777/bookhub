const mongoose = require('mongoose');
const slugify = require('../utils/slug');

const authorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    biography: { type: String, trim: true, maxlength: 3000 },
    imageUrl: { type: String, trim: true, maxlength: 500 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

authorSchema.index({ name: 1 }, { unique: true });
authorSchema.pre('validate', function setSlug() {
  if (this.isModified('name') && !this.isModified('slug')) this.slug = slugify(this.name);
});

module.exports = mongoose.model('Author', authorSchema);
