const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit');
const config = require('./config/env');
const requestContext = require('./middleware/request-context');
const notFound = require('./middleware/not-found');
const errorHandler = require('./middleware/error-handler');
const sanitizeRequest = require('./middleware/sanitize');
const apiRoutes = require('./routes');

const app = express();
const allowedOrigins = new Set([
  config.clientUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error('This origin is not allowed by BookHub CORS policy.'));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(requestContext);
app.use(sanitizeRequest);

if (config.environment !== 'test') {
  app.use(morgan(config.environment === 'production' ? 'combined' : 'dev'));
}

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' },
  }),
);

app.use('/api', apiRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
