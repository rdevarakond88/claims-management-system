const authService = require('../services/auth.service');
const { logger, audit } = require('../utils/logger');

/**
 * Login handler
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        }
      });
    }

    // Authenticate user
    const user = await authService.authenticateUser(email, password);

    // Store user in session
    req.session.userId = user.id;
    req.session.userRole = user.role;

    // Audit log successful login
    audit('USER_LOGIN', user.id, {
      email: user.email,
      role: user.role,
      ip: req.ip || req.connection.remoteAddress
    });

    logger.info(`User logged in: ${user.email} (${user.role})`);

    // Return user info
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isFirstLogin: user.isFirstLogin,
        provider: user.provider,
        payer: user.payer
      },
      session_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min
    });

  } catch (error) {
    logger.error('Login error:', { email: req.body.email, error: error.message });

    if (error.message === 'Invalid credentials' || error.message === 'Account is inactive') {
      // Audit failed login attempt
      audit('USER_LOGIN_FAILED', 'anonymous', {
        email: req.body.email,
        reason: error.message,
        ip: req.ip || req.connection.remoteAddress
      });

      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: error.message
        }
      });
    }

    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during login'
      }
    });
  }
};

/**
 * Logout handler
 */
const logout = (req, res) => {
  const userId = req.session.userId;

  req.session.destroy((err) => {
    if (err) {
      logger.error('Logout error:', { userId, error: err.message });
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to logout'
        }
      });
    }

    // Audit log logout
    if (userId) {
      audit('USER_LOGOUT', userId, {
        ip: req.ip || req.connection.remoteAddress
      });
      logger.info(`User logged out: ${userId}`);
    }

    res.clearCookie('cms_session');
    return res.status(200).json({
      message: 'Logged out successfully'
    });
  });
};

/**
 * Get current user info (from session)
 */
const getCurrentUser = async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      include: {
        provider: true,
        payer: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const { passwordHash, ...userWithoutPassword } = user;

    return res.status(200).json({
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve user info'
      }
    });
  }
};

/**
 * Set new password on first login
 */
const setPassword = async (req, res) => {
  try {
    const bcrypt = require('bcrypt');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const { current_password, new_password, confirm_password } = req.body;

    // Validate input
    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All fields are required'
        }
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: {
            confirm_password: 'Passwords do not match'
          }
        }
      });
    }

    // Validate password strength
    if (new_password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(new_password)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: {
            new_password: 'Password must be at least 8 characters and contain uppercase, lowercase, and number'
          }
        }
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId }
    });

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Current password is incorrect'
        }
      });
    }

    // Check if new password is different
    const isSamePassword = await bcrypt.compare(new_password, user.passwordHash);
    if (isSamePassword) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'New password must be different from current password'
        }
      });
    }

    // Hash new password and update
    const newPasswordHash = await bcrypt.hash(new_password, 10);

    await prisma.user.update({
      where: { id: req.session.userId },
      data: {
        passwordHash: newPasswordHash,
        isFirstLogin: false,
        updatedAt: new Date()
      }
    });

    // Audit log password change
    audit('PASSWORD_CHANGED', user.id, {
      email: user.email,
      wasFirstLogin: user.isFirstLogin,
      ip: req.ip || req.connection.remoteAddress
    });

    logger.info(`Password changed for user: ${user.email}`);

    return res.status(200).json({
      message: 'Password updated successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_first_login: false
      }
    });

  } catch (error) {
    logger.error('Set password error:', { userId: req.session.userId, error: error.message });
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating password'
      }
    });
  }
};

module.exports = {
  login,
  logout,
  getCurrentUser,
  setPassword
};
