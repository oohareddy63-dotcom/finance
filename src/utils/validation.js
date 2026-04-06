const Joi = require('joi');

// User validation schemas
const userSchemas = {
  create: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('viewer', 'analyst', 'admin').optional()
  }),

  update: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).optional(),
    email: Joi.string().email().optional(),
    role: Joi.string().valid('viewer', 'analyst', 'admin').optional(),
    status: Joi.string().valid('active', 'inactive').optional()
  }).min(1),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  changePassword: Joi.object({
    current_password: Joi.string().required(),
    new_password: Joi.string().min(6).required()
  })
};

// Financial record validation schemas
const financialRecordSchemas = {
  create: Joi.object({
    amount: Joi.number().positive().required(),
    type: Joi.string().valid('income', 'expense').required(),
    category: Joi.string().min(1).max(50).required(),
    date: Joi.date().iso().required(),
    description: Joi.string().max(500).optional().allow(''),
    tags: Joi.array().items(Joi.string().max(30)).optional()
  }),

  update: Joi.object({
    amount: Joi.number().positive().optional(),
    type: Joi.string().valid('income', 'expense').optional(),
    category: Joi.string().min(1).max(50).optional(),
    date: Joi.date().iso().optional(),
    description: Joi.string().max(500).optional().allow(''),
    tags: Joi.array().items(Joi.string().max(30)).optional()
  }).min(1),

  filters: Joi.object({
    user_id: Joi.string().optional(),
    type: Joi.string().valid('income', 'expense').optional(),
    category: Joi.string().optional(),
    date_from: Joi.date().iso().optional(),
    date_to: Joi.date().iso().optional(),
    min_amount: Joi.number().positive().optional(),
    max_amount: Joi.number().positive().optional(),
    limit: Joi.number().integer().positive().max(100).optional(),
    offset: Joi.number().integer().min(0).optional()
  })
};

// Query parameter validation
const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().positive().max(100).default(10),
    sort: Joi.string().optional(),
    order: Joi.string().valid('asc', 'desc').default('desc')
  })
};

// Validation middleware factory
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'query' ? req.query : 
                 source === 'params' ? req.params : 
                 req.body;

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    // Replace the request data with validated and sanitized data
    if (source === 'query') {
      req.query = value;
    } else if (source === 'params') {
      req.params = value;
    } else {
      req.body = value;
    }

    next();
  };
};

// Custom validation functions
const validateDateRange = (req, res, next) => {
  const { date_from, date_to } = req.query;
  
  if (date_from && date_to) {
    const from = new Date(date_from);
    const to = new Date(date_to);
    
    if (from > to) {
      return res.status(400).json({
        error: 'Validation failed',
        details: [{
          field: 'date_range',
          message: 'date_from must be before or equal to date_to'
        }]
      });
    }
  }
  
  next();
};

const validatePositiveAmount = (req, res, next) => {
  const { amount } = req.body;
  
  if (amount <= 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: [{
        field: 'amount',
        message: 'Amount must be positive'
      }]
    });
  }
  
  next();
};

module.exports = {
  userSchemas,
  financialRecordSchemas,
  querySchemas,
  validate,
  validateDateRange,
  validatePositiveAmount
};
