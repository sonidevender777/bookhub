const mongoose = require('mongoose');
const config = require('../config/env');
const User = require('../models/user.model');

const seedAdmin = async () => {
  if (!config.mongoUri) throw new Error('MONGODB_URI is required before admin data can be seeded.');
  await mongoose.connect(config.mongoUri);

  const email = process.env.SEED_ADMIN_EMAIL || 'owner@bookhub.test';
  const password = process.env.SEED_ADMIN_PASSWORD || 'OwnerPass123';
  const fullName = process.env.SEED_ADMIN_NAME || 'BookHub Owner';
  const existing = await User.findOne({ email }).select('+password');
  if (existing) {
    existing.fullName = fullName;
    existing.email = email;
    existing.password = password;
    existing.role = 'owner';
    existing.accountStatus = 'active';
    await existing.save();
    console.info(`Updated owner account: ${email}`);
    return;
  }

  await User.create({
    fullName,
    email,
    password,
    role: 'owner',
  });
  console.info(`Created owner account: ${email}`);
};

seedAdmin()
  .catch((error) => {
    console.error(`Admin seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
