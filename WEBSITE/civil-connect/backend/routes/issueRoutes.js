const router = require('express').Router();
const protect = require('../middleware/protect');
const authorize = require('../middleware/authorize');
const Issue = require('../models/Issue');
const Notification = require('../models/Notification');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// ─── Multer config ──────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (_req, file, cb) => cb(null, `issue-${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/issues — role-based filtering (defensive)
router.get('/', protect, async (req, res) => {
  try {
    const { role, ward } = req.user || {};
    let filter = {};

    if (role === 'USER') {
      // Citizens can view ALL issues across all wards (read-only)
    } else if (role === 'WARD_AUTHORITY') {
      if (ward) filter.ward = ward;
    } else if (role === 'HIGHER_AUTHORITY') {
      // Higher authority sees all issues (escalated shown prominently on frontend)
    }
    // ADMIN sees everything — no filter

    const issues = await Issue.find(filter)
      .populate('reportedBy', 'name mobileNumber ward')
      .populate('assignedTo', 'name role ward')
      .populate('escalatedTo', 'name role ward')
      .sort({ createdAt: -1 })
      .lean();

    // Null-safe mapping: ensure new proof-workflow fields always have safe defaults
    const safe = (issues || []).map(i => ({
      ...i,
      statusHistory: Array.isArray(i.statusHistory) ? i.statusHistory : [],
      afterImage: i.afterImage || null,
      resolutionNote: i.resolutionNote || '',
      resolvedBy: i.resolvedBy || null,
      resolvedAt: i.resolvedAt || null,
      citizenConfirmed: !!i.citizenConfirmed,
      reopened: !!i.reopened,
      progressNotes: Array.isArray(i.progressNotes) ? i.progressNotes : [],
    }));

    res.json(safe);
  } catch (err) {
    console.error('[GET /api/issues] error:', err.message, err.stack);
    // Always return 200 with empty array so frontend never crashes
    res.status(200).json([]);
  }
});

// GET /api/issues/stats — aggregated dashboard stats
router.get('/stats', protect, async (req, res) => {
  try {
    const { role, ward } = req.user;
    let matchFilter = {};
    // USER sees all issues (no filter); WARD_AUTHORITY sees their ward only
    if (role === 'WARD_AUTHORITY' && ward) matchFilter.ward = ward;

    const [statusCounts] = await Issue.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inProgressCount: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          solvedCount: { $sum: { $cond: [{ $eq: ['$status', 'solved'] }, 1, 0] } },
          escalatedCount: { $sum: { $cond: [{ $eq: ['$status', 'escalated'] }, 1, 0] } },
          closedCount: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
          reopenedCount: { $sum: { $cond: [{ $eq: ['$status', 'reopened'] }, 1, 0] } },
        },
      },
    ]);

    const wardWiseCounts = await Issue.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$ward',
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          in_progress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          solved: { $sum: { $cond: [{ $eq: ['$status', 'solved'] }, 1, 0] } },
          escalated: { $sum: { $cond: [{ $eq: ['$status', 'escalated'] }, 1, 0] } },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyTrend = await Issue.aggregate([
      { $match: { ...matchFilter, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      totalReports: statusCounts?.totalReports || 0,
      pendingCount: statusCounts?.pendingCount || 0,
      inProgressCount: statusCounts?.inProgressCount || 0,
      solvedCount: statusCounts?.solvedCount || 0,
      escalatedCount: statusCounts?.escalatedCount || 0,
      closedCount: statusCounts?.closedCount || 0,
      reopenedCount: statusCounts?.reopenedCount || 0,
      wardWiseCounts,
      monthlyTrend,
    });
  } catch (err) {
    console.error('[Stats] error:', err.message, err.stack);
    res.status(200).json({
      totalReports: 0, pendingCount: 0, inProgressCount: 0, solvedCount: 0,
      escalatedCount: 0, closedCount: 0, reopenedCount: 0, wardWiseCounts: [], monthlyTrend: [],
    });
  }
});

