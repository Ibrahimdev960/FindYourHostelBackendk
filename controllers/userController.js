const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc Register a new user
// controllers/userController.js
const sendVerificationEmail = require('../utils/sendEmail');

const registerUser = async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  if (!name || !email || !phone || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (!/^\d{11}$/.test(phone)) {
    return res.status(400).json({ message: 'Phone number must be exactly 11 digits' });
  }

  try {
    const existingUser = await User.findOne({ email, role });
    if (existingUser) {
      return res.status(400).json({ message: `User already exists as ${role}` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const emailToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      emailToken,
    });

    await sendVerificationEmail(email, emailToken);

    res.status(201).json({ message: 'Registration successful. Please verify your email.' });
 } catch (error) {
  console.error('Error during registration:', error);
  res.status(500).json({ message: 'Server error' });
}

};



// @desc Authenticate user & get token
// controllers/userController.js

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and Password required' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email before logging in' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(200).json({ message: 'Login successful', token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users); // Return just the array
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUserProfile = async (req, res) => {
  const { name, email, phone } = req.body;
  const userId = req.user.id; // Assuming you have auth middleware that sets req.user
  
  try {
    // Find user first to verify they exist
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Validate phone number if it's being updated
    if (phone && !/^\d{11}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone number must be exactly 11 digits' });
    }
    
    // Check if email is being changed and is already in use
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, role: user.role });
      if (existingUser) {
        return res.status(400).json({ message: `Email already in use by another ${user.role}` });
      }
    }
    
    // Update fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    
    await user.save();
    
    res.status(200).json({ 
      message: 'Profile updated successfully', 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Change user password
const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id; // From auth middleware
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password and save
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc Delete user (admin only)
const deleteUser = async (req, res) => {
  const { userId } = req.params;
  
  try {
    // Check if admin (this should be verified by middleware before this function)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export the new functions along with the existing ones
module.exports = { 
  registerUser, 
  loginUser, 
  getAllUsers, 
  updateUserProfile, 
  updatePassword, 
  deleteUser 
};
