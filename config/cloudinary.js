const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config(); // This should be at the very top


// Ensure the .env variables are loaded before this configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log(process.env.CLOUDINARY_CLOUD_NAME); // Log to ensure it's loaded correctly
console.log(process.env.CLOUDINARY_API_KEY);
console.log(process.env.MONGO_URI);
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'hostels', // Cloudinary folder for image storage
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

module.exports = {
  cloudinary,
  storage,
};
