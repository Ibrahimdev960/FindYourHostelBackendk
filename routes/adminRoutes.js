const express = require('express');
const { registerAdmin, loginAdmin, getAllUsers } = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.get('/users', adminAuth, getAllUsers);

module.exports = router;
