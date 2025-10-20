const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');
const { validate } = require('../middleware/validation');

// Public routes with strict rate limiting
router.post('/login', authLimiter, validate('login'), authController.login);
router.post('/logout', authController.logout);

// Protected routes
router.get('/me', requireAuth, authController.getCurrentUser);
router.post('/set-password', requireAuth, authLimiter, validate('setPassword'), authController.setPassword);

module.exports = router;
