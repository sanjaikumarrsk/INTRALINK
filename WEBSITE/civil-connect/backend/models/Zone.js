const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema(
  {
    ward: {
      type: String,
      required: [true, 'Ward is required'],
      trim: true,
    },
    severity: {
      type: String,
      enum: ['GREEN', 'YELLOW', 'ORANGE', 'RED'],
      required: [true, 'Severity level is required'],
    },
    disasterType: {
      type: String,
      enum: [
        'Flood',
        'Earthquake',
        'Fire',
        'Cyclone',
        'Landslide',
        'Heatwave',
        'Gas Leak',
        'Building Collapse',
        'Other',
      ],
      default: 'Other',
    },
    areaName: {
      type: String,
      required: [true, 'Area name is required'],
      trim: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    radius: {
      type: Number,
      default: 800,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Zone', zoneSchema);
