const validator = require('validator');
const xss = require('xss');

/**
 * Sanitize string input to prevent XSS attacks
 * @param {string} input - Raw string input
 * @returns {string} Sanitized string
 */
function sanitizeString(input) {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove any HTML tags and XSS attempts
  let sanitized = xss(input, {
    whiteList: {}, // No HTML tags allowed
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style']
  });

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitize email input
 * @param {string} email - Raw email input
 * @returns {string} Normalized email
 */
function sanitizeEmail(email) {
  if (typeof email !== 'string') {
    return email;
  }

  // Normalize and sanitize email
  let sanitized = validator.normalizeEmail(email, {
    all_lowercase: true,
    gmail_remove_dots: false,
    gmail_remove_subaddress: false
  });

  return sanitized || email.toLowerCase().trim();
}

/**
 * Sanitize numeric input
 * @param {any} input - Raw numeric input
 * @returns {number|null} Sanitized number or null
 */
function sanitizeNumber(input) {
  if (input === null || input === undefined || input === '') {
    return null;
  }

  const num = Number(input);
  if (isNaN(num)) {
    return null;
  }

  return num;
}

/**
 * Sanitize boolean input
 * @param {any} input - Raw boolean input
 * @returns {boolean} Sanitized boolean
 */
function sanitizeBoolean(input) {
  if (typeof input === 'boolean') {
    return input;
  }

  if (typeof input === 'string') {
    return input.toLowerCase() === 'true';
  }

  return Boolean(input);
}

/**
 * Sanitize date input
 * @param {any} input - Raw date input
 * @returns {Date|null} Sanitized date or null
 */
function sanitizeDate(input) {
  if (!input) {
    return null;
  }

  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }

  const date = new Date(input);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Sanitize object by applying sanitization to all string values
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      sanitized[key] = value;
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizeString(item) :
        typeof item === 'object' ? sanitizeObject(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize CPT code (5-digit numeric code)
 * @param {string} code - CPT code
 * @returns {string|null} Sanitized CPT code or null
 */
function sanitizeCPTCode(code) {
  if (typeof code !== 'string') {
    return null;
  }

  const sanitized = code.trim();

  // CPT codes are 5-digit numeric codes
  if (!/^\d{5}$/.test(sanitized)) {
    return null;
  }

  return sanitized;
}

/**
 * Validate and sanitize ICD-10 code
 * @param {string} code - ICD-10 code
 * @returns {string|null} Sanitized ICD-10 code or null
 */
function sanitizeICD10Code(code) {
  if (typeof code !== 'string') {
    return null;
  }

  const sanitized = code.trim().toUpperCase();

  // ICD-10 codes: Letter followed by 2-7 alphanumeric characters
  if (!/^[A-Z]\d{2}(\.\d{1,4})?$/.test(sanitized)) {
    return null;
  }

  return sanitized;
}

/**
 * Validate and sanitize member ID (alphanumeric with optional hyphens)
 * @param {string} memberId - Member ID
 * @returns {string|null} Sanitized member ID or null
 */
function sanitizeMemberId(memberId) {
  if (typeof memberId !== 'string') {
    return null;
  }

  const sanitized = memberId.trim().toUpperCase();

  // Allow alphanumeric and hyphens, 3-20 characters
  if (!/^[A-Z0-9-]{3,20}$/.test(sanitized)) {
    return null;
  }

  return sanitized;
}

/**
 * Validate and sanitize NPI (National Provider Identifier)
 * @param {string} npi - NPI number
 * @returns {string|null} Sanitized NPI or null
 */
function sanitizeNPI(npi) {
  if (typeof npi !== 'string') {
    return null;
  }

  const sanitized = npi.trim();

  // NPI is a 10-digit number
  if (!/^\d{10}$/.test(sanitized)) {
    return null;
  }

  return sanitized;
}

module.exports = {
  sanitizeString,
  sanitizeEmail,
  sanitizeNumber,
  sanitizeBoolean,
  sanitizeDate,
  sanitizeObject,
  sanitizeCPTCode,
  sanitizeICD10Code,
  sanitizeMemberId,
  sanitizeNPI
};
