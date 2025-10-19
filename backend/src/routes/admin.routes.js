const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

// All admin routes require authentication and admin role
router.use(requireAuth);
router.use(requireRole('admin'));

// List all users
router.get('/users', adminController.listUsers);

// Create new user
router.post('/users', adminController.createUser);

module.exports = router;
