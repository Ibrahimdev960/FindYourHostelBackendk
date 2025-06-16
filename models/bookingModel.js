
const mongoose = require('mongoose');
const bookingSchema = new mongoose.Schema({
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seatsBooked: {
    type: Number,
    required: true
  },
  checkInDate: {
    type: Date,
    required: true
  },
  checkOutDate: {
    type: Date,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
