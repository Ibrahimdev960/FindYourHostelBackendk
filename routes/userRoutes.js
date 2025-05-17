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

module.exports = router;