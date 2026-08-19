const express = require('express');
const router = express.Router();
const {
  submitContactForm,
  getContactMessages,
  updateMessageStatus,
} = require('../controllers/contactController');
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');

// Public
router.post('/', submitContactForm);

// Admin only
router.get('/', isAuthenticated, authorizeRoles('admin'), getContactMessages);
router.put('/:id/status', isAuthenticated, authorizeRoles('admin'), updateMessageStatus);


module.exports = router;
