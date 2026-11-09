const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Enter a valid record identifier.');

const addCartItemSchema = z.object({
  book: objectId,
  itemType: z.enum(['purchase', 'physical_rental', 'digital_rental']),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
});

const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(20),
});

const checkoutSchema = z.object({
  fulfillmentMethod: z.enum(['store_pickup', 'delivery']).default('store_pickup'),
  address: z
    .object({
      fullName: z.string().trim().min(2).max(80).optional(),
      phone: z.string().trim().max(20).optional(),
      line1: z.string().trim().max(120).optional(),
      line2: z.string().trim().max(120).optional(),
      city: z.string().trim().max(80).optional(),
      state: z.string().trim().max(80).optional(),
      postalCode: z.string().trim().max(16).optional(),
    })
    .optional(),
  notes: z.string().trim().max(600).optional(),
});

const updateOrderStatusSchema = z.object({
  orderStatus: z.enum(['pending', 'confirmed', 'processing', 'ready', 'completed', 'cancelled', 'refunded']),
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

module.exports = { validate, addCartItemSchema, updateCartItemSchema, checkoutSchema, updateOrderStatusSchema };
