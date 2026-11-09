const { z } = require('zod');

const conditionSchema = z.object({
  grade: z.enum(['new', 'excellent', 'good', 'fair', 'poor', 'damaged']).default('good'),
  notes: z.string().trim().max(500).optional(),
});

const returnRentalSchema = z.object({
  conditionAfter: conditionSchema.default({ grade: 'good' }),
  notes: z.string().trim().max(700).optional(),
});

const markRentalIssueSchema = z.object({
  status: z.enum(['lost', 'damaged']),
  notes: z.string().trim().max(700).optional(),
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

module.exports = { validate, returnRentalSchema, markRentalIssueSchema };
