const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organization.controller');
const { requireAuth } = require('../middleware/auth');

// All routes require authentication
router.use(requireAuth);

// Get all providers
router.get('/providers', organizationController.getProviders);

// Get all payers
router.get('/payers', organizationController.getPayers);

module.exports = router;
