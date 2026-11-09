const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiError = require('./api-error');

const assertJwtSecrets = () => {
  if (!config.jwt.accessSecret || !config.jwt.refreshSecret) {
    throw new ApiError('Authentication is not configured on this server.', 503);
  }
};

const createAccessToken = (user) => {
  assertJwtSecrets();
  return jwt.sign(
    { sub: user.id, role: user.role },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiresIn },
  );
};

const createRefreshToken = (user) => {
  assertJwtSecrets();
  return jwt.sign(
    { sub: user.id, tokenId: crypto.randomUUID() },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn },
  );
};

const verifyAccessToken = (token) => jwt.verify(token, config.jwt.accessSecret);
const verifyRefreshToken = (token) => jwt.verify(token, config.jwt.refreshSecret);
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

module.exports = {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  assertJwtSecrets,
};
