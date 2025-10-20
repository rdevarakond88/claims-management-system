const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { logger } = require('../utils/logger');

/**
 * Global rate limiter for all API endpoints
 * Prevents abuse by limiting requests per IP
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.'
    }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('user-agent')
    });
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.'
      }
    });
  }
});

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks on login/password endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again after 15 minutes.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email,
      path: req.path,
      userAgent: req.get('user-agent')
    });
    res.status(429).json({
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts, please try again after 15 minutes.'
      }
    });
  }
});

/**
 * Speed limiter - slows down responses for repeated requests
 * Helps prevent rapid-fire attacks without completely blocking
 */
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per 15 minutes, then...
  delayMs: (hits) => hits * 100, // Add 100ms of delay per request after delayAfter
  maxDelayMs: 5000, // Maximum delay of 5 seconds
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

/**
 * Admin operations rate limiter
 * Stricter limits for sensitive admin operations
 */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit admin operations to 30 per window
  message: {
    error: {
      code: 'ADMIN_RATE_LIMIT_EXCEEDED',
      message: 'Too many admin operations, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Admin rate limit exceeded', {
      ip: req.ip,
      userId: req.session?.userId,
      path: req.path,
      userAgent: req.get('user-agent')
    });
    res.status(429).json({
      error: {
        code: 'ADMIN_RATE_LIMIT_EXCEEDED',
        message: 'Too many admin operations, please try again later.'
      }
    });
  }
});

module.exports = {
  globalLimiter,
  authLimiter,
  speedLimiter,
  adminLimiter
};
