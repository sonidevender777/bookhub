const { z } = require('zod');

const password = z
  .string()
  .min(8, 'Password must contain at least 8 characters.')
  .max(128, 'Password is too long.')
  .regex(/[a-z]/, 'Password must include a lowercase letter.')
  .regex(/[A-Z]/, 'Password must include an uppercase letter.')
  .regex(/[0-9]/, 'Password must include a number.');

const email = z.string().trim().toLowerCase().email('Enter a valid email address.').max(160);
const phone = z.string().trim().min(7).max(20).optional();

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email,
  password,
  phone,
});

const loginSchema = z.object({ email, password: z.string().min(1).max(128) });
const forgotPasswordSchema = z.object({ email });
const resetPasswordSchema = z.object({ token: z.string().length(64), password });
const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: password });

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(80).optional(),
  phone,
  avatarUrl: z.string().url().max(500).optional(),
  addresses: z
    .array(
      z.object({
        label: z.string().trim().max(40).optional(),
        line1: z.string().trim().min(2).max(120),
        line2: z.string().trim().max(120).optional(),
        city: z.string().trim().min(2).max(80),
        state: z.string().trim().min(2).max(80),
        postalCode: z.string().trim().min(4).max(16),
        isDefault: z.boolean().optional(),
      }),
    )
    .max(10)
    .optional(),
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
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
};
