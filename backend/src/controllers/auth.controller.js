const authService = require('../services/auth.service');

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

    // Return user info
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        provider: user.provider,
        payer: user.payer
      },
      session_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min
    });

  } catch (error) {
    console.error('Login error:', error);
    
    if (error.message === 'Invalid credentials' || error.message === 'Account is inactive') {
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
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to logout'
        }
      });
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

module.exports = {
  login,
  logout,
  getCurrentUser
};
