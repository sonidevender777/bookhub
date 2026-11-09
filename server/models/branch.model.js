const mongoose = require('mongoose');
const slugify = require('../utils/slug');

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 20 },
    phone: { type: String, trim: true, maxlength: 20 },
    email: { type: String, trim: true, lowercase: true, maxlength: 160 },
    address: {
      line1: { type: String, trim: true, maxlength: 120 },
      line2: { type: String, trim: true, maxlength: 120 },
      city: { type: String, trim: true, maxlength: 80, default: 'Rewari' },
      state: { type: String, trim: true, maxlength: 80, default: 'Haryana' },
      country: { type: String, trim: true, maxlength: 80, default: 'India' },
      postalCode: { type: String, trim: true, maxlength: 16 },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

branchSchema.pre('validate', function setSlugAndCode() {
  if (this.isModified('name') && !this.isModified('slug')) this.slug = slugify(this.name);
  if (this.isModified('name') && !this.isModified('code')) {
    this.code = slugify(this.name).replace(/-/g, '_').slice(0, 20).toUpperCase();
  }
});

module.exports = mongoose.model('Branch', branchSchema);
