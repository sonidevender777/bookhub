const mongoose = require('mongoose');
const slugify = require('../utils/slug');

const coverSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true, maxlength: 500 },
    altText: { type: String, trim: true, maxlength: 200 },
  },
  { _id: false },
);

const rentalOptionSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    price: { type: Number, min: 0 },
    durationDays: { type: Number, min: 1, max: 365 },
  },
  { _id: false },
);

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 240 },
    subtitle: { type: String, trim: true, maxlength: 240 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    isbn10: { type: String, trim: true, maxlength: 10, sparse: true },
    isbn13: { type: String, trim: true, maxlength: 13, sparse: true },
    authors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Author', required: true }],
    publisher: { type: mongoose.Schema.Types.ObjectId, ref: 'Publisher' },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    genres: [{ type: String, trim: true, maxlength: 80 }],
    language: { type: String, default: 'English', trim: true, maxlength: 50 },
    publicationDate: { type: Date },
    pageCount: { type: Number, min: 1, max: 10000 },
    description: { type: String, required: true, trim: true, minlength: 20, maxlength: 6000 },
    cover: { type: coverSchema, default: () => ({}) },
    purchasePrice: { type: Number, required: true, min: 0 },
    physicalRental: { type: rentalOptionSchema, default: () => ({ enabled: false }) },
    digitalRental: { type: rentalOptionSchema, default: () => ({ enabled: false, durationDays: 14 }) },
    digitalFormat: { type: String, enum: ['pdf'], default: 'pdf' },
    digitalAssetKey: { type: String, trim: true, maxlength: 500, select: false },
    physicalEnabled: { type: Boolean, default: true },
    digitalEnabled: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
    tags: [{ type: String, trim: true, maxlength: 50 }],
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    popularityScore: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

bookSchema.index({ title: 'text', subtitle: 'text', isbn10: 'text', isbn13: 'text', genres: 'text' });
bookSchema.index({ isActive: 1, isArchived: 1, featured: 1, createdAt: -1 });
bookSchema.index({ categories: 1, isActive: 1, isArchived: 1 });
bookSchema.index({ authors: 1, isActive: 1, isArchived: 1 });

bookSchema.pre('validate', function setSlug() {
  if (this.isModified('title') && !this.isModified('slug')) this.slug = slugify(this.title);
});

bookSchema.set('toJSON', {
  transform: (document, returned) => {
    delete returned.digitalAssetKey;
    delete returned.__v;
    return returned;
  },
});

module.exports = mongoose.model('Book', bookSchema);
