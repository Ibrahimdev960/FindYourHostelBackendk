// authMiddleware.js - Updated version
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
    try {
        console.log("🔒 Starting authentication...");
        console.log("Request Headers:", req.headers);

        let token;
        
        // Check both Authorization header and cookies
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        } else if (req.cookies?.token) {
            token = req.cookies.token;
        }

        if (!token) {
            console.log("❌ No token found");
            // Instead of returning 401, we'll continue as unauthenticated
            return next(); 
        }

        console.log("✅ Extracted Token:", token);

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("✅ Decoded Token:", decoded);

        // Get user from database
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            console.log("❌ User not found in database");
            return next();
        }

        // Attach user to request
        req.user = {
            _id: user._id,
            id: user._id, // Add both for compatibility
            role: user.role,
            // Add other necessary user fields
        };
        
        console.log("✅ Authenticated User:", req.user);
        next();
    } catch (error) {
        console.error("🔴 Authentication Error:", error.message);
        // Continue as unauthenticated on error
        next();
    }
};

const isHostelOwner = (req, res, next) => {
    if (!req.user) {
        console.log("❌ No user in request");
        return res.status(401).json({ message: 'Not authenticated' });
    }
    
    console.log("Checking hostel owner role for user:", req.user);
    
    const validRoles = ['hostelowner', 'hosteller', 'Hosteller', 'HostelOwner' ,'Admin'];
    if (validRoles.includes(req.user.role)) {
        return next();
    }
    
    res.status(403).json({ message: 'Access denied, not a hostel owner or admin ' });
};

module.exports = { protect, isHostelOwner };