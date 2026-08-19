const express = require('express');
const router = express.Router();
const {
  trackView,
  getRecentViews,
  getHotelAnalytics,
  getRecommendations,
} = require('../controllers/analyticsController');
const { isAuthenticated, optionalAuth } = require('../middleware/auth');

router.post('/view', optionalAuth, trackView);
router.get('/recent', optionalAuth, getRecentViews);
router.get('/recommendations', optionalAuth, getRecommendations);
router.get('/hotel/:hotelId', isAuthenticated, getHotelAnalytics);

module.exports = router;
