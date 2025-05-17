const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripeController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-payment-intent', protect, stripeController.createPaymentIntent);
router.post('/payment-success', protect, stripeController.handlePaymentSuccess);


module.exports = router;