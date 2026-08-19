const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  sendNotification,
  deleteNotification,
} = require('../controllers/notificationController');

const { subscribeToNotifications } = require('../services/notificationService');

// All notification routes require an authenticated user; feed is self-scoped.
router.use(isAuthenticated);

router.get('/stream', subscribeToNotifications);
router.get('/', getNotifications);
router.post('/send', sendNotification);
router.post('/', sendNotification);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);
router.delete('/:id', deleteNotification);

module.exports = router;
