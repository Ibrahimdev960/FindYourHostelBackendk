const express = require('express');
const { getUserNotifications, markAsRead } = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// router.get('/', authMiddleware, getUserNotifications);
// router.put('/:id', authMiddleware, markAsRead);
router.get('/',  getUserNotifications);
router.put('/:id',  markAsRead);
module.exports = router;
