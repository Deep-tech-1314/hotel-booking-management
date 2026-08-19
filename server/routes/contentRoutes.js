const express = require('express');
const router = express.Router();
const {
  getHomeContent,
  getAllContent,
  getSection,
  upsertContent,
  deleteContent,
  seedHomeContent,
} = require('../controllers/contentController');
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');

router.get('/home', getHomeContent);
router.get('/', isAuthenticated, authorizeRoles('admin'), getAllContent);
router.get('/section/:section', getSection);
router.post('/', isAuthenticated, authorizeRoles('admin'), upsertContent);
router.post('/seed', isAuthenticated, authorizeRoles('admin'), seedHomeContent);
router.delete('/:id', isAuthenticated, authorizeRoles('admin'), deleteContent);

module.exports = router;
