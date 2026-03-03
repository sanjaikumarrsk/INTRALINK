/**
 * Authorize middleware – restricts access to specific roles.
 *
 * Usage:
 *   authorize('ADMIN')
 *   authorize('WARD_AUTHORITY', 'HIGHER_AUTHORITY', 'ADMIN')
 */
module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden – insufficient role' });
    }
    next();
  };
};