// GET /api/issues/analytics
router.get('/analytics', protect, async (req, res) => {
  try {
    const total = await Issue.countDocuments();
    const pending = await Issue.countDocuments({ status: 'pending' });
    const inProgress = await Issue.countDocuments({ status: 'in_progress' });
    const solved = await Issue.countDocuments({ status: 'solved' });
    const escalated = await Issue.countDocuments({ status: 'escalated' });
    const closed = await Issue.countDocuments({ status: 'closed' });
    const reopened = await Issue.countDocuments({ status: 'reopened' });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthly = await Issue.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const wardStats = await Issue.aggregate([
      { $group: { _id: '$ward', total: { $sum: 1 }, solved: { $sum: { $cond: [{ $eq: ['$status', 'solved'] }, 1, 0] } }, pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }, in_progress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } }, escalated: { $sum: { $cond: [{ $eq: ['$status', 'escalated'] }, 1, 0] } } } },
      { $sort: { total: -1 } },
    ]);

    res.json({ total, pending, inProgress, solved, escalated, closed, reopened, monthly, wardStats });
  } catch (err) {
    console.error('[Analytics] error:', err.message);
    res.status(200).json({ total: 0, pending: 0, inProgress: 0, solved: 0, escalated: 0, closed: 0, reopened: 0, monthly: [], wardStats: [] });
  }
});

// GET /api/issues/:id (defensive: tolerates old docs missing new fields)
router.get('/:id', protect, async (req, res) => {
  try {
    let issue;
    try {
      issue = await Issue.findById(req.params.id)
        .populate('reportedBy', 'name mobileNumber ward')
        .populate('assignedTo', 'name role ward')
        .populate('escalatedTo', 'name role ward')
        .populate('resolvedBy', 'name role ward')
        .populate('progressNotes.addedBy', 'name role')
        .populate('statusHistory.changedBy', 'name role');
    } catch (popErr) {
      // If populate fails (e.g. dangling ref), fallback without deep populates
      console.error('[GET /:id] populate fallback:', popErr.message);
      issue = await Issue.findById(req.params.id)
        .populate('reportedBy', 'name mobileNumber ward')
        .populate('assignedTo', 'name role ward')
        .populate('escalatedTo', 'name role ward');
    }
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    // Null-safe transform
    const obj = issue.toObject ? issue.toObject() : { ...issue };
    obj.statusHistory = Array.isArray(obj.statusHistory) ? obj.statusHistory : [];
    obj.afterImage = obj.afterImage || null;
    obj.resolutionNote = obj.resolutionNote || '';
    obj.resolvedBy = obj.resolvedBy || null;
    obj.resolvedAt = obj.resolvedAt || null;
    obj.citizenConfirmed = !!obj.citizenConfirmed;
    obj.reopened = !!obj.reopened;
    obj.progressNotes = Array.isArray(obj.progressNotes) ? obj.progressNotes : [];

    res.json(obj);
  } catch (err) {
    console.error('[GET /:id] error:', err.message);
    res.status(500).json({ message: 'Server error fetching issue' });
  }
});

// POST /api/issues — create issue with optional image upload
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { title, description, category, ward, latitude, longitude } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const issueWard = ward || req.user.ward;

    let assignedTo = null;
    if (issueWard) {
      const authority = await User.findOne({ role: 'WARD_AUTHORITY', ward: issueWard });
      if (authority) assignedTo = authority._id;
    }

    const issue = await Issue.create({
      title,
      description,
      category: category || 'other',
      ward: issueWard,
      latitude: latitude ? parseFloat(latitude) : 12.9716,
      longitude: longitude ? parseFloat(longitude) : 77.5946,
      image: req.file ? req.file.filename : null,
      reportedBy: req.user.id,
      assignedTo,
    });

    const populated = await Issue.findById(issue._id)
      .populate('reportedBy', 'name mobileNumber ward')
      .populate('assignedTo', 'name role ward');

    const notifMsg = `New issue reported: "${title}" in ${issueWard || 'Unknown Ward'}`;
    await Notification.create({ message: notifMsg, roleTarget: 'WARD_AUTHORITY', ward: issueWard, severity: 'info', type: 'REPORT', userId: req.user.id });

    const notifPayload = { message: notifMsg, type: 'REPORT', ward: issueWard, severity: 'info', roleTarget: 'WARD_AUTHORITY', createdAt: new Date() };

    // Emit to ward authority, admin, and higher — NOT to all users
    if (issueWard) {
      req.io.to(`authority-${issueWard}`).emit('newReport', populated);
      req.io.to(`authority-${issueWard}`).emit('newIssue', populated);
      req.io.to(`authority-${issueWard}`).emit('notification', notifPayload);
    }
    req.io.to('admin').emit('newReport', populated);
    req.io.to('admin').emit('notification', notifPayload);
    req.io.to('higher').emit('newReport', populated);
    req.io.to('higher').emit('notification', notifPayload);
    console.log(`[Issue] Emitted newReport to authority-${issueWard}, admin, higher`);

    res.status(201).json(populated);
  } catch (err) {
    console.error('[Issue] create error:', err.message);
    res.status(500).json({ message: 'Server error creating issue' });
  }
});

