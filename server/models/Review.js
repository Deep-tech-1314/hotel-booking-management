const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true,
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
  },
  ratings: {
    cleanliness: { type: Number, min: 1, max: 5 },
    location: { type: Number, min: 1, max: 5 },
    service: { type: Number, min: 1, max: 5 },
    value: { type: Number, min: 1, max: 5 },
  },
  title: {
    type: String,
    maxLength: [100, 'Review title cannot exceed 100 characters'],
  },
  comment: {
    type: String,
    required: [true, 'Please write a review'],
    maxLength: [1000, 'Review cannot exceed 1000 characters'],
  },
  images: [{
    public_id: String,
    url: String,
  }],
  ownerReply: {
    comment: String,
    repliedAt: Date,
  },
}, {
  timestamps: true,
});

// Prevent duplicate reviews: one review per user per booking
reviewSchema.index({ user: 1, booking: 1 }, { unique: true });

// Static method to calculate average rating for a hotel
reviewSchema.statics.calcAverageRating = async function (hotelId) {
  const stats = await this.aggregate([
    { $match: { hotel: hotelId } },
    {
      $group: {
        _id: '$hotel',
        avgRating: { $avg: '$rating' },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await mongoose.model('Hotel').findByIdAndUpdate(hotelId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      numReviews: stats[0].numReviews,
    });
  } else {
    await mongoose.model('Hotel').findByIdAndUpdate(hotelId, {
      rating: 0,
      numReviews: 0,
    });
  }
};

// Recalculate rating after save
reviewSchema.post('save', function () {
  this.constructor.calcAverageRating(this.hotel);
});

// Recalculate rating after remove
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRating(doc.hotel);
  }
});

module.exports = mongoose.model('Review', reviewSchema);
