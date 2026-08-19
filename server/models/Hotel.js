const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter hotel name'],
    trim: true,
    maxLength: [100, 'Hotel name cannot exceed 100 characters'],
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
  },
  description: {
    type: String,
    required: [true, 'Please enter hotel description'],
    maxLength: [2000, 'Description cannot exceed 2000 characters'],
  },
  starRating: {
    type: Number,
    min: [1, 'Star rating must be at least 1'],
    max: [5, 'Star rating cannot exceed 5'],
    default: 3,
  },
  priceRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    enum: {
      values: ['hotel', 'resort', 'villa', 'apartment', 'hostel', 'guesthouse', 'boutique', 'heritage', 'campsite', 'treehouse'],
      message: '{VALUE} is not a valid category',
    },
    required: [true, 'Please select a category'],
  },
  images: [{
    public_id: { type: String, required: true },
    url: { type: String, required: true },
  }],
  address: {
    street: String,
    city: {
      type: String,
      required: [true, 'Please enter city'],
    },
    state: {
      type: String,
      required: [true, 'Please enter state'],
    },
    country: {
      type: String,
      required: [true, 'Please enter country'],
    },
    zipCode: String,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
    },
  },
  amenities: [{
    type: String,
    trim: true,
  }],
  policies: {
    checkIn: {
      type: String,
      default: '2:00 PM',
    },
    checkOut: {
      type: String,
      default: '11:00 AM',
    },
    cancellation: {
      type: String,
      enum: ['flexible', 'moderate', 'strict'],
      default: 'moderate',
    },
    petsAllowed: {
      type: Boolean,
      default: false,
    },
    smokingAllowed: {
      type: Boolean,
      default: false,
    },
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  numReviews: {
    type: Number,
    default: 0,
  },
  views: {
    type: Number,
    default: 0,
  },
  // Approval workflow. `isApproved` retained for backward-compatible queries
  // (public hotel listing, existing controllers) and kept in sync below.
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved',
  },
  rejectionReason: {
    type: String,
    maxLength: [500, 'Rejection reason cannot exceed 500 characters'],
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
  isApproved: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Keep `status` and `isApproved` consistent regardless of which one a caller sets.
hotelSchema.pre('save', function (next) {
  if (this.isNew) {
    if (this.isApproved) {
      this.status = 'approved';
    } else if (this.status === 'approved') {
      this.isApproved = true;
    } else {
      this.isApproved = false;
    }
  } else {
    if (this.isModified('status')) {
      this.isApproved = this.status === 'approved';
    } else if (this.isModified('isApproved')) {
      this.status = this.isApproved ? 'approved' : (this.status === 'rejected' ? 'rejected' : 'pending');
    }
  }
  next();
});

// Create 2dsphere index for geospatial queries
hotelSchema.index({ location: '2dsphere' });
// Performance indexes for search and filtering
hotelSchema.index({ 'address.city': 1 });
hotelSchema.index({ category: 1 });
hotelSchema.index({ 'priceRange.min': 1 });
hotelSchema.index({ isFeatured: 1 });
// Text index for search
hotelSchema.index({ name: 'text', description: 'text', 'address.city': 'text' });
hotelSchema.index({ status: 1, createdAt: -1 });
hotelSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('Hotel', hotelSchema);
