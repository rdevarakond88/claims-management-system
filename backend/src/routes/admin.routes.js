const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { adminLimiter } = require('../middleware/security');
const { validate, validateQuery, commonSchemas } = require('../middleware/validation');

// All admin routes require authentication and admin role
router.use(requireAuth);
router.use(requireRole('admin'));
router.use(adminLimiter); // Apply admin-specific rate limiting

// List all users
router.get('/users', validateQuery(commonSchemas.userFilters), adminController.listUsers);

// Create new user
router.post('/users', validate('createUser'), adminController.createUser);

module.exports = router;
