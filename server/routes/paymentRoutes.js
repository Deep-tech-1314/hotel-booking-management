const express = require('express');
const router = express.Router();
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');
const {
  createCheckoutSession, createRazorpayOrder,
  verifyRazorpayPayment, verifyPaymentSuccess, processRefund,
} = require('../controllers/paymentController');

router.post('/create-checkout-session', isAuthenticated, createCheckoutSession);
router.post('/razorpay/order', isAuthenticated, createRazorpayOrder);
router.post('/razorpay/verify', isAuthenticated, verifyRazorpayPayment);
router.post('/verify-success', isAuthenticated, verifyPaymentSuccess);
router.post('/refund/:bookingId', isAuthenticated, authorizeRoles('admin', 'owner'), processRefund);

module.exports = router;
