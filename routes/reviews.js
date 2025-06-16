const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createReview,
  getHostelReviews,
  getUserReviews,
  getReviewStats,  // Add this

} = require('../controllers/reviewController');

const router = express.Router();

router.post('/add', protect, createReview);              // POST /api/reviews/add
router.get('/:hostelId', getHostelReviews);              // GET /api/reviews/:hostelId
router.get('/user/my', protect, getUserReviews);         // GET /api/reviews/user/my
router.get('/stats/:hostelId', getReviewStats);  // Add this new route


module.exports = router;
