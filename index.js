const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require("./routes/reviews");
const hostelRoutes = require('./routes/hostelRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const paymentRoutes = require('./routes/stripeRoutes');
const roomRoutes = require('./routes/roomRoutes'); // Add this line to import room routes

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ JWT Authentication Middleware
const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", ""); // Token extract karna

    if (!token) {
        return res.status(401).json({ error: "Access Denied! No Token Provided." });
    }

    try {
        const secretKey = process.env.JWT_SECRET || "YOUR_SECRET_KEY"; // Secret key from .env
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded; // Store user info in request
        next();
    } catch (error) {
        return res.status(400).json({ error: "Invalid Token!" });
    }
};

// ✅ Protected Route Example (You can apply this middleware on routes)
app.get('/api/protected', authMiddleware, (req, res) => {
    res.json({ message: "Welcome! You have access.", user: req.user });
});

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hostels', hostelRoutes);
app.use('/api/bookings', bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/rooms', roomRoutes); // Add this line to use room routes

app.use('/api/payment',paymentRoutes)

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
