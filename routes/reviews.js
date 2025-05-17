const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");

// ✅ **Use Controller Methods**
router.post("/add", reviewController.addReview);
router.get("/:hostelId", reviewController.getHostelReviews);
router.put("/update/:id", reviewController.updateReview);
router.delete("/delete/:id", reviewController.deleteReview);

module.exports = router;