// ─── VALID STATE TRANSITIONS ─────────────────────────────────
const VALID_TRANSITIONS = {
  pending: ['in_progress'],
  in_progress: ['solved', 'escalated'],
  escalated: ['in_progress'],
  solved: ['closed', 'reopened'],
  closed: [],
  reopened: ['in_progress'],
};

// ─── Helper: populate an issue fully ─────────────────────────
async function populateIssue(id) {
  return Issue.findById(id)
    .populate('reportedBy', 'name mobileNumber ward')
    .populate('assignedTo', 'name role ward')
    .populate('escalatedTo', 'name role ward')
    .populate('resolvedBy', 'name role ward')
    .populate('statusHistory.changedBy', 'name role');
}

// ─── Helper: emit to all relevant rooms ──────────────────────
function emitToAll(io, issue, event, payload) {
  if (issue.ward) {
    io.to(`ward-${issue.ward}`).emit(event, payload);
    io.to(`authority-${issue.ward}`).emit(event, payload);
  }
  io.to('admin').emit(event, payload);
  io.to('higher').emit(event, payload);
}

// PATCH /api/issues/:id/status — proof-based workflow status transitions
router.patch('/:id/status', protect, upload.single('proofImage'), async (req, res) => {
  try {
    const { status, note, escalatedTo: escalatedToRole, expectedCompletionDate } = req.body;
    const { id: userId, role, ward, name: userName } = req.user;
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    // ── Role-based permission checks ──
    if (role === 'USER') {
      return res.status(403).json({ message: 'Citizens cannot change issue status directly. Use confirm or reopen.' });
    }
    if (role === 'ADMIN') {
      return res.status(403).json({ message: 'Admin cannot interfere with the issue workflow.' });
    }
    if (role === 'WARD_AUTHORITY' && issue.ward !== ward) {
      return res.status(403).json({ message: 'Forbidden – you can only update issues in your ward' });
    }

    // ── Validate transition ──
    const currentStatus = issue.status;
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `Invalid transition: ${currentStatus} → ${status}. Allowed: ${allowed.join(', ') || 'none'}`,
      });
    }

    // ── Role-based transition restrictions ──
    if (role === 'WARD_AUTHORITY') {
      if (currentStatus === 'pending' && status !== 'in_progress') {
        return res.status(403).json({ message: 'Ward Authority can only move pending issues to in_progress' });
      }
      if (currentStatus === 'escalated') {
        return res.status(403).json({ message: 'Only Higher Authority can manage escalated issues' });
      }
    }
    if (role === 'HIGHER_AUTHORITY') {
      // HIGHER_AUTHORITY can manage escalated → in_progress, and also do in_progress → solved/escalated
    }

    // ── Per-status validation ──
    let proofImage = req.file ? req.file.filename : null;

    if (status === 'in_progress') {
      if (!note || !note.trim()) {
        return res.status(400).json({ message: 'Work start note is required when moving to In Progress' });
      }
      if (expectedCompletionDate) {
        issue.expectedCompletionDate = new Date(expectedCompletionDate);
      }
    }

    if (status === 'escalated') {
      if (!note || !note.trim()) {
        return res.status(400).json({ message: 'Escalation reason is required' });
      }
      // Assign escalatedTo
      const higherAuth = await User.findOne({ role: 'HIGHER_AUTHORITY' });
      if (higherAuth) issue.escalatedTo = higherAuth._id;
    }

    if (status === 'solved') {
      if (!proofImage) {
        return res.status(400).json({ message: 'After-work proof image is mandatory when marking as Solved' });
      }
      if (!note || !note.trim()) {
        return res.status(400).json({ message: 'Resolution note is required when marking as Solved' });
      }
      issue.afterImage = proofImage;
      issue.solutionImage = proofImage;
      issue.resolutionNote = note.trim();
      issue.resolvedBy = userId;
      issue.resolvedAt = new Date();
    }

    // ── Update status & history ──
    issue.status = status;
    issue.statusHistory.push({
      status,
      changedBy: userId,
      changedAt: new Date(),
      note: (note || '').trim(),
      proofImage,
    });

    await issue.save();
    const populated = await populateIssue(issue._id);

    // ── Notifications & Socket Events ──
    const statusLabels = { pending: 'Pending', in_progress: 'In Progress', solved: 'Solved', escalated: 'Escalated', closed: 'Closed', reopened: 'Reopened' };
    const notifMsg = `Issue "${issue.title}" status changed to ${statusLabels[status] || status} by ${userName}`;
    await Notification.create({ message: notifMsg, roleTarget: 'ALL', ward: issue.ward, severity: status === 'escalated' ? 'warning' : 'info', type: 'STATUS_UPDATE', userId });

    const statusPayload = { message: notifMsg, type: 'STATUS_UPDATE', ward: issue.ward, severity: status === 'escalated' ? 'warning' : 'info', roleTarget: 'ALL', createdAt: new Date() };

    // Emit generic statusUpdate
    emitToAll(req.io, issue, 'notification', statusPayload);
    emitToAll(req.io, issue, 'issueUpdated', populated);
    emitToAll(req.io, issue, 'statusUpdate', populated);

    // Status-specific events
    if (status === 'escalated') {
      const escMsg = `ESCALATED: Issue "${issue.title}" in ${issue.ward || 'Unknown Ward'} needs attention`;
      await Notification.create({ message: escMsg, roleTarget: 'HIGHER_AUTHORITY', ward: issue.ward, severity: 'warning', type: 'STATUS_UPDATE' });
      req.io.to('higher').emit('issueEscalated', populated);
      req.io.to('higher').emit('notification', { message: escMsg, type: 'STATUS_UPDATE', severity: 'warning', roleTarget: 'HIGHER_AUTHORITY', createdAt: new Date() });
    }

    if (status === 'solved') {
      emitToAll(req.io, issue, 'issueResolved', populated);
      // Notify reporter specifically
      if (populated.reportedBy?._id) {
        const solvedMsg = `Your reported issue "${issue.title}" has been solved! Please confirm or reopen.`;
        await Notification.create({ message: solvedMsg, roleTarget: 'USER', ward: issue.ward, severity: 'info', type: 'STATUS_UPDATE', userId: populated.reportedBy._id });
        req.io.to(`user-${populated.reportedBy._id}`).emit('issueResolved', populated);
        req.io.to(`user-${populated.reportedBy._id}`).emit('notification', { message: solvedMsg, type: 'STATUS_UPDATE', severity: 'info', createdAt: new Date() });
      }
    }

    // Notify reporter on every change
    if (populated.reportedBy?._id) {
      req.io.to(`user-${populated.reportedBy._id}`).emit('statusUpdate', populated);
      req.io.to(`user-${populated.reportedBy._id}`).emit('issueUpdated', populated);
      req.io.to(`user-${populated.reportedBy._id}`).emit('notification', statusPayload);
    }

    res.json(populated);
  } catch (err) {
    console.error('[Issue] status update error:', err.message);
    res.status(500).json({ message: 'Server error updating status' });
  }
});

