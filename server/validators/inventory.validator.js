const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Enter a valid record identifier.');

const branchSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(140).optional(),
  code: z.string().trim().min(2).max(20).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email().max(160).optional(),
  address: z
    .object({
      line1: z.string().trim().max(120).optional(),
      line2: z.string().trim().max(120).optional(),
      city: z.string().trim().max(80).optional(),
      state: z.string().trim().max(80).optional(),
      country: z.string().trim().max(80).optional(),
      postalCode: z.string().trim().max(16).optional(),
    })
    .optional(),
  isActive: z.boolean().optional(),
});

const locationSchema = z.object({
  branch: objectId,
  floor: z.string().trim().min(1).max(80),
  section: z.string().trim().min(1).max(80),
  rack: z.string().trim().min(1).max(40),
  shelf: z.string().trim().min(1).max(40),
  notes: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
});

const conditionSchema = z.object({
  grade: z.enum(['new', 'excellent', 'good', 'fair', 'poor', 'damaged']).default('good'),
  notes: z.string().trim().max(500).optional(),
});

const bookCopySchema = z.object({
  book: objectId,
  branch: objectId,
  location: objectId,
  copyCode: z.string().trim().min(2).max(40),
  barcode: z.string().trim().max(80).optional(),
  status: z.enum(['available', 'rented', 'reserved', 'sold', 'damaged', 'lost', 'maintenance']).default('available'),
  acquisitionPrice: z.coerce.number().min(0).optional(),
  condition: conditionSchema.optional(),
});

const updateCopySchema = z.object({
  status: z.enum(['available', 'rented', 'reserved', 'sold', 'damaged', 'lost', 'maintenance']).optional(),
  condition: conditionSchema.optional(),
  note: z.string().trim().max(500).optional(),
});

const moveCopySchema = z.object({
  location: objectId,
  note: z.string().trim().max(500).optional(),
});

const inventoryQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  book: objectId.optional(),
  branch: objectId.optional(),
  location: objectId.optional(),
  status: z.enum(['available', 'rented', 'reserved', 'sold', 'damaged', 'lost', 'maintenance']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
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

module.exports = {
  validate,
  branchSchema,
  locationSchema,
  bookCopySchema,
  updateCopySchema,
  moveCopySchema,
  inventoryQuerySchema,
};
