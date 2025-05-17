const Hostel = require('../models/hostelModel');
const Room = require('../models/roomModel');
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });

const addHostel = async (req, res) => {
  try {
    console.log('Starting addHostel process...');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('Authenticated user:', req.user);

    const { name, location, amenities, availability } = req.body;

    if (!name || !location) {
      console.error('Validation failed: Name and location are required');
      return res.status(400).json({ message: "Name and location are required" });
    }

    if (!req.files || req.files.length === 0) {
      console.error('Validation failed: No images uploaded');
      return res.status(400).json({ message: "At least one image is required" });
    }

    const allowedFormats = ['image/jpeg', 'image/png', 'image/jpg'];
    const invalidFiles = req.files.filter(file => !allowedFormats.includes(file.mimetype));
    if (invalidFiles.length > 0) {
      console.error('Validation failed: Invalid file formats uploaded', invalidFiles);
      return res.status(400).json({ message: "Invalid file format. Only jpg, png, and jpeg are allowed." });
    }
    
    const imageUrls = req.files.map(file => file.path);
    console.log('Processed image URLs:', imageUrls);

    const newHostel = new Hostel({
      name,
      location,
      amenities: amenities.split(',').map(item => item.trim()),
      availability,
      images: imageUrls,
      owner: req.user.id,
      status: 'pending'
    });

    console.log('New hostel object created:', newHostel);
    
    await newHostel.save();
    console.log('Hostel saved successfully with ID:', newHostel._id);

    res.status(201).json({ 
      message: "Hostel added successfully and pending approval", 
      hostel: newHostel 
    });
  } catch (error) {
    console.error("Error in addHostel:", {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
      requestFiles: req.files,
      user: req.user
    });
    res.status(500).json({ 
      message: "Error adding hostel",
      error: error.message
    });
  }
};

const updateHostel = async (req, res) => {
  try {
    console.log('Starting updateHostel process...');
    console.log('Hostel ID:', req.params.id);
    console.log('Request body:', req.body);

    const { id } = req.params;
    const { name, location, amenities, availability } = req.body;

    if (!id) {
      console.error('Validation failed: Hostel ID is required');
      return res.status(400).json({ message: "Hostel ID is required" });
    }

    const updatedHostel = await Hostel.findByIdAndUpdate(
      id,
      { name, location, amenities, availability },
      { new: true, runValidators: true }
    );

    if (!updatedHostel) {
      console.error('Hostel not found with ID:', id);
      return res.status(404).json({ message: "Hostel not found" });
    }

    console.log('Hostel updated successfully:', updatedHostel);
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
    console.log('Starting getHostelById process...');
    console.log('Hostel ID:', req.params.id);
    console.log('User making request:', req.user);

    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) {
      console.error('Hostel not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Hostel not found' });
    }

    // Check if user can view this hostel
    if (hostel.status !== 'approved' && 
        (!req.user || 
         (req.user.role !== 'Admin' && 
          (req.user.role !== 'Hosteller' || hostel.owner.toString() !== req.user.id.toString())))) {
      console.error('Unauthorized access attempt to hostel:', {
        hostelStatus: hostel.status,
        userId: req.user?.id,
        userRole: req.user?.role,
        hostelOwner: hostel.owner
      });
      return res.status(403).json({ message: 'Unauthorized to view this hostel' });
    }

    const rooms = await Room.find({ hostel: hostel._id });
    console.log('Successfully retrieved hostel and rooms:', { hostel, rooms });
    res.json({ hostel, rooms });
  } catch (error) {
    console.error('Error in getHostelById:', {
      message: error.message,
      stack: error.stack,
      params: req.params,
      user: req.user
    });
    res.status(500).json({ message: 'Error fetching hostel', error });
  }
};

const getAllHostels = async (req, res) => {
  console.log('🔍 Starting getAllHostels - Full Request Info:', {
    headers: req.headers,
    cookies: req.cookies,
    user: req.user
});
  try {
    console.log('Starting getAllHostels process...');
    console.log('User making request:', req.user);

    // First ensure the user object is properly populated
    if (!req.user) {
      console.log('No authenticated user - showing only approved hostels');
      const hostels = await Hostel.find({ status: 'approved' });
      return res.json(hostels);
    }

    // For admin, show all hostels
    if (req.user.role === 'Admin') {
      const hostels = await Hostel.find();
      console.log('Admin view - returning all hostels:', hostels.length);
      return res.json(hostels);
    }
    
    // For hosteller, show their own hostels (any status) + approved hostels from others
    if (req.user.role === 'Hosteller') {
      const hostels = await Hostel.find({
        $or: [
          { owner: req.user._id }, // Show all hostels owned by this hosteller (including pending)
          { status: 'approved' }   // Plus all approved hostels from others
        ]
      }).sort({ status: 1 }); // Sort to show pending hostels first
      console.log('Hosteller view - returning own hostels and approved:', hostels.length);
      return res.json(hostels);
    }
    
    // For everyone else, show only approved hostels
    const hostels = await Hostel.find({ status: 'approved' });
    console.log('Public view - returning approved hostels:', hostels.length);
    res.json(hostels);
  } catch (error) {
    console.error('Error in getAllHostels:', {
      message: error.message,
      stack: error.stack,
      user: req.user
    });
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
  getHostelCount
};