const crypto = require('crypto');
const User = require('../models/user.model');
const ApiError = require('../utils/api-error');
const {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  hashToken,
  assertJwtSecrets,
} = require('../utils/jwt');
const config = require('../config/env');

const refreshCookieOptions = {
  httpOnly: true,
  secure: config.environment === 'production',
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const clearRefreshCookie = (res) => res.clearCookie('bookhub_refresh', refreshCookieOptions);

const pruneExpiredSessions = (sessions) => sessions.filter((session) => session.expiresAt > new Date());

const issueSession = async (user, res) => {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  const verifiedRefresh = verifyRefreshToken(refreshToken);

  user.refreshSessions = pruneExpiredSessions(user.refreshSessions || []);
  user.refreshSessions.push({
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(verifiedRefresh.exp * 1000),
  });
  await user.save();

  res.cookie('bookhub_refresh', refreshToken, refreshCookieOptions);
  return accessToken;
};

const sendSessionResponse = async (user, res, statusCode) => {
  const accessToken = await issueSession(user, res);
  res.status(statusCode).json({ success: true, data: { user, accessToken } });
};

const register = async (req, res, next) => {
  try {
    assertJwtSecrets();
    const existingUser = await User.exists({ email: req.validatedBody.email });
    if (existingUser) throw new ApiError('An account with this email already exists.', 409);

    const user = await User.create(req.validatedBody);
    await sendSessionResponse(user, res, 201);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.validatedBody.email }).select('+password +refreshSessions');
    const isPasswordValid = user && (await user.isPasswordMatch(req.validatedBody.password));

    if (!isPasswordValid || user.accountStatus !== 'active') {
      throw new ApiError('Invalid email or password.', 401);
    }

    await sendSessionResponse(user, res, 200);
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.bookhub_refresh;
    if (!refreshToken) throw new ApiError('Authentication is required.', 401);

    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.sub).select('+refreshSessions');
    const tokenHash = hashToken(refreshToken);
    const validSession = user?.refreshSessions.find(
      (session) => session.tokenHash === tokenHash && session.expiresAt > new Date(),
    );

    if (!user || user.accountStatus !== 'active' || !validSession) {
      clearRefreshCookie(res);
      throw new ApiError('Your session has expired. Please sign in again.', 401);
    }

    user.refreshSessions = user.refreshSessions.filter((session) => session.tokenHash !== tokenHash);
    await sendSessionResponse(user, res, 200);
  } catch (error) {
    clearRefreshCookie(res);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new ApiError('Your session has expired. Please sign in again.', 401));
    }
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.bookhub_refresh;
    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        const user = await User.findById(payload.sub).select('+refreshSessions');
        if (user) {
          const tokenHash = hashToken(refreshToken);
          user.refreshSessions = user.refreshSessions.filter((session) => session.tokenHash !== tokenHash);
          await user.save();
        }
      } catch (error) {
        // An invalid cookie is still cleared below.
      }
    }
    clearRefreshCookie(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const getProfile = (req, res) => res.status(200).json({ success: true, data: { user: req.user } });

const updateProfile = async (req, res, next) => {
  try {
    Object.assign(req.user, req.validatedBody);
    if (req.validatedBody.addresses) {
      const defaultCount = req.validatedBody.addresses.filter((address) => address.isDefault).length;
      if (defaultCount > 1) throw new ApiError('Only one address can be the default.', 422);
    }
    await req.user.save();
    res.status(200).json({ success: true, data: { user: req.user } });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password +refreshSessions');
    const isPasswordValid = await user.isPasswordMatch(req.validatedBody.currentPassword);
    if (!isPasswordValid) throw new ApiError('Current password is incorrect.', 401);

    user.password = req.validatedBody.newPassword;
    user.refreshSessions = [];
    await user.save();
    clearRefreshCookie(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.validatedBody.email }).select(
      '+resetPasswordTokenHash +resetPasswordExpiresAt',
    );

    if (user) {
      user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists for that email, password-reset instructions will be sent.',
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const tokenHash = crypto.createHash('sha256').update(req.validatedBody.token).digest('hex');
    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() },
    }).select('+password +refreshSessions +resetPasswordTokenHash +resetPasswordExpiresAt');

    if (!user) throw new ApiError('This password-reset link is invalid or has expired.', 400);

    user.password = req.validatedBody.password;
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpiresAt = undefined;
    user.refreshSessions = [];
    await user.save();
    clearRefreshCookie(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
