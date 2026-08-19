const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables FIRST - try multiple paths
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config(); // fallback

// Set critical defaults if .env is missing
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'bookmystay_jwt_secret_key_change_in_production_2024';
if (!process.env.JWT_EXPIRE) process.env.JWT_EXPIRE = '7d';
if (!process.env.REFRESH_TOKEN_SECRET) process.env.REFRESH_TOKEN_SECRET = 'bookmystay_refresh_token_secret_change_in_production_2024';
if (!process.env.REFRESH_TOKEN_EXPIRE) process.env.REFRESH_TOKEN_EXPIRE = '7d';
if (!process.env.PORT) process.env.PORT = '5000';
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development';
if (!process.env.FRONTEND_URL) process.env.FRONTEND_URL = 'http://localhost:5173';

const app = express();
const PORT = process.env.PORT || 5000;

// --- Core middleware (these should never fail) ---
const cors = require('cors');
const cookieParser = require('cookie-parser');

app.use(cors({
  origin: true, // Reflect request origin to allow credentials
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Database connection middleware for all requests (especially serverless)
const connectDatabase = require('./config/database');
app.use(async (req, res, next) => {
  try {
    await connectDatabase();
  } catch (e) {
    console.warn('DB connect middleware error:', e.message);
  }
  next();
});

// Serve uploaded files statically (fallback when Cloudinary is not configured)
try {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
} catch (e) {}


// --- Optional middleware (may fail, that's OK) ---
try {
  const helmet = require('helmet');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
} catch (e) { console.warn('Helmet not available:', e.message); }

try {
  const { apiLimiter } = require('./middleware/rateLimiter');
  app.use('/api', apiLimiter);
} catch (e) { console.warn('Rate limiter not available:', e.message); }

// --- Stripe webhook (raw body, must be before json parser but we put it here) ---
try {
  const { stripeWebhook } = require('./controllers/paymentController');
  app.post('/api/v1/payments/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
} catch (e) { console.warn('Stripe webhook route failed to load:', e.message); }

// --- Cloudinary (optional) ---
try {
  const { connectCloudinary } = require('./config/cloudinary');
  connectCloudinary();
} catch (e) { console.warn('Cloudinary config failed:', e.message); }

// Health check (always works)
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// --- Load all API routes (static require for Vercel NFT bundling) ---
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/hotels', require('./routes/hotelRoutes'));
app.use('/api/v1/hotels/:hotelId/rooms', require('./routes/roomRoutes'));
app.use('/api/v1/bookings', require('./routes/bookingRoutes'));
app.use('/api/v1/reviews', require('./routes/reviewRoutes'));
app.use('/api/v1/payments', require('./routes/paymentRoutes'));
app.use('/api/v1/coupons', require('./routes/couponRoutes'));
app.use('/api/v1/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));
app.use('/api/v1/grand', require('./routes/grandRoutes'));
app.use('/api/v1/notifications', require('./routes/notificationRoutes'));
app.use('/api/v1/content', require('./routes/contentRoutes'));
app.use('/api/v1/newsletter', require('./routes/newsletterRoutes'));
app.use('/api/v1/analytics', require('./routes/analyticsRoutes'));
app.use('/api/v1/hotels/:hotelId/videos', require('./routes/videoRoutes'));
app.use('/api/v1/contact', require('./routes/contactRoutes'));
app.use('/api/v1/settings', require('./routes/settingsRoutes'));
app.use('/api/v1/messages', require('./routes/messageRoutes'));

// Dev seed endpoint
app.get('/api/v1/dev/seed', async (req, res) => {
  try {
    const seedData = require('./utils/seeder');
    await seedData();
    res.status(200).json({ success: true, message: 'Database seeded' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 404 handler
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
try {
  const errorHandler = require('./middleware/error');
  app.use(errorHandler);
} catch (e) {
  app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Server Error' });
  });
}

// ====== START SERVER IMMEDIATELY (if not on Vercel) ======
if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`\n✅ BookMyStay Server running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
    console.log(`   API: http://localhost:${PORT}/api/v1/health\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`⚠️ Port ${PORT} is already in use!`);
    } else {
      console.error(`Server error: ${err.message}`);
    }
  });

  // Connect database AFTER server is listening
  (async () => {
    try {
      const connectDatabase = require('./config/database');
      await connectDatabase();

      // Check if seeding is needed
      try {
        const User = require('./models/User');
        const existingUser = await User.findOne({ email: 'ananya.roy@gmail.com' });
        if (!existingUser) {
          console.log('🌱 Seeding database...');
          const seedData = require('./utils/seeder');
          await seedData();
        } else {
          console.log('✅ Database ready.');
        }
      } catch (seedErr) {
        console.warn('Seeder check skipped:', seedErr.message);
      }
    } catch (dbErr) {
      console.error('Database connection failed:', dbErr.message);
      console.log('Server continues running without database...');
    }
  })();
}

// Handle unhandled rejections gracefully (NEVER exit)
process.on('unhandledRejection', (err) => {
  console.error(`⚠️ Unhandled Rejection: ${err?.message || err}`);
});

process.on('uncaughtException', (err) => {
  console.error(`⚠️ Uncaught Exception: ${err?.message || err}`);
});

module.exports = app;
