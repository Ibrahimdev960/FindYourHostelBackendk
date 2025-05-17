const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

// POST: Create room
router.post('/', roomController.createRoom);

// PUT: Update room
router.put('/:id', roomController.updateRoom);

// DELETE: Delete room
router.delete('/:id', roomController.deleteRoom);

// GET: Rooms by hostel
router.get('/hostel/:hostelId', roomController.getRoomsByHostel);

module.exports = router;
