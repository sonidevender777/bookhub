const errorHandler = (error, req, res, next) => {
  const isDuplicateKey = error.code === 11000;
  const statusCode = error.statusCode || (error.name === 'CastError' ? 400 : isDuplicateKey ? 409 : 500);
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500 && isProduction
        ? 'Something went wrong.'
        : isDuplicateKey
          ? 'A record with this value already exists.'
          : error.message,
    requestId: req.requestId,
  });
};

module.exports = errorHandler;
