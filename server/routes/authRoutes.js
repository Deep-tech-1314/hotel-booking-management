const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');
const {
  register, login, logout, getMe, updateProfile,
  updateAvatar, changePassword, forgotPassword,
  resetPassword, verifyEmail, refreshToken,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', isAuthenticated, getMe);
router.put('/me/update', isAuthenticated, updateProfile);
router.put('/me/avatar', isAuthenticated, upload.single('avatar'), updateAvatar);
router.put('/me/password', isAuthenticated, changePassword);
router.post('/forgot-password', authLimiter, forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/verify-email', verifyEmail);
router.post('/refresh', refreshToken);

module.exports = router;
