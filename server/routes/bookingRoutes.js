const express = require('express');
const router = express.Router();
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');
const {
  createBooking, getMyBookings, getBookingDetails,
  cancelBooking, updateBookingStatus, getHotelBookings, getAllBookings,
  streamBookingUpdates,
} = require('../controllers/bookingController');

router.post('/', isAuthenticated, createBooking);
router.get('/', isAuthenticated, getAllBookings);
router.get('/stream', isAuthenticated, streamBookingUpdates);
router.get('/me', isAuthenticated, getMyBookings); // Keep for backwards compatibility if needed
router.get('/hotel/:hotelId', isAuthenticated, authorizeRoles('owner', 'admin'), getHotelBookings);
router.get('/:id', isAuthenticated, getBookingDetails);
router.put('/:id/cancel', isAuthenticated, cancelBooking);
router.put('/:id/status', isAuthenticated, authorizeRoles('owner', 'admin'), updateBookingStatus);

module.exports = router;
