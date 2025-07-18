const Review = require('../models/Review');
const Booking = require('../models/bookingModel');
const Hostel = require('../models/hostelModel');

// ⭐ Create Review
const createReview = async (req, res) => {
  const { hostelId, bookingId, rating, title, comment } = req.body;
  const userId = req.user.id;

  try {
    // Validate Booking
    const booking = await Booking.findOne({
      _id: bookingId,
      hostel: hostelId,
      user: userId,
      paymentStatus: 'completed',
    });

    if (!booking) {
      return res.status(400).json({ message: 'You can only review a hostel you have completed a booking for' });
    }

    // Prevent duplicate review
    const alreadyReviewed = await Review.findOne({ user: userId, hostel: hostelId, booking: bookingId });
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this hostel for this booking' });
    }

    const review = new Review({
      user: userId,
      hostel: hostelId,
      booking: bookingId,
      rating,
      title,
      comment
    });

    await review.save();

    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Failed to submit review', error: error.message });
  }
};

// ⭐ Get All Reviews for a Hostel
const getHostelReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ hostel: req.params.hostelId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};

// ⭐ Get Reviews by Logged-in User
const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate('hostel', 'name')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user reviews', error: error.message });
  }
};

// ⭐ Hostel Owner Responds to Review
const respondToReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate('hostel');

    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Check owner authorization
    if (review.hostel.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to respond to this review' });
    }

    review.response = req.body.response;
    await review.save();

    res.json({ message: 'Response added', review });
  } catch (error) {
    res.status(500).json({ message: 'Failed to respond to review', error: error.message });
  }
};

const getReviewStats = async (req, res) => {
  try {
    const { hostelId } = req.params;
    
    // Get review count and average rating
    const reviewCount = await Review.countDocuments({ hostel: hostelId });
    
    const averageResult = await Review.aggregate([
      { $match: { hostel: hostelId } },
      { $group: { _id: null, averageRating: { $avg: '$rating' } } }
    ]);
    
    const averageRating = averageResult.length > 0 ? averageResult[0].averageRating : 0;

    res.status(200).json({
      success: true,
      count: reviewCount,
      averageRating: parseFloat(averageRating.toFixed(1))
    });
  } catch (error) {
    console.error('Error getting review stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get review statistics',
      error: error.message
    });
  }
};
module.exports = {
  createReview,
  getHostelReviews,
  getUserReviews,
  respondToReview,
  getReviewStats
};
