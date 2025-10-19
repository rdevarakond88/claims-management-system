/**
 * Middleware to check if user needs to change password
 * Allows access only to /auth/set-password and /auth/logout routes
 */
function checkFirstLogin(req, res, next) {
  // Skip check for set-password, logout, and login endpoints
  if (req.path.includes('/auth/set-password') ||
      req.path.includes('/auth/logout') ||
      req.path.includes('/auth/login') ||
      req.path.includes('/auth/me')) {
    return next();
  }

  if (req.user && req.user.isFirstLogin) {
    return res.status(403).json({
      error: {
        code: 'PASSWORD_CHANGE_REQUIRED',
        message: 'You must change your password before accessing the system',
        requirePasswordChange: true
      }
    });
  }

  next();
}

module.exports = { checkFirstLogin };
