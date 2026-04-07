// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  // Default error response
  let error = {
    error: 'Internal server error',
    message: 'Something went wrong',
    status: 500
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error.status = 400;
    error.error = 'Validation error';
    error.details = err.details;
  } else if (err.name === 'CastError') {
    error.status = 400;
    error.error = 'Invalid data format';
    error.message = 'Invalid ID or data format provided';
  } else if (err.code === 11000) {
    error.status = 409;
    error.error = 'Duplicate entry';
    error.message = 'A record with this value already exists';
  } else if (err.message && err.message.includes('not found')) {
    error.status = 404;
    error.error = 'Resource not found';
    error.message = err.message;
  } else if (err.message) {
    // Custom error messages
    error.status = 400;
    error.error = 'Request failed';
    error.message = err.message;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
  }

  res.status(error.status).json(error);
};

// 404 handler for undefined routes
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    available_endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        profile: 'GET /api/auth/profile'
      },
      users: {
        list: 'GET /api/users',
        get: 'GET /api/users/:id',
        update: 'PUT /api/users/:id',
        delete: 'DELETE /api/users/:id'
      },
      records: {
        list: 'GET /api/records',
        create: 'POST /api/records',
        get: 'GET /api/records/:id',
        update: 'PUT /api/records/:id',
        delete: 'DELETE /api/records/:id'
      },
      dashboard: {
        summary: 'GET /api/dashboard/summary',
        analytics: 'GET /api/dashboard/analytics'
      }
    }
  });
};

// Async error wrapper for route handlers
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
    
    if (req.user) {
      console.log(`${log} (User: ${req.user.username})`);
    } else {
      console.log(log);
    }
  });
  
  next();
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  requestLogger
};