// PATCH /api/issues/:id/confirm — citizen confirms solved issue → closed
router.patch('/:id/confirm', protect, async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'USER') {
      return res.status(403).json({ message: 'Only citizens can confirm issue resolution' });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    if (issue.status !== 'solved') {
      return res.status(400).json({ message: 'Can only confirm issues with Solved status' });
    }

    // Verify citizen is the reporter
    if (String(issue.reportedBy) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Only the original reporter can confirm this issue' });
    }

    issue.status = 'closed';
    issue.citizenConfirmed = true;
    issue.statusHistory.push({
      status: 'closed',
      changedBy: req.user.id,
      changedAt: new Date(),
      note: 'Citizen confirmed the issue has been resolved',
      proofImage: null,
    });

    await issue.save();
    const populated = await populateIssue(issue._id);

    const notifMsg = `Issue "${issue.title}" confirmed resolved by citizen and CLOSED`;
    await Notification.create({ message: notifMsg, roleTarget: 'ALL', ward: issue.ward, severity: 'info', type: 'STATUS_UPDATE', userId: req.user.id });

    const payload = { message: notifMsg, type: 'STATUS_UPDATE', ward: issue.ward, severity: 'info', roleTarget: 'ALL', createdAt: new Date() };
    emitToAll(req.io, issue, 'notification', payload);
    emitToAll(req.io, issue, 'issueUpdated', populated);
    emitToAll(req.io, issue, 'issueClosed', populated);

    res.json(populated);
  } catch (err) {
    console.error('[Issue] confirm error:', err.message);
    res.status(500).json({ message: 'Server error confirming issue' });
  }
});

