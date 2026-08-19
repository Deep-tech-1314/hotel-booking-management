const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true,
  },
  roomType: {
    type: String,
    enum: {
      values: ['standard', 'deluxe', 'suite', 'premium', 'dormitory'],
      message: '{VALUE} is not a valid room type',
    },
    required: [true, 'Please select room type'],
  },
  title: {
    type: String,
    required: [true, 'Please enter room title'],
    trim: true,
    maxLength: [100, 'Room title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    maxLength: [1000, 'Description cannot exceed 1000 characters'],
  },
  pricePerNight: {
    type: Number,
    required: [true, 'Please enter price per night'],
    min: [0, 'Price cannot be negative'],
  },
  // Percentage discount applied to pricePerNight (dynamic pricing)
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%'],
  },
  roomNumber: {
    type: String,
    trim: true,
  },
  features: [{
    type: String,
    trim: true,
  }],
  maxGuests: {
    type: Number,
    required: [true, 'Please enter max guests'],
    min: [1, 'Must allow at least 1 guest'],
  },
  totalRooms: {
    type: Number,
    required: [true, 'Please enter total rooms'],
    min: [1, 'Must have at least 1 room'],
  },
  images: [{
    public_id: { type: String, required: true },
    url: { type: String, required: true },
  }],
  amenities: [{
    type: String,
    trim: true,
  }],
  bedType: {
    type: String,
    enum: ['single', 'double', 'queen', 'king', 'twin'],
  },
  size: {
    type: Number, // in sq ft
    min: 0,
  },
  // Operational status. `isAvailable` retained for existing public queries and
  // kept in sync: a room is bookable only when status === 'available'.
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'cleaning'],
    default: 'available',
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Keep `status` and `isAvailable` consistent.
roomSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.isAvailable = this.status === 'available';
  } else if (this.isModified('isAvailable')) {
    if (!this.isAvailable && this.status === 'available') this.status = 'maintenance';
    if (this.isAvailable) this.status = 'available';
  }
  next();
});

roomSchema.index({ hotel: 1, status: 1 });

module.exports = mongoose.model('Room', roomSchema);
