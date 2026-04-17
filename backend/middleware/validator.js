const Joi = require('joi');
const ApiError = require('../utils/ApiError');

/**
 * Input Validation Middleware using Joi
 *
 * Creates reusable validation middleware for request body, query, and params.
 * Returns 400 with details if validation fails.
 */

/**
 * Create a validation middleware for the given Joi schema.
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {'body'|'query'|'params'} source - Where to validate (default: 'body')
 * @returns {Function} Express middleware
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false, // Collect all errors
      stripUnknown: true, // Remove unknown fields
      allowUnknown: false,
    });

    if (error) {
      const errorDetails = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
      }));

      throw ApiError.badRequest(
        `Validation failed: ${errorDetails.map((e) => e.message).join(', ')}`
      );
    }

    // Replace with sanitized values
    req[source] = value;
    next();
  };
};

// ── Pre-built validation schemas ──────────────────────────────────────

const schemas = {
  // Search query validation
  searchQuery: Joi.object({
    q: Joi.string().trim().min(1).max(200).required().messages({
      'string.empty': 'Search query cannot be empty',
      'string.min': 'Search query must be at least 1 character',
      'string.max': 'Search query must be at most 200 characters',
      'any.required': 'Search query is required',
    }),
  }),

  // History keyword validation
  historyKeyword: Joi.object({
    keyword: Joi.string().trim().min(1).max(200).required().messages({
      'string.empty': 'Keyword cannot be empty',
      'string.min': 'Keyword must be at least 1 character',
      'string.max': 'Keyword must be at most 200 characters',
      'any.required': 'Keyword is required',
    }),
  }),

  // MongoDB ObjectId validation
  objectId: Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid ID format',
        'any.required': 'ID is required',
      }),
  }),
};

module.exports = {
  validate,
  schemas,
};
