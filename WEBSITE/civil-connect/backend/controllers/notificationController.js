const Notification = require('../models/Notification');

// GET /api/notifications — get notifications for the current user
exports.getNotifications = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userWard = req.user.ward;

    // Build query to get notifications the user should see:
    // 1. roleTarget is 'ALL' OR matches user's role
    // 2. AND ward is null/unset OR matches user's ward
    const roleCondition = { $or: [{ roleTarget: 'ALL' }, { roleTarget: userRole }] };
    
    // Ward condition: notification has no ward (global) OR matches user's ward
    const wardCondition = userWard
      ? { $or: [{ ward: null }, { ward: '' }, { ward: { $exists: false } }, { ward: userWard }] }
      : { $or: [{ ward: null }, { ward: '' }, { ward: { $exists: false } }] };

    const query = { $and: [roleCondition, wardCondition] };

    console.log(`[Notification] Query for user role=${userRole}, ward=${userWard}:`, JSON.stringify(query));

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    console.log(`[Notification] Found ${notifications.length} notifications for user`);
    res.json(notifications);
  } catch (err) {
    console.error('[Notification] getNotifications error:', err.message);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
};

// PATCH /api/notifications/:id/read — mark one notification as read
exports.markRead = async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/notifications/read-all — mark all visible notifications as read for current user
exports.markAllRead = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userWard = req.user.ward;

    // Build the same query as getNotifications to mark only user's visible notifications
    const roleCondition = { $or: [{ roleTarget: 'ALL' }, { roleTarget: userRole }] };
    const wardCondition = userWard
      ? { $or: [{ ward: null }, { ward: '' }, { ward: { $exists: false } }, { ward: userWard }] }
      : { $or: [{ ward: null }, { ward: '' }, { ward: { $exists: false } }] };

    const query = { $and: [roleCondition, wardCondition, { read: false }] };

    const result = await Notification.updateMany(query, { read: true });
    console.log(`[Notification] markAllRead for role=${userRole}, ward=${userWard}: ${result.modifiedCount} marked`);
    res.json({ message: 'All notifications marked as read', count: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/notifications — create a notification (admin/authority broadcast)
exports.createNotification = async (req, res) => {
  try {
    const { title, message, roleTarget, ward, severity, type } = req.body;
    if (!message) return res.status(400).json({ message: 'message is required' });

    const target = roleTarget || 'ALL';
    const targetWard = ward || null;

    const notif = await Notification.create({
      title: title || '',
      message,
      roleTarget: target,
      ward: targetWard,
      severity: severity || 'info',
      type: type || 'ANNOUNCEMENT',
      read: false,
      userId: req.user.id,
    });

    const payload = notif.toObject();
    console.log(`[Broadcast] Sending notification: role=${target}, ward=${targetWard}`);

    // Helper: emit to a room with both event names (matches Report propagation pattern)
    function emitToRoom(room) {
      req.io.to(room).emit('notification', payload);
      req.io.to(room).emit('broadcastNotification', payload);
      console.log(`[Broadcast] Emitted to ${room}`);
    }

    // Emit to rooms based on roleTarget and ward — using correct room names
    // Room names from server.js joinRoom: 'users', 'authorities', 'admin', 'higher',
    // 'ward-{ward}', 'authority-{ward}', 'user-{userId}'
    if (target === 'ALL') {
      emitToRoom('users');       // All citizens
      emitToRoom('authorities'); // All ward authorities
      emitToRoom('admin');       // Admins
      emitToRoom('higher');      // Higher authorities
      if (targetWard) {
        emitToRoom(`ward-${targetWard}`);
        emitToRoom(`authority-${targetWard}`);
      }
    } else if (target === 'USER') {
      emitToRoom('users');
      if (targetWard) {
        emitToRoom(`ward-${targetWard}`);
      }
    } else if (target === 'WARD_AUTHORITY') {
      emitToRoom('authorities');
      if (targetWard) {
        emitToRoom(`authority-${targetWard}`);
      }
    } else if (target === 'ADMIN') {
      emitToRoom('admin');
    } else if (target === 'HIGHER_AUTHORITY') {
      emitToRoom('higher');
    }

    res.status(201).json(notif);
  } catch (err) {
    console.error('[Broadcast] error:', err.message);
    res.status(500).json({ message: 'Server error creating notification' });
  }
};
