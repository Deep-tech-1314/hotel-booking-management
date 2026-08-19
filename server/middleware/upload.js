const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Check if Cloudinary is properly configured
const isCloudinaryConfigured = () => {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  return (
    name && key && secret &&
    name !== 'your_cloud_name' &&
    key !== 'your_api_key' &&
    secret !== 'your_api_secret'
  );
};

let storage;

if (isCloudinaryConfigured()) {
  // Use Cloudinary storage when properly configured
  try {
    const { CloudinaryStorage } = require('multer-storage-cloudinary');
    const { cloudinary } = require('../config/cloudinary');

    storage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: async (req, file) => {
        let folder = 'bookmystay/misc';

        if (req.baseUrl.includes('hotels') || req.originalUrl.includes('hotels')) {
          folder = 'bookmystay/hotels';
        } else if (req.baseUrl.includes('rooms') || req.originalUrl.includes('rooms')) {
          folder = 'bookmystay/rooms';
        } else if (req.baseUrl.includes('avatar') || req.originalUrl.includes('avatar')) {
          folder = 'bookmystay/avatars';
        }

        return {
          folder,
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }],
        };
      },
    });
    console.log('📸 Upload middleware: Using Cloudinary storage');
  } catch (e) {
    console.warn('⚠️ Cloudinary storage setup failed, falling back to disk storage:', e.message);
    storage = null; // will be set below
  }
}

if (!storage) {
  if (process.env.VERCEL) {
    storage = multer.memoryStorage();
    console.log('📸 Upload middleware: Using memory storage for Vercel serverless');
  } else {
    try {
      // Fallback: local disk storage when Cloudinary is not configured
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      storage = multer.diskStorage({
        destination: (req, file, cb) => {
          let subDir = 'misc';
          if (req.baseUrl.includes('hotels') || req.originalUrl.includes('hotels')) {
            subDir = 'hotels';
          } else if (req.baseUrl.includes('rooms') || req.originalUrl.includes('rooms')) {
            subDir = 'rooms';
          } else if (req.baseUrl.includes('avatar') || req.originalUrl.includes('avatar')) {
            subDir = 'avatars';
          }

          const targetDir = path.join(uploadsDir, subDir);
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          cb(null, targetDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname) || '.jpg';
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      });
      console.log('📁 Upload middleware: Using local disk storage (Cloudinary not configured)');
    } catch (e) {
      storage = multer.memoryStorage();
      console.warn('⚠️ Disk storage unavailable, falling back to memory storage:', e.message);
    }
  }
}

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

module.exports = upload;
