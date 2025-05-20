const express = require('express');
const { 
  registerUser, 
  loginUser, 
  getAllUsers, 
  updateUserProfile, 
  updatePassword, 
  deleteUser 
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware'); // Assuming you have auth middleware
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();


// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes (require authentication)
router.get('/all-users', protect , getAllUsers);
router.put('/profile', protect, updateUserProfile);
router.put('/password', protect, updatePassword);

// Admin only routes
router.delete('/:userId', protect, adminAuth, deleteUser);



// routes/userRoutes.js

router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: 'Verification token is missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    user.isVerified = true;
    user.emailToken = null;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});

module.exports = router;