const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: '',
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    roleTarget: {
      type: String,
      enum: ['ALL', 'USER', 'WARD_AUTHORITY', 'HIGHER_AUTHORITY', 'ADMIN'],
      default: 'ALL',
    },
    ward: {
      type: String,
      default: null,
      trim: true,
    },
    severity: {
      type: String,
      enum: ['info', 'moderate', 'warning', 'critical'],
      default: 'info',
    },
    type: {
      type: String,
      enum: ['zone', 'issue', 'general', 'system', 'REPORT', 'STATUS_UPDATE', 'ZONE_ALERT', 'ANNOUNCEMENT'],
      default: 'general',
    },
    read: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      default: null,
    },
  },
  { timestamps: true }
);

// Index for fast lookups
notificationSchema.index({ ward: 1, createdAt: -1 });
notificationSchema.index({ roleTarget: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
