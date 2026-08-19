const mongoose = require('mongoose');

let isConnected = false;

const connectDatabase = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }

  // If on Vercel and MONGO_URI is missing, log warning instead of crashing
  if (process.env.VERCEL && !process.env.MONGO_URI) {
    console.warn('⚠️ MONGO_URI is not set on Vercel. Set MONGO_URI in Vercel project environment variables for database connectivity.');
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bookmystay', {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    try {
      const Hotel = require('../models/Hotel');
      const count = await Hotel.countDocuments();
      if (count === 0) {
        console.log('🌱 Atlas database is empty, auto-seeding sample hotels...');
        const seedData = require('../utils/seeder');
        await seedData();
      }
    } catch (sErr) {
      console.warn('Auto-seed check skipped:', sErr.message);
    }
  } catch (error) {
    console.warn(`Cloud MongoDB connection failed (${error.message}).`);

    // Only attempt MongoMemoryServer in local environment (not Vercel)
    if (!process.env.VERCEL) {
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        const conn = await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
        isConnected = true;
        console.log(`MongoDB Connected (In-Memory Fallback): ${conn.connection.host}`);

        const seedData = require('../utils/seeder');
        await seedData();
      } catch (fallbackError) {
        console.error(`In-Memory DB Connection Error: ${fallbackError.message}`);
      }
    }
  }
};

module.exports = connectDatabase;
