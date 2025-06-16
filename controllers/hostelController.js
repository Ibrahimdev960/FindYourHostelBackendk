const Hostel = require('../models/hostelModel');
const Room = require('../models/roomModel');
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });

// Add Hostel
const addHostel = async (req, res) => {
  try {
    const { name, amenities, availability } = req.body;
    let location;

    // Parse and validate location
    try {
      location = typeof req.body.location === 'string' 
        ? JSON.parse(req.body.location) 
        : req.body.location;
    } catch (err) {
      return res.status(400).json({ message: 'Invalid location format' });
    }

    if (!name || !location || !location.coordinates || location.coordinates.length !== 2) {
      return res.status(400).json({ message: 'Name and valid location coordinates are required' });
    }

    // Validate images
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    const allowedFormats = ['image/jpeg', 'image/png', 'image/jpg'];
    const invalidFiles = req.files.filter(file => !allowedFormats.includes(file.mimetype));
    if (invalidFiles.length > 0) {
      return res.status(400).json({ message: "Invalid file format. Only jpg, png, and jpeg are allowed." });
    }

    const newHostel = new Hostel({
      name,
      location,
      amenities: amenities.split(',').map(item => item.trim()),
      availability,
      images: req.files.map(file => file.path),
      owner: req.user.id,
      status: 'pending'
    });

    await newHostel.save();

    res.status(201).json({ 
      message: "Hostel added successfully and pending approval", 
      hostel: newHostel 
    });

  } catch (error) {
    res.status(500).json({ message: "Error adding hostel", error: error.message });
  }
};

// Update Hostel
const updateHostel = async (req, res) => {
  try {
    console.log('Starting updateHostel process...');
    console.log('Hostel ID:', req.params.id);
    console.log('Request body:', req.body);

    const { id } = req.params;
    const { name, amenities, availability } = req.body;
    let location;

    // Validate ID
    if (!id) {
      return res.status(400).json({ message: "Hostel ID is required" });
    }

    // Parse and validate location
    try {
      location = typeof req.body.location === 'string' 
        ? JSON.parse(req.body.location) 
        : req.body.location;
    } catch (err) {
      return res.status(400).json({ message: 'Invalid location format' });
    }

    if (!location || !location.coordinates || location.coordinates.length !== 2) {
      return res.status(400).json({ message: 'Valid location coordinates are required' });
    }

    const updateFields = {
      ...(name && { name }),
      location,
      ...(amenities && { amenities: amenities.split(',').map(item => item.trim()) }),
      ...(availability && { availability })
    };

    const updatedHostel = await Hostel.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedHostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    res.status(200).json({ message: "Hostel updated successfully", hostel: updatedHostel });

  } catch (error) {
    console.error("Error in updateHostel:", {
      message: error.message,
      stack: error.stack,
      params: req.params,
      body: req.body
    });
    res.status(500).json({ message: "Error updating hostel", error: error.message });
  }
};


const deleteHostel = async (req, res) => {
  try {
    console.log('Starting deleteHostel process...');
    console.log('Hostel ID:', req.params.id);

    const { id } = req.params;

    const deletedHostel = await Hostel.findByIdAndDelete(id);
    if (!deletedHostel) {
      console.error('Hostel not found with ID:', id);
      return res.status(404).json({ message: "Hostel not found" });
    }

    console.log('Hostel deleted successfully:', deletedHostel);
    res.status(200).json({ message: "Hostel deleted successfully", hostel: deletedHostel });

  } catch (error) {
    console.error("Error in deleteHostel:", {
      message: error.message,
      stack: error.stack,
      params: req.params
    });
    res.status(500).json({ message: "Error deleting hostel", error: error.message });
  }
};

const approveHostel = async (req, res) => {
  try {
    console.log('Starting approveHostel process...');
    console.log('Hostel ID:', req.params.id);

    const { id } = req.params;
    const hostel = await Hostel.findByIdAndUpdate(
      id,
      { status: 'approved', rejectionReason: '' },
      { new: true }
    ).populate('owner');

    if (!hostel) {
      console.error('Hostel not found with ID:', id);
      return res.status(404).json({ message: "Hostel not found" });
    }

    console.log('Hostel approved successfully:', hostel);
    res.json({ message: 'Hostel approved', hostel });
  } catch (error) {
    console.error('Error approving hostel:', {
      message: error.message,
      stack: error.stack,
      params: req.params
    });
    res.status(500).json({ message: 'Error approving hostel', error: error.message });
  }
};

