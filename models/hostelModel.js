const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point',
  },
  coordinates: {
    type: [Number], // [lng, lat]
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
},

  amenities: { type: [String], required: true },
  availability: { type: Boolean, default: true },
  images: { type: [String], default: [] },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  averageRating: {
  type: Number,
  default: 0,
  min: 0,
  max: 5
},
reviewCount: {
  type: Number,
  default: 0
},
  rejectionReason: { type: String, default: '' }
}, { timestamps: true });

// Create 2dsphere index for geospatial queries
hostelSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Hostel', hostelSchema);