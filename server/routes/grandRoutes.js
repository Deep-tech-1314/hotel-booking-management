const express = require('express');
const router = express.Router();
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');
const { getOverview, getBookings, getRooms, getGuests, createGuest, getReports, getPayout, updateRoomStatus, assignGuestToRoom } = require('../controllers/grandController');

// Owner dashboard ("Grand") – owner-scoped; admins may view too.
router.use(isAuthenticated, authorizeRoles('owner', 'admin'));

router.get('/overview', getOverview);
router.get('/bookings', getBookings);
router.get('/rooms', getRooms);
router.patch('/rooms/:roomId/status', updateRoomStatus);
router.post('/rooms/:roomId/assign-guest', assignGuestToRoom);
router.get('/guests', getGuests);
router.post('/guests', createGuest);
router.get('/reports', getReports);
router.get('/payout', getPayout);

module.exports = router;
