const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: [
        'garbage', 'road_damage', 'water_leakage', 'streetlight',
        'drainage', 'tree_fallen', 'fire_hazard', 'flooding',
        'pothole', 'broken_footpath', 'other',
      ],
      default: 'other',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'solved', 'escalated', 'closed', 'reopened'],
      default: 'pending',
    },
    ward: { type: String, default: null },
    latitude: { type: Number, default: 12.9716 },
    longitude: { type: Number, default: 77.5946 },
    image: { type: String, default: null },
    solutionImage: { type: String, default: null },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    escalatedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    expectedCompletionDate: { type: Date, default: null },
    progressNotes: [
      {
        note: String,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // ── Proof-based workflow fields ──────────────────────────
    statusHistory: [
      {
        status: { type: String },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note: { type: String, default: '' },
        proofImage: { type: String, default: null },
      },
    ],
    afterImage: { type: String, default: null },
    resolutionNote: { type: String, default: '' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
    citizenConfirmed: { type: Boolean, default: false },
    reopened: { type: Boolean, default: false },
  },
  { timestamps: true }
);

issueSchema.index({ ward: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Issue', issueSchema);
