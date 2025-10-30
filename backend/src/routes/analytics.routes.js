const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { requireAuth } = require('../middleware/auth');

/**
 * All analytics routes require authentication
 * Analytics should be accessible to admin and payer_processor roles
 */

/**
 * @route   GET /api/analytics/overview
 * @desc    Get comprehensive analytics overview
 * @access  Private (admin, payer_processor)
 * @query   startDate - Optional start date (ISO string)
 * @query   endDate - Optional end date (ISO string)
 */
router.get('/overview', requireAuth, analyticsController.getOverview);

/**
 * @route   GET /api/analytics/trends
 * @desc    Get trend data over time (daily aggregation)
 * @access  Private (admin, payer_processor)
 * @query   startDate - Optional start date (ISO string)
 * @query   endDate - Optional end date (ISO string)
 */
router.get('/trends', requireAuth, analyticsController.getTrends);

module.exports = router;
