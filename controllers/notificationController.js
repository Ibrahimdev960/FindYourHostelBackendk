const Notification = require('../models/notificationModel');

// Create a notification
const sendNotification = async (userId, title, message, role) => {
  try {
    const notification = new Notification({
      user: userId,
      role,
      title,
      message
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error sending notification:', error.message);
    throw error;
  }
};

// Get notifications for logged-in user
const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notification', error: error.message });
  }
};

module.exports = {
  sendNotification,
  getUserNotifications,
  markAsRead
};
