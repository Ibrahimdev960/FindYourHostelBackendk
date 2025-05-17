const Review = require("../models/Review");
const Booking = require("../models/bookingModel");
const { sendNotification } = require("../controllers/notificationController"); // Import Notification

// ✅ **1. Add Review (Only if user booked the hostel)**
exports.addReview = async (req, res) => {
  try {
    const { userId, hostelId, rating, comment } = req.body;

    // 🔥 Ensure user booked this hostel
    const bookingExists = await Booking.findOne({ userId, hostelId });
    if (!bookingExists) {
      return res.status(403).json({ message: "You can only review hostels you have booked" });
    }

    // 📝 Create and save review
    const review = new Review({ userId, hostelId, rating, comment });
    await review.save();

    // ✅ Send Notification to Hostel Owner
    sendNotification(bookingExists.hostel.ownerId, `New review added for your hostel by User ID: ${userId}`, "Review");

    res.status(201).json({ message: "Review added successfully", review });

  } catch (error) {
    console.error("Add Review Error:", error);
    res.status(500).json({ message: "Error adding review", error: error.message });
  }
};

// ✅ **2. Get All Reviews for a Hostel**
exports.getHostelReviews = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const reviews = await Review.find({ hostelId }).populate("userId", "name");
    res.status(200).json(reviews);
  } catch (error) {
    console.error("Fetch Reviews Error:", error);
    res.status(500).json({ message: "Error fetching reviews", error: error.message });
  }
};

// ✅ **3. Update Review**
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, rating, comment } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // 🔥 Ensure only the review owner can update
    if (review.userId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized to update this review" });
    }

    review.rating = rating;
    review.comment = comment;
    await review.save();

    // ✅ Send Notification to Hostel Owner
    sendNotification(review.hostel.ownerId, `A review for your hostel has been updated by User ID: ${userId}`, "Review");

    res.status(200).json({ message: "Review updated successfully", review });

  } catch (error) {
    console.error("Update Review Error:", error);
    res.status(500).json({ message: "Error updating review", error: error.message });
  }
};

// ✅ **4. Delete Review**
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // 🔥 Ensure only the review owner can delete
    if (review.userId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized to delete this review" });
    }

    await Review.findByIdAndDelete(id);

    // ✅ Send Notification to Hostel Owner
    sendNotification(review.hostel.ownerId, `A review for your hostel has been deleted by User ID: ${userId}`, "Review");

    res.status(200).json({ message: "Review deleted successfully" });

  } catch (error) {
    console.error("Delete Review Error:", error);
    res.status(500).json({ message: "Error deleting review", error: error.message });
  }
};
