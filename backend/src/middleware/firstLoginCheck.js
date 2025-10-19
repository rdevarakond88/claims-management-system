const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Middleware to check if user needs to change password
 * Allows access only to /auth/set-password, /auth/logout, /auth/me, and /auth/login routes
 */
async function checkFirstLogin(req, res, next) {
  // Skip check for auth endpoints that should always be accessible
  if (req.path.includes('/auth/set-password') ||
      req.path.includes('/auth/logout') ||
      req.path.includes('/auth/login') ||
      req.path.includes('/auth/me') ||
      req.path.includes('/health') ||
      !req.session || !req.session.userId) {
    return next();
  }

  try {
    // Get user from database to check isFirstLogin status
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { isFirstLogin: true }
    });

    if (user && user.isFirstLogin) {
      return res.status(403).json({
        error: {
          code: 'PASSWORD_CHANGE_REQUIRED',
          message: 'You must change your password before accessing the system',
          requirePasswordChange: true
        }
      });
    }

    next();
  } catch (error) {
    console.error('First login check error:', error);
    next(); // Continue on error to avoid blocking all requests
  }
}

module.exports = { checkFirstLogin };
