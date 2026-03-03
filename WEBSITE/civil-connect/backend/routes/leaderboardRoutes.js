const router = require('express').Router();
const Issue = require('../models/Issue');

// GET /api/leaderboard/wards — ward performance leaderboard
router.get('/wards', async (req, res) => {
  try {
    const wardStats = await Issue.aggregate([
      {
        $group: {
          _id: '$ward',
          total: { $sum: 1 },
          solved: { $sum: { $cond: [{ $eq: ['$status', 'solved'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          in_progress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          escalated: { $sum: { $cond: [{ $eq: ['$status', 'escalated'] }, 1, 0] } },
        },
      },
      { $sort: { solved: -1, total: -1 } },
    ]);
    res.json(wardStats.map(w => ({ ...w, ward: w._id })));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/leaderboard/users — citizen leaderboard by issue count
router.get('/users', async (req, res) => {
  try {
    const userStats = await Issue.aggregate([
      { $match: { reportedBy: { $ne: null } } },
      {
        $group: {
          _id: '$reportedBy',
          issueCount: { $sum: 1 },
        },
      },
      { $sort: { issueCount: -1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: '$user._id',
          name: '$user.name',
          ward: '$user.ward',
          issueCount: 1,
          points: { $multiply: ['$issueCount', 10] },
        },
      },
    ]);
    res.json(userStats);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
