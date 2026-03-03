const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect middleware – verifies JWT from Authorization header.
 * Attaches decoded { id, role } to req.user, plus ward from DB.
 */
module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized – no token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user info including ward
    const user = await User.findById(decoded.id).select('role ward name');
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = { id: user._id, role: user.role, ward: user.ward, name: user.name };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized – token invalid or expired' });
  }
};