// PATCH /api/issues/:id/reopen — citizen reopens a solved issue
router.patch('/:id/reopen', protect, async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'USER') {
      return res.status(403).json({ message: 'Only citizens can reopen issues' });
    }

    const { note } = req.body;
    if (!note || !note.trim()) {
      return res.status(400).json({ message: 'Reopen reason is required' });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    if (issue.status !== 'solved') {
      return res.status(400).json({ message: 'Can only reopen issues with Solved status' });
    }

    // Verify citizen is the reporter
    if (String(issue.reportedBy) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Only the original reporter can reopen this issue' });
    }

    issue.status = 'reopened';
    issue.reopened = true;
    issue.citizenConfirmed = false;
    issue.statusHistory.push({
      status: 'reopened',
      changedBy: req.user.id,
      changedAt: new Date(),
      note: note.trim(),
      proofImage: null,
    });

    await issue.save();
    const populated = await populateIssue(issue._id);

    const notifMsg = `Issue "${issue.title}" has been REOPENED by citizen. Reason: ${note.trim()}`;
    await Notification.create({ message: notifMsg, roleTarget: 'WARD_AUTHORITY', ward: issue.ward, severity: 'warning', type: 'STATUS_UPDATE', userId: req.user.id });

    const payload = { message: notifMsg, type: 'STATUS_UPDATE', ward: issue.ward, severity: 'warning', roleTarget: 'WARD_AUTHORITY', createdAt: new Date() };
    emitToAll(req.io, issue, 'notification', payload);
    emitToAll(req.io, issue, 'issueUpdated', populated);
    emitToAll(req.io, issue, 'issueReopened', populated);

    // Notify the assigned authority directly
    if (issue.assignedTo) {
      req.io.to(`user-${issue.assignedTo}`).emit('issueReopened', populated);
      req.io.to(`user-${issue.assignedTo}`).emit('notification', payload);
    }

    res.json(populated);
  } catch (err) {
    console.error('[Issue] reopen error:', err.message);
    res.status(500).json({ message: 'Server error reopening issue' });
  }
});

router.patch('/:id/assign', protect, authorize('ADMIN', 'HIGHER_AUTHORITY'), async (req, res) => {
  try {
    const { authorityId } = req.body;
    const issue = await Issue.findByIdAndUpdate(req.params.id, { assignedTo: authorityId, status: 'in_progress' }, { new: true })
      .populate('reportedBy', 'name mobileNumber ward').populate('assignedTo', 'name role ward');
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    req.io.emit('issueUpdated', issue);
    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/issues/:id/notes — only WARD_AUTHORITY (own ward) and HIGHER_AUTHORITY can add notes
router.post('/:id/notes', protect, authorize('WARD_AUTHORITY', 'HIGHER_AUTHORITY'), async (req, res) => {
  try {
    const { role, ward } = req.user;
    const { note } = req.body;

    const existing = await Issue.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Issue not found' });

    if (role === 'WARD_AUTHORITY' && existing.ward !== ward) {
      return res.status(403).json({ message: 'Forbidden – you can only update issues in your ward' });
    }

    const issue = await Issue.findByIdAndUpdate(req.params.id, { $push: { progressNotes: { note, addedBy: req.user.id } } }, { new: true })
      .populate('reportedBy', 'name mobileNumber ward').populate('assignedTo', 'name role ward').populate('progressNotes.addedBy', 'name role');
    req.io.emit('issueUpdated', issue);
    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/issues/:id/solution-image
router.post('/:id/solution-image', protect, authorize('WARD_AUTHORITY', 'HIGHER_AUTHORITY'), upload.single('image'), async (req, res) => {
  try {
    const { role, ward } = req.user;
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    if (role === 'WARD_AUTHORITY' && issue.ward !== ward) {
      return res.status(403).json({ message: 'Forbidden – you can only update issues in your ward' });
    }

    issue.solutionImage = req.file ? req.file.filename : null;
    await issue.save();

    const populated = await Issue.findById(issue._id)
      .populate('reportedBy', 'name mobileNumber ward')
      .populate('assignedTo', 'name role ward');
    req.io.emit('issueUpdated', populated);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/issues/:id
router.delete('/:id', protect, authorize('ADMIN', 'HIGHER_AUTHORITY'), async (req, res) => {
  try {
    const issue = await Issue.findByIdAndDelete(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json({ message: 'Issue deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
