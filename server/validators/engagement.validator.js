const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Enter a valid record identifier.');

const bookActionSchema = z.object({ book: objectId });

const reviewSchema = z.object({
  book: objectId,
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  comment: z.string().trim().min(5).max(1200),
});

const updateReviewModerationSchema = z.object({
  status: z.enum(['visible', 'hidden']),
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

module.exports = { validate, bookActionSchema, reviewSchema, updateReviewModerationSchema };
