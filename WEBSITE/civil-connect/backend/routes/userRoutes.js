const router = require('express').Router();
const protect = require('../middleware/protect');
const authorize = require('../middleware/authorize');
const User = require('../models/User');

// GET /api/users — list all users (admin only)
router.get('/', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// PATCH /api/users/:id/role — update user role (admin only)
router.patch('/:id/role', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['USER', 'WARD_AUTHORITY', 'HIGHER_AUTHORITY', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating role' });
  }
});

module.exports = router;
