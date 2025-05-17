const Room = require('../models/roomModel');
const Hostel = require('../models/hostelModel');

// Add a new room
exports.createRoom = async (req, res) => {
  try {
    const { hostelId, roomNumber, totalBeds, pricePerBed } = req.body;

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ message: 'Hostel not found' });
    }

    const room = new Room({
      hostel: hostelId,
      roomNumber,
      totalBeds,
      availableBeds: totalBeds,
      pricePerBed
    });

    await room.save();
    res.status(201).json({ message: 'Room added successfully', room });
  } catch (error) {
    res.status(500).json({ message: 'Error creating room', error: error.message });
  }
};

// Update room
exports.updateRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    const updatedRoom = await Room.findByIdAndUpdate(roomId, req.body, { new: true });
    if (!updatedRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(200).json({ message: 'Room updated', room: updatedRoom });
  } catch (error) {
    res.status(500).json({ message: 'Error updating room', error: error.message });
  }
};

// Delete room
exports.deleteRoom = async (req, res) => {
  try {
    const roomId = req.params.id;
    const deletedRoom = await Room.findByIdAndDelete(roomId);
    if (!deletedRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting room', error: error.message });
  }
};

// Get all rooms for a specific hostel
exports.getRoomsByHostel = async (req, res) => {
  try {
    const { hostelId } = req.params;
    const rooms = await Room.find({ hostel: hostelId });
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rooms', error: error.message });
  }
};
