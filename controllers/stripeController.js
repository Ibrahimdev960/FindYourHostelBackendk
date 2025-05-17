const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Hostel = require('../models/hostelModel');
const Booking = require('../models/bookingModel');
const Room = require('../models/roomModel');
const mongoose = require('mongoose');

// controllers/stripeController.js
exports.createPaymentIntent = async (req, res) => {
  try {
    const { hostelId, roomId, seatsBooked, amount, currency } = req.body;

    // Validate required fields
    if (!hostelId || !amount || !roomId || seatsBooked === undefined) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Validate hostel exists
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ error: 'Hostel not found' });
    }

    // Convert ObjectId to string for Stripe metadata
    const userIdString = req.user.id.toString();

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency || 'pkr',
      metadata: {
        hostelId: hostelId.toString(),
        roomId: roomId.toString(),
        seatsBooked: seatsBooked.toString(),
        userId: userIdString
      }
    });

    res.status(200).json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ 
      error: error.message || 'Payment processing failed',
      fullError: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Handle successful payment
exports.handlePaymentSuccess = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const {
      paymentIntentId,
      hostelId,
      roomId,
      checkInDate,
      checkOutDate,
      seatsBooked,
      amount
    } = req.body;

    // 1. Verify payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // 2. Get the room and check availability
    const room = await Room.findById(roomId).session(session);
    if (!room) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.availableBeds < seatsBooked) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Not enough beds available' });
    }

    // 3. Create booking
    const booking = new Booking({
      hostel: hostelId,
      user: req.user.id,
      room: roomId,
      checkInDate,
      checkOutDate,
      seatsBooked,
      amount,
      paymentStatus: 'completed',
      paymentId: paymentIntentId
    });

    // 4. Update room availability
    room.availableBeds -= seatsBooked;
    await room.save({ session });

    // 5. Save booking
    await booking.save({ session });

    // 6. Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: 'Booking confirmed',
      booking,
      updatedRoom: room
    });

  } catch (error) {
    // 7. Handle errors and rollback
    await session.abortTransaction();
    session.endSession();
    
    console.error('Booking error:', error);
    res.status(500).json({ 
      error: 'Failed to create booking',
      details: error.message 
    });
  }
};