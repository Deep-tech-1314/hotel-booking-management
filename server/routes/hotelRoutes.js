const express = require('express');
const router = express.Router();
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getAllHotels, getHotelDetails, createHotel, updateHotel,
  deleteHotel, getFeaturedHotels, getNearbyHotels, getMyHotels,
  getCities, getCategoriesCount,
} = require('../controllers/hotelController');

// Public routes
router.get('/', getAllHotels);
router.get('/categories', getCategoriesCount);
router.get('/featured', getFeaturedHotels);
router.get('/nearby', getNearbyHotels);
router.get('/cities', getCities);
router.get('/owner/my-hotels', isAuthenticated, authorizeRoles('owner', 'admin'), getMyHotels);

// Owner routes
router.post('/', isAuthenticated, authorizeRoles('owner', 'admin'), upload.array('images', 10), createHotel);
router.put('/:id', isAuthenticated, authorizeRoles('owner', 'admin'), upload.array('images', 10), updateHotel);
router.delete('/:id', isAuthenticated, authorizeRoles('owner', 'admin'), deleteHotel);
router.get('/:id', getHotelDetails);

module.exports = router;
