const Booking = require('../models/bookingModel');
const Hostel = require('../models/hostelModel');
const Room = require('../models/roomModel');
const { sendNotification } = require('../controllers/notificationController');

// ✅ Book a Hostel
const bookHostel = async (req, res) => {
  try {
    const { hostelId, roomId, checkInDate, checkOutDate, paymentStatus, seatsBooked } = req.body;

    // Validation
    if (!hostelId || !roomId || !checkInDate || !checkOutDate || !seatsBooked) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (new Date(checkInDate) >= new Date(checkOutDate)) {
      return res.status(400).json({ message: "Check-out must be after check-in" });
    }

    // Verify hostel and room
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) return res.status(404).json({ message: "Hostel not found" });

    const room = await Room.findOne({ _id: roomId, hostel: hostelId });
    if (!room) return res.status(404).json({ message: "Room not found in this hostel" });

    if (seatsBooked > room.availableBeds) {
      return res.status(400).json({ message: "Not enough available beds" });
    }

    // Create booking
    const newBooking = new Booking({
      hostel: hostelId,
      room: roomId,
      user: req.user.id,
      seatsBooked,
      checkInDate,
      checkOutDate,
      paymentStatus: paymentStatus || 'pending'
    });

    const savedBooking = await newBooking.save();
    
    // Update room availability
    room.availableBeds -= seatsBooked;
    await room.save();

    // Notifications
    sendNotification(req.user.id, `Booking for ${hostel.name} confirmed!`, 'Booking');
    sendNotification(hostel.owner, `New booking for ${hostel.name}`, 'Admin');

    // Return populated booking
    const populatedBooking = await Booking.populate(savedBooking, [
      { path: 'hostel', select: 'name location images' },
      { path: 'room', select: 'roomNumber' }
    ]);

    res.status(201).json({ 
      message: "Booking successful", 
      booking: populatedBooking 
    });

  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({ 
      message: "Error booking hostel", 
      error: error.message 
    });
  }
};

// ✅ Cancel Booking
const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;

    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required" });
    }

    // ✅ Find booking and populate hostel
    const booking = await Booking.findById(bookingId).populate('hostel');
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // ✅ Authorization check
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    await booking.deleteOne();

    // ✅ Notifications
    sendNotification(req.user.id, "Your booking has been canceled.", "Booking");
    sendNotification(booking.hostel.owner.toString(), `Booking for ${booking.hostel.name} was canceled.`, "Admin");

    res.status(200).json({ message: "Booking canceled successfully" });
  } catch (error) {
    console.error("Cancel Booking Error:", error.message);
    res.status(500).json({ message: "Error canceling booking", error: error.message });
  }
};

// ✅ Get User Bookings
const getBookings = async (req, res) => {
  try {
    console.log("🔍 Fetching bookings for user:", req.user.id);

    const bookings = await Booking.find({ user: req.user.id })
      .populate('hostel', 'name location images');

    console.log("✅ Bookings found:", bookings);
    res.status(200).json(bookings);
  } catch (error) {
    console.error("❌ Error fetching bookings:", error.message);
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
};
const getHostelOwnerBookings = async (req, res) => {
  try {
    // Find all hostels owned by this user
    const hostels = await Hostel.find({ owner: req.user.id });
    const hostelIds = hostels.map(h => h._id);
    
    // Find all bookings for these hostels
    const bookings = await Booking.find({ hostel: { $in: hostelIds } })
      .populate('hostel', 'name location images')
      .populate('user', 'name email phone')
      .populate('room', 'roomNumber')
      .sort({ createdAt: -1 });
    
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching hostel owner bookings:", error);
    res.status(500).json({ 
      message: "Error fetching bookings", 
      error: error.message 
    });
  }
};

// In your bookingController.js
const getEligibleBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user.id,
      hostel: req.params.hostelId,
      paymentStatus: 'completed' // Only allow reviews for paid bookings
    })
    .populate('hostel', 'name location')
    .populate('room', 'roomNumber');

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch eligible bookings',
      error: error.message 
    });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    // Build query
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { 'hostel.name': { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ];
    }

    // Convert page and limit to numbers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Get total count of documents
    const total = await Booking.countDocuments(query);

    // Calculate total pages
    const totalPages = Math.ceil(total / limitNum);

    // Get paginated data with proper population
    const bookings = await Booking.find(query)
      .populate([
        { path: 'hostel', select: 'name location images owner' },
        { path: 'room', select: 'roomNumber pricePerBed' },
        { path: 'user', select: 'name email phone' }
      ])
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      totalBookings: total,
      totalPages,
      currentPage: pageNum,
      bookings
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching bookings',
      error: error.message 
    });
  }
};


module.exports = { 
  bookHostel,
  cancelBooking, 
  getBookings,
  getHostelOwnerBookings,
  getEligibleBookings,
  getAllBookings

};