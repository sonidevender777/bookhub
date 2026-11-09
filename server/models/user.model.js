const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, maxlength: 40 },
    line1: { type: String, trim: true, maxlength: 120 },
    line2: { type: String, trim: true, maxlength: 120 },
    city: { type: String, trim: true, maxlength: 80 },
    state: { type: String, trim: true, maxlength: 80 },
    postalCode: { type: String, trim: true, maxlength: 16 },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

const refreshSessionSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 160 },
    phone: { type: String, trim: true, maxlength: 20, sparse: true },
    password: { type: String, required: true, minlength: 8, select: false },
    avatarUrl: { type: String, trim: true, maxlength: 500 },
    role: {
      type: String,
      enum: ['customer', 'inventory_staff', 'manager', 'owner'],
      default: 'customer',
      index: true,
    },
    accountStatus: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
    addresses: { type: [addressSchema], default: [] },
    notificationPreferences: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
    },
    refreshSessions: { type: [refreshSessionSchema], default: [], select: false },
    resetPasswordTokenHash: { type: String, select: false },
    resetPasswordExpiresAt: { type: Date, select: false },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, accountStatus: 1 });

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.isPasswordMatch = function isPasswordMatch(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createPasswordResetToken = function createPasswordResetToken() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
  return resetToken;
};

userSchema.set('toJSON', {
  transform: (document, returned) => {
    delete returned.password;
    delete returned.refreshSessions;
    delete returned.resetPasswordTokenHash;
    delete returned.resetPasswordExpiresAt;
    delete returned.__v;
    return returned;
  },
});

module.exports = mongoose.model('User', userSchema);
