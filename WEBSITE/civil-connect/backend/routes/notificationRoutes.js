const router = require('express').Router();
const protect = require('../middleware/protect');
const {
  getNotifications,
  markRead,
  markAllRead,
  createNotification,
} = require('../controllers/notificationController');

// All notification routes require authentication
router.use(protect);

router.get('/', getNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);
router.post('/', createNotification);

module.exports = router;
