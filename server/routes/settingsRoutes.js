const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');

router
  .route('/')
  .get(getSettings) // Publicly accessible to know about stripe/maintenance status
  .put(isAuthenticated, authorizeRoles('admin'), updateSettings);

module.exports = router;
