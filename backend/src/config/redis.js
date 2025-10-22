/**
 * Redis Configuration for Session Storage
 *
 * This module provides Redis client and session store configuration.
 * In development, sessions use memory store (no Redis required).
 * In production (Vercel), sessions use Redis for persistence across serverless functions.
 */

const redis = require('redis');
const RedisStore = require('connect-redis').default;
const { logger } = require('../utils/logger');

let redisClient = null;
let redisStore = null;

// Only initialize Redis if REDIS_URL is provided (production environment)
if (process.env.REDIS_URL) {
  try {
    logger.info('Initializing Redis client for session storage');

    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        // Enable TLS for production (Upstash, Redis Cloud, etc.)
        tls: process.env.NODE_ENV === 'production',
        rejectUnauthorized: false,
        // Reconnect strategy
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis: Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          // Exponential backoff: 50ms, 100ms, 200ms, ...
          const delay = Math.min(retries * 50, 3000);
          logger.warn(`Redis: Reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        }
      },
      // Connection timeout
      connectTimeout: 10000,
    });

    // Redis event handlers
    redisClient.on('error', (err) => {
      logger.error('Redis client error:', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected successfully');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready to accept commands');
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis client reconnecting...');
    });

    redisClient.on('end', () => {
      logger.warn('Redis client connection closed');
    });

    // Connect to Redis (async operation)
    redisClient.connect()
      .then(() => {
        logger.info('Redis connection established');
      })
      .catch((err) => {
        logger.error('Failed to connect to Redis:', { error: err.message });
        // Don't throw - allow app to start with memory sessions
      });

    // Create Redis session store
    redisStore = new RedisStore({
      client: redisClient,
      prefix: 'cms:sess:', // Prefix all session keys
      ttl: 1800, // 30 minutes (in seconds)
      disableTouch: false, // Update session expiry on access
      disableTTL: false, // Use TTL for session expiration
    });

    logger.info('Redis session store configured');

  } catch (error) {
    logger.error('Error initializing Redis:', { error: error.message });
    // Don't throw - allow app to continue with memory sessions
    redisClient = null;
    redisStore = null;
  }
} else {
  logger.info('REDIS_URL not provided - using in-memory session store (development mode)');
}

/**
 * Graceful shutdown handler for Redis
 */
const closeRedis = async () => {
  if (redisClient && redisClient.isOpen) {
    try {
      logger.info('Closing Redis connection...');
      await redisClient.quit();
      logger.info('Redis connection closed successfully');
    } catch (error) {
      logger.error('Error closing Redis connection:', { error: error.message });
      // Force close if quit fails
      try {
        await redisClient.disconnect();
      } catch (disconnectError) {
        logger.error('Error disconnecting Redis:', { error: disconnectError.message });
      }
    }
  }
};

// Handle process termination
process.on('SIGTERM', closeRedis);
process.on('SIGINT', closeRedis);

module.exports = {
  redisClient,
  redisStore,
  closeRedis
};
