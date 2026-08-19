const express = require('express');
const router = express.Router({ mergeParams: true }); // Access hotelId from parent
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getRooms, getRoom, createRoom, updateRoom, deleteRoom, checkAvailability,
} = require('../controllers/roomController');

router.get('/', getRooms);
router.get('/:id', getRoom);
router.get('/:id/availability', checkAvailability);
router.post('/', isAuthenticated, authorizeRoles('owner', 'admin'), upload.array('images', 10), createRoom);
router.put('/:id', isAuthenticated, authorizeRoles('owner', 'admin'), upload.array('images', 10), updateRoom);
router.delete('/:id', isAuthenticated, authorizeRoles('owner', 'admin'), deleteRoom);

module.exports = router;
