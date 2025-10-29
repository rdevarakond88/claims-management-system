const Joi = require('joi');
const { logger } = require('../utils/logger');

/**
 * Validation schemas for all endpoints
 */
const schemas = {
  // Auth schemas
  login: Joi.object({
    email: Joi.string().email().required().max(255),
    password: Joi.string().required().min(1).max(255)
  }),

  setPassword: Joi.object({
    current_password: Joi.string().required().min(1).max(255),
    new_password: Joi.string()
      .required()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      }),
    confirm_password: Joi.string()
      .required()
      .valid(Joi.ref('new_password'))
      .messages({
        'any.only': 'Passwords must match'
      })
  }),

  // Admin schemas
  createUser: Joi.object({
    email: Joi.string().email().required().max(255),
    first_name: Joi.string().required().min(1).max(100).trim(),
    last_name: Joi.string().required().min(1).max(100).trim(),
    role: Joi.string().valid('provider_staff', 'payer_processor').required(),
    organization_id: Joi.string().uuid().required()
  }),

  // Claim schemas
  createClaim: Joi.object({
    patient: Joi.object({
      firstName: Joi.string().required().min(1).max(100).trim(),
      lastName: Joi.string().required().min(1).max(100).trim(),
      dateOfBirth: Joi.date().iso().max('now').required(),
      memberId: Joi.string()
        .required()
        .pattern(/^[A-Z0-9-]{3,20}$/)
        .uppercase()
        .messages({
          'string.pattern.base': 'Member ID must be 3-20 alphanumeric characters with optional hyphens'
        }),
      gender: Joi.string().valid('M', 'F', 'O', 'U').optional(),
      address: Joi.string().max(200).optional(),
      city: Joi.string().max(100).optional(),
      state: Joi.string().length(2).uppercase().optional(),
      zipCode: Joi.string().pattern(/^\d{5}(-\d{4})?$/).optional()
    }).required(),

    service: Joi.object({
      serviceDate: Joi.date().iso().max('now').required(),
      cptCode: Joi.string()
        .required()
        .pattern(/^\d{5}$/)
        .messages({
          'string.pattern.base': 'CPT code must be a 5-digit number'
        }),
      icd10Code: Joi.string()
        .required()
        .pattern(/^[A-Z]\d{2}(\.\d{1,4})?$/)
        .uppercase()
        .messages({
          'string.pattern.base': 'ICD-10 code must start with a letter followed by 2-7 digits (e.g., A01.23)'
        }),
      billedAmount: Joi.number().positive().precision(2).max(1000000).required(),
      units: Joi.number().integer().positive().max(999).default(1),
      placeOfService: Joi.string().length(2).pattern(/^\d{2}$/).optional(),
      diagnosisPointer: Joi.string().max(10).optional(),
      modifiers: Joi.array().items(Joi.string().max(10)).max(4).optional(),
      description: Joi.string().max(500).optional()
    }).required(),

    insuranceInfo: Joi.object({
      payerId: Joi.string().uuid().optional(),
      groupNumber: Joi.string().max(50).optional(),
      planName: Joi.string().max(100).optional()
    }).optional(),

    notes: Joi.string().max(1000).optional()
  }),

  adjudicateClaim: Joi.object({
    decision: Joi.string().valid('approve', 'deny').required(),
    approved_amount: Joi.number().positive().precision(2).max(1000000).when('decision', {
      is: 'approve',
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    notes: Joi.string().max(500).optional(),
    denial_reason_code: Joi.string()
      .valid(
        'INVALID_CPT',
        'INVALID_DIAGNOSIS',
        'NOT_COVERED',
        'PATIENT_INELIGIBLE',
        'DUPLICATE_CLAIM',
        'INSUFFICIENT_DOCS',
        'OTHER'
      )
      .when('decision', {
        is: 'deny',
        then: Joi.required(),
        otherwise: Joi.forbidden()
      }),
    denial_explanation: Joi.string().min(20).max(1000).when('decision', {
      is: 'deny',
      then: Joi.required(),
      otherwise: Joi.forbidden()
    })
  })
};

/**
 * Validation middleware factory
 * @param {string} schemaName - Name of the schema to validate against
 * @returns {Function} Express middleware
 */
function validate(schemaName) {
  return (req, res, next) => {
    const schema = schemas[schemaName];

    if (!schema) {
      logger.error(`Validation schema not found: ${schemaName}`);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Validation configuration error'
        }
      });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown fields
      convert: true // Type coercion (string to number, etc.)
    });

    if (error) {
      const details = {};
      error.details.forEach(detail => {
        const key = detail.path.join('.');
        details[key] = detail.message;
      });

      logger.warn('Validation error', {
        path: req.path,
        errors: details,
        ip: req.ip
      });

      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details
        }
      });
    }

    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
}

/**
 * Validate query parameters
 * @param {Object} querySchema - Joi schema for query params
 * @returns {Function} Express middleware
 */
function validateQuery(querySchema) {
  return (req, res, next) => {
    const { error, value } = querySchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const details = {};
      error.details.forEach(detail => {
        const key = detail.path.join('.');
        details[key] = detail.message;
      });

      logger.warn('Query validation error', {
        path: req.path,
        errors: details,
        ip: req.ip
      });

      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details
        }
      });
    }

    req.query = value;
    next();
  };
}

/**
 * Validate URL parameters
 * @param {Object} paramsSchema - Joi schema for URL params
 * @returns {Function} Express middleware
 */
function validateParams(paramsSchema) {
  return (req, res, next) => {
    const { error, value } = paramsSchema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = {};
      error.details.forEach(detail => {
        const key = detail.path.join('.');
        details[key] = detail.message;
      });

      logger.warn('Params validation error', {
        path: req.path,
        errors: details,
        ip: req.ip
      });

      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid URL parameters',
          details
        }
      });
    }

    req.params = value;
    next();
  };
}

// Common parameter schemas
const commonSchemas = {
  uuid: Joi.object({
    id: Joi.string().uuid().required()
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  claimStatus: Joi.object({
    status: Joi.string()
      .valid('draft', 'submitted', 'approved', 'denied', 'pending')
      .optional()
  }),

  claimFilters: Joi.object({
    status: Joi.string()
      .valid('draft', 'submitted', 'approved', 'denied', 'pending')
      .optional(),
    priority: Joi.string()
      .valid('urgent', 'standard', 'routine', 'URGENT', 'STANDARD', 'ROUTINE')
      .uppercase()
      .optional()
      .messages({
        'any.only': 'Priority must be one of: urgent, standard, routine'
      })
  }),

  userFilters: Joi.object({
    role: Joi.string().valid('admin', 'provider_staff', 'payer_processor').optional(),
    is_active: Joi.boolean().optional()
  })
};

module.exports = {
  validate,
  validateQuery,
  validateParams,
  schemas,
  commonSchemas
};
