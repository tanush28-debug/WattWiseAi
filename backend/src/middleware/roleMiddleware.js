/**
 * Middleware: requireRole
 * Enforces role-based access control based on the verified role loaded by authMiddleware.
 * @param  {...string} allowedRoles - E.g. 'CONSUMER', 'INDUSTRIAL', 'GOVERNMENT_ADMIN'
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before role verification.',
      });
    }

    const userRole = req.user.role;

    // Normalizing role naming (support both GOVERNMENT and GOVERNMENT_ADMIN)
    const isPermitted = allowedRoles.some((role) => {
      if (role === 'GOVERNMENT' && (userRole === 'GOVERNMENT' || userRole === 'GOVERNMENT_ADMIN')) return true;
      if (role === 'GOVERNMENT_ADMIN' && (userRole === 'GOVERNMENT' || userRole === 'GOVERNMENT_ADMIN')) return true;
      return userRole === role;
    });

    if (!isPermitted) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Authorized roles: [${allowedRoles.join(', ')}]. Your verified role: ${userRole}.`,
      });
    }

    next();
  };
}

