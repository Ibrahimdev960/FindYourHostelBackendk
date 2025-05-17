const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
  const token = req.header('Authorization')?.split(" ")[1];  // Extract token correctly
  if (!token) return res.status(403).json({ message: 'Access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;  // Ensure admin data is set
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = adminAuth;
