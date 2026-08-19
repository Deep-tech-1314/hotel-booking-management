const express = require('express');
const router = express.Router();
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');
const {
  createCoupon, getCoupons, updateCoupon, deleteCoupon, applyCoupon,
} = require('../controllers/couponController');

router.post('/', isAuthenticated, authorizeRoles('owner', 'admin'), createCoupon);
router.get('/', isAuthenticated, authorizeRoles('owner', 'admin'), getCoupons);
router.put('/:id', isAuthenticated, authorizeRoles('owner', 'admin'), updateCoupon);
router.delete('/:id', isAuthenticated, authorizeRoles('owner', 'admin'), deleteCoupon);
router.post('/apply', isAuthenticated, applyCoupon);

module.exports = router;
