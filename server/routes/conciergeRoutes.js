const express = require('express');
const router = express.Router();
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');
const {
  createRequest,
  getMyRequests,
  getOwnerRequests,
  updateRequestStatus,
} = require('../controllers/conciergeController');

router.use(isAuthenticated);

router.post('/', createRequest);
router.get('/me', getMyRequests);
router.get('/owner', authorizeRoles('owner', 'admin'), getOwnerRequests);
router.patch('/:id/status', authorizeRoles('owner', 'admin'), updateRequestStatus);

module.exports = router;
