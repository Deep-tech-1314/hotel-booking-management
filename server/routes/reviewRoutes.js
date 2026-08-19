const express = require('express');
const router = express.Router();
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');
const {
  createReview, getHotelReviews, updateReview, deleteReview, replyToReview,
} = require('../controllers/reviewController');

router.post('/hotel/:hotelId', isAuthenticated, createReview);
router.get('/hotel/:hotelId', getHotelReviews);
router.put('/:id', isAuthenticated, updateReview);
router.delete('/:id', isAuthenticated, deleteReview);
router.put('/:id/reply', isAuthenticated, authorizeRoles('owner'), replyToReview);

module.exports = router;
