const express = require('express');
const { bookHostel, cancelBooking, getBookings,getHostelOwnerBookings,getEligibleBookings } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/book', protect, bookHostel);
router.delete('/cancel/:id', protect, cancelBooking);
router.get('/user-bookings', protect, getBookings);
// Add this new route
router.get('/hostel-owner-bookings', protect, getHostelOwnerBookings);
router.get('/eligible-bookings/:hostelId', protect, getEligibleBookings);

module.exports = router;