/**
 * Global Error Handling Middleware
 * Converts uncaught exceptions and Mongoose errors into consistent JSON responses
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error encountered:', err);

  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Internal Server Error';
  let details = null;

  // Handle SyntaxError (e.g. Malformed JSON payload)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON in request body.';
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Database validation failed.';
    details = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message
    }));
  }

  // Handle Mongoose CastError (e.g., bad ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found with invalid ${err.path}: "${err.value}".`;
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered for "${field}". Please use another value.`;
  }

  res.status(statusCode).json({
    success: false,
    error: err.name || 'ServerError',
    message,
    details: details || undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
