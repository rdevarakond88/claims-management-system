const express = require('express');
const router = express.Router();
const claimsController = require('../controllers/claims.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate, validateQuery, validateParams, commonSchemas } = require('../middleware/validation');

// All claims routes require authentication
router.use(requireAuth);

// Create new claim (Provider only)
router.post('/', requireRole(['provider_staff']), validate('createClaim'), claimsController.createClaim);

// List claims (Provider sees their claims, Payer sees all)
router.get('/', validateQuery(commonSchemas.claimFilters), claimsController.listClaims);

// Adjudicate claim (Payer only)
router.patch('/:id/adjudicate', requireRole(['payer_processor']), validateParams(commonSchemas.uuid), validate('adjudicateClaim'), claimsController.adjudicateClaim);

// Get single claim details
router.get('/:id', validateParams(commonSchemas.uuid), claimsController.getClaimById);

module.exports = router;
