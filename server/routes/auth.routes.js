const express = require('express');
const { rateLimit } = require('express-rate-limit');
const controller = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
} = require('../validators/auth.validator');

const router = express.Router();

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
});

router.post('/register', authRateLimit, validate(registerSchema), controller.register);
router.post('/login', authRateLimit, validate(loginSchema), controller.login);
router.post('/refresh', authRateLimit, controller.refresh);
router.post('/logout', controller.logout);
router.post('/forgot-password', authRateLimit, validate(forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password', authRateLimit, validate(resetPasswordSchema), controller.resetPassword);
router.get('/me', authenticate, controller.getProfile);
router.patch('/me', authenticate, validate(updateProfileSchema), controller.updateProfile);
router.patch('/change-password', authenticate, validate(changePasswordSchema), controller.changePassword);

module.exports = router;
