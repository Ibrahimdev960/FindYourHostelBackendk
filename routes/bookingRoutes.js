const express = require('express');
const { 
  bookHostel, 
  cancelBooking, 
  getBookings,
  getHostelOwnerBookings,
  getEligibleBookings,
  getAllBookings // Make sure this is imported
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

// User routes
router.post('/book', protect, bookHostel);
router.delete('/cancel/:id', protect, cancelBooking);
router.get('/user-bookings', protect, getBookings);
router.get('/hostel-owner-bookings', protect, getHostelOwnerBookings);
router.get('/eligible-bookings/:hostelId', protect, getEligibleBookings);

// Admin routes
router.get('/all', protect, getAllBookings); // This is the line that was failing

module.exports = router;