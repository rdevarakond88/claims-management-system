const express = require('express');
const router = express.Router();
const claimsController = require('../controllers/claims.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

// All claims routes require authentication
router.use(requireAuth);

// Create new claim (Provider only)
router.post('/', requireRole(['provider_staff']), claimsController.createClaim);

// List claims (Provider sees their claims, Payer sees all)
router.get('/', claimsController.listClaims);

// Get single claim details
router.get('/:id', claimsController.getClaimById);

module.exports = router;
