const Notification = require('../models/notificationModel');

// Get Notifications for a User
const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ message: 'Notifications fetched successfully', notifications });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark Notification as Read
const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Send Notification (For Booking, Review, Admin Updates)
const sendNotification = async (userId, message, type) => {
  try {
    await Notification.create({ userId, message, type });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

module.exports = { getUserNotifications, markAsRead, sendNotification };
