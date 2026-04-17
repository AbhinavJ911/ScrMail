const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const logger = require('../utils/logger');

/**
 * Global Error Handler Middleware
 *
 * Catches all errors thrown in routes/middleware and sends a standardized response.
 * In development, includes error stack traces for debugging.
 * In production, hides internal error details from clients.
 */

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  const isProduction = process.env.NODE_ENV === 'production';

  // Log the error
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} → ${statusCode}: ${message}`, {
      stack: err.stack,
      body: req.body,
      params: req.params,
      query: req.query,
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} → ${statusCode}: ${message}`);
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {
    // Mongoose invalid ObjectId
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.code === 11000) {
    // Mongoose duplicate key
    statusCode = 409;
    message = 'Duplicate entry found';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // In production, hide internal error details
  if (isProduction && statusCode === 500 && !(err instanceof ApiError)) {
    message = 'Something went wrong. Please try again later.';
  }

  // Send response
  const response = {
    success: false,
    statusCode,
    message,
    timestamp: new Date().toISOString(),
  };

  // Include stack trace in development
  if (!isProduction) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

module.exports = errorHandler;
