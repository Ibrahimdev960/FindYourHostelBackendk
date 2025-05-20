// models/userModel.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: {
    type: String,
    required: true,
    match: [/^\d{11}$/, 'Phone number must be exactly 11 digits'],
  },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['Hosteller', 'Hostellite', 'Admin'],
    required: true,
  },
  isVerified: { type: Boolean, default: false },
  emailToken: { type: String },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;
