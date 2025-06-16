const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getUserNotifications,
  markAsRead
} = require('../controllers/notificationController');

// GET /api/notifications
router.get('/', protect, getUserNotifications);

// PATCH /api/notifications/:id/read
router.patch('/:id/read', protect, markAsRead);

module.exports = router;
