const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const {
  sendMessage,
  getMyMessages,
  markMessageRead,
  getAllMessagesAdmin,
  deleteMessage,
} = require('../controllers/messageController');

router.use(isAuthenticated);

router.post('/', sendMessage);
router.get('/me', getMyMessages);
router.get('/all', getAllMessagesAdmin);
router.patch('/:id/read', markMessageRead);
router.delete('/:id', deleteMessage);

module.exports = router;


