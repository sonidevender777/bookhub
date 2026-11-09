const User = require('../models/user.model');
const ApiError = require('../utils/api-error');
const { verifyAccessToken } = require('../utils/jwt');

const authenticate = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new ApiError('Authentication is required.', 401);
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);

    if (!user || user.accountStatus !== 'active') {
      throw new ApiError('Your account is not available.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new ApiError('Your session has expired. Please sign in again.', 401));
    }
    next(error);
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError('You do not have permission to perform this action.', 403));
  }
  next();
};

module.exports = { authenticate, authorize };
