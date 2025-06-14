const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createReview,
  getHostelReviews,
  getUserReviews,getEligibleBookings
} = require('../controllers/reviewController');

const router = express.Router();

router.post('/add', protect, createReview);              // POST /api/reviews/add
router.get('/:hostelId', getHostelReviews);              // GET /api/reviews/:hostelId
router.get('/user/my', protect, getUserReviews);  
router.get('/eligible-bookings/:hostelId', protect, getEligibleBookings);
       // GET /api/reviews/user/my


module.exports = router;