// In your hostelController.js
const rejectHostel = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // Get reason from request body

    if (!reason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const hostel = await Hostel.findByIdAndUpdate(
      id,
      { 
        status: 'rejected', 
        rejectionReason: reason 
      },
      { new: true }
    ).populate('owner');

    res.json({ message: 'Hostel rejected', hostel });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting hostel', error: error.message });
  }
};

const getPendingHostels = async (req, res) => {
  try {
    const hostels = await Hostel.find({ status: 'pending' })
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });
    
    res.status(200).json(hostels);
  } catch (error) {
    console.error('Error fetching pending hostels:', error);
    res.status(500).json({ 
      message: 'Error fetching pending hostels',
      error: error.message 
    });
  }
};

const getHostelById = async (req, res) => {
 try {
      const hostel = await Hostel.findById(req.params.id);
      if (!hostel) {
        return res.status(404).json({ message: 'Hostel not found' });
      }

      if (hostel.status !== 'approved' && 
          (!req.user || 
           (req.user.role !== 'Admin' && 
            (req.user.role !== 'Hosteller' || hostel.owner.toString() !== req.user.id.toString())))) {
        return res.status(403).json({ message: 'Unauthorized to view this hostel' });
      }

      const rooms = await Room.find({ hostel: hostel._id });
      res.json({ hostel, rooms });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching hostel', error });
    }
};

// In getAllHostels controller
const getAllHostels = async (req, res) => {
  try {
    let hostelsQuery = Hostel.find();
    
    // For non-admin users, only show approved hostels
    if (!req.user || req.user.role !== 'Admin') {
      hostelsQuery = hostelsQuery.where('status').equals('approved');
    }

    // Populate additional data and aggregate room counts
    const hostels = await hostelsQuery
      .lean()
      .populate('owner', 'name email phone')
      .exec();

    // Get room counts and min prices for each hostel
    const hostelsWithDetails = await Promise.all(hostels.map(async (hostel) => {
      const rooms = await Room.find({ hostel: hostel._id });
      const roomCount = rooms.length;
      const minPrice = rooms.length > 0 
        ? Math.min(...rooms.map(room => room.pricePerBed)) 
        : null;
      
      return {
        ...hostel,
        roomCount,
        minPrice,
        // Calculate average rating if not already in model
        rating: hostel.averageRating || 0,
        reviewCount: hostel.reviewCount || 0
      };
    }));

    res.json(hostelsWithDetails);
  } catch (error) {
    console.error('Error in getAllHostels:', error);
    res.status(500).json({ message: 'Error fetching hostels', error });
  }
};

const searchHostels = async (req, res) => {
  try {
    console.log('Starting searchHostels process...');
    console.log('Query parameters:', req.query);
    console.log('User making request:', req.user);

    const { location, amenities } = req.query;
    let query = { status: 'approved' }; // Default to only approved

    // If admin is searching, show all statuses
    if (req.user && req.user.role === 'Admin') {
      delete query.status;
      console.log('Admin search - including all statuses');
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
      console.log('Location filter applied:', location);
    }

    if (amenities) {
      query.amenities = { $all: amenities.split(',') };
      console.log('Amenities filter applied:', amenities.split(','));
    }

    const hostels = await Hostel.find(query);
    console.log('Search results:', hostels.length);
    res.status(200).json(hostels);
  } catch (error) {
    console.error('Error in searchHostels:', {
      message: error.message,
      stack: error.stack,
      query: req.query,
      user: req.user
    });
    res.status(500).json({ message: 'Error searching hostels', error: error.message });
  }
};
getHostelCount = async (req, res) => {
  try {
    const count = await Hostel.countDocuments();
    res.status(200).json({ total: count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve hostel count' });
  }
};

// Get hostels near a location
getHostelsNearby =  async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 5000 } = req.query;
    
    if (!longitude || !latitude) {
      return res.status(400).json({ message: 'Longitude and latitude are required' });
    }

    const hostels = await Hostel.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      },
      status: 'approved'
    });

    res.json(hostels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



module.exports = {
  addHostel,
  updateHostel,
  deleteHostel,
  getAllHostels,
  getHostelById,
  searchHostels,
  approveHostel,
  rejectHostel,
  getPendingHostels,
  getHostelCount,
  getHostelsNearby
};