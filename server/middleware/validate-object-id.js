const mongoose = require('mongoose');
const ApiError = require('../utils/api-error');

const validateObjectId = (...paramNames) => (req, res, next) => {
  const invalidParam = paramNames.find((paramName) => req.params[paramName] && !mongoose.isValidObjectId(req.params[paramName]));
  if (invalidParam) return next(new ApiError(`Invalid ${invalidParam}.`, 400));
  next();
};

module.exports = validateObjectId;
