const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getHotelVideos,
  createVideo,
} = require('../controllers/videoController');
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');

router.get('/', getHotelVideos);
router.post('/', isAuthenticated, authorizeRoles('owner'), createVideo);

module.exports = router;
