const express = require('express');
const { protect, isHostelOwner } = require('../middleware/authMiddleware');
const { 
    addHostel, 
    updateHostel, 
    deleteHostel, 
    getAllHostels, 
    getHostelById,
    searchHostels , approveHostel , rejectHostel ,getPendingHostels,getHostelCount 
} = require('../controllers/hostelController');
const multer = require('multer'); // ✅ Required import
const { storage } = require('../config/cloudinary');
const adminAuth = require('../middleware/adminAuth');

const upload = multer({ storage });


const router = express.Router();

router.post('/add', protect,upload.array('images'), isHostelOwner, addHostel);
router.put('/update/:id', protect, isHostelOwner, updateHostel);
router.delete('/delete/:id', protect, isHostelOwner, deleteHostel);
router.get('/all', protect,getAllHostels);
router.get('/search', searchHostels);
router.get('/pending', protect, adminAuth, getPendingHostels);
router.get('/count', protect, adminAuth, getHostelCount);


router.get('/:id', getHostelById);


router.patch('/approve/:id', protect, adminAuth, approveHostel);
router.patch('/reject/:id', protect, adminAuth, rejectHostel);

module.exports = router;