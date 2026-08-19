/**
 * One-off backfill for additive schema fields introduced in the Admin/Owner upgrade.
 * Safe to re-run (idempotent). Usage:  node utils/backfill.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const User = require('../models/User');
const PlatformSettings = require('../models/PlatformSettings');

(async () => {
  try {
    await connectDB();
    console.log('Connected. Running backfill...');

    // Hotels: derive status from legacy isApproved where status missing/default-but-approved
    const hApproved = await Hotel.updateMany(
      { isApproved: true, status: { $ne: 'approved' } },
      { $set: { status: 'approved' } }
    );
    const hPending = await Hotel.updateMany(
      { isApproved: false, status: { $exists: false } },
      { $set: { status: 'pending' } }
    );
    console.log(`Hotels: ${hApproved.modifiedCount} -> approved, ${hPending.modifiedCount} -> pending`);

    // Rooms: derive status from legacy isAvailable
    const rAvail = await Room.updateMany(
      { isAvailable: true, status: { $exists: false } },
      { $set: { status: 'available' } }
    );
    const rUnavail = await Room.updateMany(
      { isAvailable: false, status: { $exists: false } },
      { $set: { status: 'maintenance' } }
    );
    console.log(`Rooms: ${rAvail.modifiedCount} -> available, ${rUnavail.modifiedCount} -> maintenance`);

    // Users: default status active
    const u = await User.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'active' } }
    );
    console.log(`Users: ${u.modifiedCount} -> active`);

    // Ensure singleton PlatformSettings exists
    const existing = await PlatformSettings.findOne();
    if (!existing) {
      await PlatformSettings.create({});
      console.log('PlatformSettings: created singleton with defaults');
    } else {
      console.log('PlatformSettings: already present');
    }

    console.log('Backfill complete.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Backfill failed:', err);
    process.exit(1);
  }
})();
