const logger = require('../utils/logger');

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: `Resource not found: ${req.method} ${req.originalUrl}`
  });
};

const globalErrorHandler = (err, req, res, next) => {
  logger.error(`Unhandled Error [${req.method} ${req.originalUrl}]:`, err.stack || err.message);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  notFoundHandler,
  globalErrorHandler
};

