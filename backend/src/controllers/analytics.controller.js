const analyticsService = require('../services/analytics.service');
const { logger } = require('../utils/logger');

/**
 * Get comprehensive analytics overview
 * GET /api/analytics/overview
 */
exports.getOverview = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const options = {};
    if (startDate) {
      options.startDate = new Date(startDate);
    }
    if (endDate) {
      options.endDate = new Date(endDate);
    }

    const analytics = await analyticsService.getOverview(options);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Error fetching analytics overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
      error: error.message,
    });
  }
};

/**
 * Get trend data over time
 * GET /api/analytics/trends
 */
exports.getTrends = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const options = {};
    if (startDate) {
      options.startDate = new Date(startDate);
    }
    if (endDate) {
      options.endDate = new Date(endDate);
    }

    const trends = await analyticsService.getTrendData(options);

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    logger.error('Error fetching analytics trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trend data',
      error: error.message,
    });
  }
};
