

const router = require('express').Router();
const protect = require('../middleware/protect');
const authorize = require('../middleware/authorize');
const {
  getZones,
  getZonesByWard,
  createZone,
  updateZone,
  deleteZone,
  getZoneStats,
} = require('../controllers/zoneController');

// All zone routes require authentication
router.use(protect);

// GET stats (before /:id to avoid conflict)
router.get('/stats', getZoneStats);

// GET all zones (all authenticated users)
router.get('/', getZones);

// GET zones by ward
router.get('/ward/:ward', getZonesByWard);

// POST create zone (authorities + admin only)
router.post('/', authorize('WARD_AUTHORITY', 'HIGHER_AUTHORITY', 'ADMIN'), createZone);

// PATCH update zone
router.patch('/:id', authorize('WARD_AUTHORITY', 'HIGHER_AUTHORITY', 'ADMIN'), updateZone);

// DELETE zone
router.delete('/:id', authorize('HIGHER_AUTHORITY', 'ADMIN'), deleteZone);

module.exports = router;
