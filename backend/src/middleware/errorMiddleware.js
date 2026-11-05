import { config } from '../config/env.js';

/**
 * 404 Route Not Found Middleware
 */
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Global Centralized Error Handling Middleware
 */
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);

  const responsePayload = {
    success: false,
    message,
    ...(err.errors && { errors: err.errors }),
    ...(!config.isProduction && { stack: err.stack }),
  };

  res.status(statusCode).json(responsePayload);
}

