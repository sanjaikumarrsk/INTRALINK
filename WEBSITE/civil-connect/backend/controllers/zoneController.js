const Zone = require('../models/Zone');
const Notification = require('../models/Notification');

// GET /api/zones — get all zones
exports.getZones = async (req, res) => {
  try {
    const zones = await Zone.find().sort({ updatedAt: -1 }).populate('updatedBy', 'name role');
    res.json(zones);
  } catch (err) {
    console.error('[Zone] getZones error:', err.message);
    res.status(500).json({ message: 'Server error fetching zones' });
  }
};

// GET /api/zones/ward/:ward — get zones for a specific ward
exports.getZonesByWard = async (req, res) => {
  try {
    const zones = await Zone.find({ ward: req.params.ward }).sort({ updatedAt: -1 });
    res.json(zones);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/zones — create/update a zone (authority only)
exports.createZone = async (req, res) => {
  try {
    const { ward, severity, disasterType, areaName, lat, lng, radius } = req.body;

    if (!ward || !severity || !areaName || lat == null || lng == null) {
      return res.status(400).json({ message: 'ward, severity, areaName, lat, and lng are required' });
    }

    const zone = await Zone.create({
      ward,
      severity: severity.toUpperCase(),
      disasterType: disasterType || 'Other',
      areaName,
      lat,
      lng,
      radius: radius || 800,
      updatedBy: req.user.id,
    });

    // Create notification if RED zone
    const severityLabel = { RED: 'Critical', ORANGE: 'High Risk', YELLOW: 'Warning', GREEN: 'Safe' };
    const message = `${severityLabel[zone.severity] || zone.severity} zone declared at ${areaName} (${ward}) — ${disasterType || 'Other'}`;

    if (zone.severity === 'RED' || zone.severity === 'ORANGE') {
      await Notification.create({
        message,
        roleTarget: 'ALL',
        ward,
        severity: zone.severity === 'RED' ? 'critical' : 'warning',
        type: 'zone',
        zoneId: zone._id,
      });
    }

    // Emit real-time event to targeted rooms only
    const socketPayload = {
      _id: zone._id,
      ward: zone.ward,
      severity: zone.severity,
      disasterType: zone.disasterType,
      areaName: zone.areaName,
      lat: zone.lat,
      lng: zone.lng,
      radius: zone.radius,
      updatedBy: req.user.id,
      updatedAt: zone.updatedAt,
      message,
    };

    const notifPayload = { message, type: 'zone', ward, severity: zone.severity === 'RED' ? 'critical' : 'warning', roleTarget: 'ALL', createdAt: new Date() };

    // Emit to ward citizens, authority, admin, higher — NOT globally
    if (ward) {
      req.io.to(`ward-${ward}`).emit('zoneUpdate', socketPayload);
      req.io.to(`ward-${ward}`).emit('wardAlert', { message, ward, severity: zone.severity });
      req.io.to(`ward-${ward}`).emit('notification', notifPayload);
      req.io.to(`authority-${ward}`).emit('zoneUpdate', socketPayload);
      req.io.to(`authority-${ward}`).emit('notification', notifPayload);
    }
    req.io.to('admin').emit('zoneUpdate', socketPayload);
    req.io.to('admin').emit('notification', notifPayload);
    req.io.to('higher').emit('zoneUpdate', socketPayload);
    req.io.to('higher').emit('notification', notifPayload);
    console.log(`[Zone] Emitted zoneUpdate to ward-${ward}, authority-${ward}, admin, higher`);

    res.status(201).json(zone);
  } catch (err) {
    console.error('[Zone] createZone error:', err.message);
    res.status(500).json({ message: 'Server error creating zone' });
  }
};

// PATCH /api/zones/:id — update zone severity/disaster
exports.updateZone = async (req, res) => {
  try {
    const { severity, disasterType } = req.body;
    const zone = await Zone.findByIdAndUpdate(
      req.params.id,
      {
        ...(severity && { severity: severity.toUpperCase() }),
        ...(disasterType && { disasterType }),
        updatedBy: req.user.id,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!zone) return res.status(404).json({ message: 'Zone not found' });

    // Emit update to targeted rooms only
    const zonePayload = zone.toObject();
    if (zone.ward) {
      req.io.to(`ward-${zone.ward}`).emit('zoneUpdate', zonePayload);
      req.io.to(`authority-${zone.ward}`).emit('zoneUpdate', zonePayload);
    }
    req.io.to('admin').emit('zoneUpdate', zonePayload);
    req.io.to('higher').emit('zoneUpdate', zonePayload);

    // Notification for RED
    if (zone.severity === 'RED') {
      const msg = `CRITICAL: Zone updated to RED at ${zone.areaName} (${zone.ward}) — ${zone.disasterType}`;
      await Notification.create({
        message: msg,
        roleTarget: 'ALL',
        ward: zone.ward,
        severity: 'critical',
        type: 'zone',
        zoneId: zone._id,
      });
      const notifPayload = { message: msg, type: 'zone', ward: zone.ward, severity: 'critical', roleTarget: 'ALL', createdAt: new Date() };
      if (zone.ward) {
        req.io.to(`ward-${zone.ward}`).emit('zoneUpdate', { ...zonePayload, message: msg });
        req.io.to(`ward-${zone.ward}`).emit('notification', notifPayload);
        req.io.to(`authority-${zone.ward}`).emit('zoneUpdate', { ...zonePayload, message: msg });
        req.io.to(`authority-${zone.ward}`).emit('notification', notifPayload);
      }
      req.io.to('admin').emit('notification', notifPayload);
      req.io.to('higher').emit('notification', notifPayload);
    }

    res.json(zone);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating zone' });
  }
};

// DELETE /api/zones/:id
exports.deleteZone = async (req, res) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id);
    if (!zone) return res.status(404).json({ message: 'Zone not found' });
    
    // Emit to targeted rooms only
    const removePayload = { _id: zone._id, ward: zone.ward };
    if (zone.ward) {
      req.io.to(`ward-${zone.ward}`).emit('zoneRemoved', removePayload);
      req.io.to(`authority-${zone.ward}`).emit('zoneRemoved', removePayload);
    }
    req.io.to('admin').emit('zoneRemoved', removePayload);
    req.io.to('higher').emit('zoneRemoved', removePayload);
    
    res.json({ message: 'Zone removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting zone' });
  }
};

// GET /api/zones/stats — zone/dashboard stats
exports.getZoneStats = async (req, res) => {
  try {
    const total = await Zone.countDocuments();
    const red = await Zone.countDocuments({ severity: 'RED' });
    const orange = await Zone.countDocuments({ severity: 'ORANGE' });
    const yellow = await Zone.countDocuments({ severity: 'YELLOW' });
    const green = await Zone.countDocuments({ severity: 'GREEN' });
    res.json({ total, red, orange, yellow, green });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
