const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const parseBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
};

const config = {
  environment: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || '',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  demoPaymentMode: parseBoolean(process.env.DEMO_PAYMENT_MODE, true),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || '',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
};

if (config.environment === 'production') {
  const weakSecrets = [
    config.jwt.accessSecret,
    config.jwt.refreshSecret,
  ].some((secret) => !secret || secret.length < 32 || secret.includes('replace_with') || secret.includes('change_later'));

  if (weakSecrets) {
    throw new Error('Production JWT secrets must be unique random values with at least 32 characters.');
  }

  if (!config.mongoUri) {
    throw new Error('MONGODB_URI is required in production.');
  }
}

module.exports = config;
