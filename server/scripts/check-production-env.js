const config = require('../config/env');

const checks = [
  {
    label: 'NODE_ENV is production',
    pass: config.environment === 'production',
    hint: 'Set NODE_ENV=production on the backend host.',
  },
  {
    label: 'MongoDB URI is configured',
    pass: Boolean(config.mongoUri),
    hint: 'Set MONGODB_URI to your MongoDB Atlas BookHub database connection string.',
  },
  {
    label: 'Client URL is configured',
    pass: Boolean(config.clientUrl) && !config.clientUrl.includes('localhost'),
    hint: 'Set CLIENT_URL to the deployed frontend URL, not localhost.',
  },
  {
    label: 'JWT access secret is strong',
    pass: Boolean(config.jwt.accessSecret) && config.jwt.accessSecret.length >= 32 && !config.jwt.accessSecret.includes('replace_with'),
    hint: 'Use a unique random JWT_ACCESS_SECRET of at least 32 characters.',
  },
  {
    label: 'JWT refresh secret is strong and different',
    pass:
      Boolean(config.jwt.refreshSecret)
      && config.jwt.refreshSecret.length >= 32
      && !config.jwt.refreshSecret.includes('replace_with')
      && config.jwt.refreshSecret !== config.jwt.accessSecret,
    hint: 'Use a unique JWT_REFRESH_SECRET different from the access secret.',
  },
  {
    label: 'Demo payment mode is explicit',
    pass: typeof config.demoPaymentMode === 'boolean',
    hint: 'Set DEMO_PAYMENT_MODE=true for college demo mode. Use false only after adding a real gateway.',
  },
];

let failed = false;

console.log('BookHub production readiness check\n');

checks.forEach((check) => {
  if (check.pass) {
    console.log(`✓ ${check.label}`);
    return;
  }

  failed = true;
  console.error(`✗ ${check.label}`);
  console.error(`  ${check.hint}`);
});

if (failed) {
  process.exitCode = 1;
} else {
  console.log('\nProduction environment settings look ready.');
}
