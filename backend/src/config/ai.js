/**
 * AI Configuration
 * Centralized configuration for AI-powered claim categorization
 */

const config = {
  // Anthropic API settings
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: process.env.AI_CATEGORIZATION_MODEL || 'claude-3-5-sonnet-20241022',
  maxTokens: parseInt(process.env.AI_CATEGORIZATION_MAX_TOKENS) || 500,

  // Performance settings
  timeout: parseInt(process.env.AI_CATEGORIZATION_TIMEOUT) || 5000, // 5 seconds
  retryAttempts: parseInt(process.env.AI_CATEGORIZATION_RETRY_ATTEMPTS) || 0, // No retries by default

  // Feature flags
  enabled: process.env.AI_CATEGORIZATION_ENABLED !== 'false',

  // Thresholds for cost-based categorization (fallback if AI unavailable)
  costThresholds: {
    urgent: 5000, // Claims over $5,000
    routine: 500  // Claims under $500
  }
};

/**
 * Validate AI configuration
 * @returns {Object} Validation result
 */
function validateConfig() {
  const warnings = [];
  const errors = [];

  if (!config.enabled) {
    warnings.push('AI categorization is disabled');
  }

  if (!config.apiKey) {
    errors.push('ANTHROPIC_API_KEY is not configured');
  }

  if (config.timeout < 1000 || config.timeout > 30000) {
    warnings.push(`AI timeout is ${config.timeout}ms (recommended: 2000-10000ms)`);
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
    config
  };
}

/**
 * Get fallback priority based on cost alone
 * @param {number} billedAmount - Claim amount
 * @returns {string} Priority level
 */
function getFallbackPriority(billedAmount) {
  if (billedAmount >= config.costThresholds.urgent) {
    return 'URGENT';
  } else if (billedAmount < config.costThresholds.routine) {
    return 'ROUTINE';
  } else {
    return 'STANDARD';
  }
}

module.exports = {
  ...config,
  validateConfig,
  getFallbackPriority
};
