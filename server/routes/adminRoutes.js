const express = require('express');
const router = express.Router();
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');
const {
  getAllUsers, updateUserRole, updateUser, updateUserStatus, deleteUser,
  getAllHotelsAdmin, approveHotel, rejectHotel, getPendingHotels,
  getAllBookingsAdmin, cancelBookingAdmin,
  getPaymentStats, processPayouts,
  getStats, getAnalytics, getRevenue,
  testEmail, getAllOwners,
} = require('../controllers/adminController');

const { subscribeToBookingEvents } = require('../services/bookingEvents');

// All admin routes require admin role
router.use(isAuthenticated, authorizeRoles('admin'));

// SSE stream
router.get('/stream', subscribeToBookingEvents);

// Stats & analytics
router.get('/stats', getStats);
router.get('/analytics', getAnalytics);
router.get('/revenue', getRevenue);

// User & Owner management
router.get('/users', getAllUsers);
router.get('/owners', getAllOwners);
router.put('/users/:id', updateUser);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Hotel management
router.get('/hotels', getAllHotelsAdmin);
router.get('/hotels/pending', getPendingHotels);
router.put('/hotels/:id/approve', approveHotel);
router.put('/hotels/:id/reject', rejectHotel);

// Booking management
router.get('/bookings', getAllBookingsAdmin);
router.put('/bookings/:id/cancel', cancelBookingAdmin);

// Payment management
router.get('/payments', getPaymentStats);
router.put('/payouts/process', processPayouts);

// Utilities
router.post('/test-email', testEmail);

module.exports = router;
