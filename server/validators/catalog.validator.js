const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Enter a valid record identifier.');
const url = z.string().url('Enter a valid URL.').max(500);

const referenceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(140).optional(),
  description: z.string().trim().max(3000).optional(),
  imageUrl: url.optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  website: z.string().url().max(300).optional(),
  biography: z.string().trim().max(3000).optional(),
  isActive: z.boolean().optional(),
});

const rentalOption = z.object({
  enabled: z.boolean(),
  price: z.coerce.number().min(0).optional(),
  durationDays: z.coerce.number().int().min(1).max(365).optional(),
});

const bookSchema = z.object({
  title: z.string().trim().min(1).max(240),
  subtitle: z.string().trim().max(240).optional(),
  slug: z.string().trim().min(2).max(260).optional(),
  isbn10: z.string().trim().regex(/^[0-9X-]{10,13}$/i).optional(),
  isbn13: z.string().trim().regex(/^[0-9-]{13,17}$/).optional(),
  authors: z.array(objectId).min(1),
  publisher: objectId.optional(),
  categories: z.array(objectId).max(8).default([]),
  genres: z.array(z.string().trim().min(2).max(80)).max(10).default([]),
  language: z.string().trim().min(2).max(50).default('English'),
  publicationDate: z.coerce.date().optional(),
  pageCount: z.coerce.number().int().min(1).max(10000).optional(),
  description: z.string().trim().min(20).max(6000),
  cover: z.object({ url: url.optional(), altText: z.string().trim().max(200).optional() }).optional(),
  purchasePrice: z.coerce.number().min(0),
  physicalRental: rentalOption.optional(),
  digitalRental: rentalOption.optional(),
  digitalFormat: z.literal('pdf').optional(),
  digitalAssetKey: z.string().trim().max(500).optional(),
  physicalEnabled: z.boolean().optional(),
  digitalEnabled: z.boolean().optional(),
  featured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string().trim().min(2).max(50)).max(20).default([]),
});

const updateBookSchema = bookSchema.partial();

const querySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(140).optional(),
  author: z.string().trim().max(140).optional(),
  publisher: z.string().trim().max(140).optional(),
  genre: z.string().trim().max(80).optional(),
  format: z.enum(['physical', 'digital']).optional(),
  featured: z.enum(['true', 'false']).optional(),
  sort: z.enum(['newest', 'digital_first', 'price_asc', 'price_desc', 'rating', 'popular']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({
      success: false,
      message: 'Please correct the highlighted fields.',
      errors: result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
      requestId: req.requestId,
    });
  }
  req.validatedBody = result.data;
  next();
};

module.exports = { validate, referenceSchema, bookSchema, updateBookSchema, querySchema };
