const express = require('express');
const router = express.Router();
const {
  subscribe,
  unsubscribe,
  getSubscribers,
} = require('../controllers/newsletterController');
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');

router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);
router.get('/subscribers', isAuthenticated, authorizeRoles('admin'), getSubscribers);

module.exports = router;
