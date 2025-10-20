const Joi = require('joi');

/**
 * Environment variable validation schema
 * Ensures all required environment variables are present and valid
 */
const envSchema = Joi.object({
  // Node environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Server configuration
  PORT: Joi.number()
    .port()
    .default(3000),

  // Database configuration
  DATABASE_URL: Joi.string()
    .uri()
    .required()
    .messages({
      'any.required': 'DATABASE_URL is required. Example: postgresql://user:password@localhost:5432/dbname',
      'string.uri': 'DATABASE_URL must be a valid database connection URI'
    }),

  // Session configuration
  SESSION_SECRET: Joi.string()
    .min(32)
    .required()
    .messages({
      'any.required': 'SESSION_SECRET is required for secure session management',
      'string.min': 'SESSION_SECRET must be at least 32 characters for security'
    }),

  // Logging configuration
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'debug')
    .default('info'),

  ENABLE_FILE_LOGGING: Joi.string()
    .valid('true', 'false')
    .default('false'),

  // Frontend CORS origins (comma-separated list)
  CORS_ORIGINS: Joi.string()
    .default('http://localhost:5173,http://localhost:5174'),

  // Rate limiting (optional overrides)
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .positive()
    .default(900000), // 15 minutes

  RATE_LIMIT_MAX_REQUESTS: Joi.number()
    .positive()
    .integer()
    .default(100),

  AUTH_RATE_LIMIT_MAX: Joi.number()
    .positive()
    .integer()
    .default(5),

  // Security settings
  ENABLE_HELMET: Joi.string()
    .valid('true', 'false')
    .default('true'),

  // Optional: External service URLs
  SENTRY_DSN: Joi.string().uri().optional(),
  REDIS_URL: Joi.string().uri().optional()
})
  .unknown(true) // Allow other environment variables
  .messages({
    'object.unknown': 'Unknown environment variable: {{#label}}'
  });

/**
 * Validate environment variables on application startup
 * @returns {Object} Validated environment variables
 * @throws {Error} If validation fails
 */
function validateEnv() {
  const { error, value } = envSchema.validate(process.env, {
    abortEarly: false, // Return all errors
    stripUnknown: false // Keep all env vars
  });

  if (error) {
    const errorMessages = error.details
      .map(detail => `  - ${detail.message}`)
      .join('\n');

    console.error('❌ Environment variable validation failed:\n');
    console.error(errorMessages);
    console.error('\n💡 Tip: Check your .env file or see .env.example for required variables\n');

    throw new Error('Invalid environment configuration');
  }

  // Warn about production defaults in production mode
  if (value.NODE_ENV === 'production') {
    const warnings = [];

    if (value.SESSION_SECRET.includes('change-in-production')) {
      warnings.push('SESSION_SECRET appears to be using a default value');
    }

    if (value.DATABASE_URL.includes('localhost')) {
      warnings.push('DATABASE_URL is pointing to localhost in production');
    }

    if (value.LOG_LEVEL === 'debug') {
      warnings.push('LOG_LEVEL is set to "debug" - consider using "info" or "warn" in production');
    }

    if (warnings.length > 0) {
      console.warn('⚠️  Production environment warnings:');
      warnings.forEach(warning => console.warn(`  - ${warning}`));
      console.warn('');
    }
  }

  return value;
}

/**
 * Get a strongly-typed configuration object
 * @returns {Object} Configuration object with type-safe values
 */
function getConfig() {
  const env = validateEnv();

  return {
    // Server
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
    isTest: env.NODE_ENV === 'test',

    // Database
    databaseUrl: env.DATABASE_URL,

    // Session
    sessionSecret: env.SESSION_SECRET,

    // Logging
    logLevel: env.LOG_LEVEL,
    enableFileLogging: env.ENABLE_FILE_LOGGING === 'true' || env.NODE_ENV === 'production',

    // CORS
    corsOrigins: env.CORS_ORIGINS.split(',').map(origin => origin.trim()),

    // Rate limiting
    rateLimit: {
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
      authMaxRequests: env.AUTH_RATE_LIMIT_MAX
    },

    // Security
    enableHelmet: env.ENABLE_HELMET === 'true',

    // Optional services
    sentryDsn: env.SENTRY_DSN,
    redisUrl: env.REDIS_URL
  };
}

module.exports = {
  validateEnv,
  getConfig
};
