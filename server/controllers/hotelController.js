const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../middleware/asyncHandler');
const { cloudinary } = require('../config/cloudinary');

const getCheapestPrice = async (hotelId) => {
  const rooms = await Room.find({ hotel: hotelId, isAvailable: true }).select('pricePerNight');
  return rooms.length > 0 ? Math.min(...rooms.map(r => r.pricePerNight)) : 0;
};

// @desc    Get all hotels (with search, filter, sort, pagination)
// @route   GET /api/v1/hotels
// @access  Public
exports.getAllHotels = asyncHandler(async (req, res, next) => {
  const {
    city, state, category, minPrice, maxPrice, amenities,
    rating, featured, search, sort, page = 1, limit = 9,
  } = req.query;

  const filter = { status: 'approved' };

  // City: case-insensitive regex
  if (city) filter['address.city'] = { $regex: city, $options: 'i' };
  // State: match on address.state
  if (state) filter['address.state'] = { $regex: state, $options: 'i' };
  // Category: exact match
  if (category) filter.category = category;
  // Price range filter
  if (minPrice) filter['priceRange.min'] = { $gte: Number(minPrice) };
  if (maxPrice) filter['priceRange.max'] = { ...(filter['priceRange.max'] || {}), $lte: Number(maxPrice) };
  // Amenities: $all match
  if (amenities) filter.amenities = { $all: amenities.split(',').map(a => a.trim()) };
  // Rating: >= value
  if (rating) filter.rating = { $gte: Number(rating) };
  // Featured
  if (featured === 'true') filter.isFeatured = true;
  // Full-text search
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { 'address.city': { $regex: search, $options: 'i' } },
    ];
  }

  // Sort mapping
  let sortOption = '-createdAt';
  if (sort === 'price_asc') sortOption = 'priceRange.min';
  else if (sort === 'price_desc') sortOption = '-priceRange.min';
  else if (sort === 'rating_desc') sortOption = '-rating';
  else if (sort === 'newest') sortOption = '-createdAt';

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 9;
  const skip = (pageNum - 1) * limitNum;

  const [totalCount, rawHotels] = await Promise.all([
    Hotel.countDocuments(filter),
    Hotel.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum),
  ]);

  const hotels = await Promise.all(rawHotels.map(async (hotel) => {
    const cheapestPrice = await getCheapestPrice(hotel._id);
    const effectivePrice = cheapestPrice || hotel.priceRange?.min || 0;
    return { ...hotel.toObject(), cheapestPrice: effectivePrice, price: effectivePrice };
  }));

  const totalPages = Math.ceil(totalCount / limitNum);

  res.status(200).json({
    success: true,
    data: {
      hotels,
      totalCount,
      totalPages,
      currentPage: pageNum,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    },
    // Keep backward-compatible flat fields
    hotels,
    totalHotels: totalCount,
    totalPages,
    currentPage: pageNum,
    resultPerPage: limitNum,
  });
});

// @desc    Get single hotel details
// @route   GET /api/v1/hotels/:id
// @access  Public
exports.getHotelDetails = asyncHandler(async (req, res, next) => {
  // Increment views counter
  await Hotel.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

  const hotel = await Hotel.findById(req.params.id)
    .populate('owner', 'name avatar email phone createdAt');

  if (!hotel) {
    return next(new ApiError('Hotel not found', 404));
  }

  // Rooms
  const rooms = await Room.find({ hotel: hotel._id, isAvailable: true });

  // Latest 8 reviews
  const reviews = await Review.find({ hotel: hotel._id })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(8);

  // Compute distance if lat/lng provided
  let distanceKm;
  if (req.query.lat && req.query.lng) {
    const [lng, lat] = hotel.location?.coordinates || [];
    if (lng && lat) {
      const R = 6371;
      const dLat = (Number(req.query.lat) - lat) * Math.PI / 180;
      const dLon = (Number(req.query.lng) - lng) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(lat * Math.PI/180) * Math.cos(Number(req.query.lat) * Math.PI/180) * Math.sin(dLon/2)**2;
      distanceKm = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 10) / 10;
    }
  }

  res.status(200).json({
    success: true,
    hotel,
    rooms,
    reviews,
    ...(distanceKm !== undefined && { distanceKm }),
  });
});

// @desc    Create new hotel
// @route   POST /api/v1/hotels
// @access  Owner
exports.createHotel = asyncHandler(async (req, res, next) => {
  req.body.owner = req.user._id;

  // Handle images from multer (supports both Cloudinary and disk storage)
  if (req.files && req.files.length > 0) {
    req.body.images = req.files.map((file) => {
      // Cloudinary files have `path` as a full URL; disk files have `path` as a local path
      const isCloudinary = file.path && file.path.startsWith('http');
      return {
        public_id: file.filename || file.originalname,
        url: isCloudinary ? file.path : `/uploads/${file.destination.split(/[/\\]uploads[/\\]/)[1] || 'misc'}/${file.filename}`,
      };
    });
  } else {
    // Provide a default placeholder image when no images are uploaded
    req.body.images = [{
      public_id: 'placeholder-hotel',
      url: 'https://images.unsplash.com/photo-1542314831-c6a4d1400820?auto=format&fit=crop&q=80&w=1200',
    }];
  }

  // Parse flat form fields into nested address object
  if (req.body.city || req.body.state || req.body.country) {
    req.body.address = {
      street: req.body.street || '',
      city: req.body.city,
      state: req.body.state,
      country: req.body.country || 'India',
      zipCode: req.body.zipCode || '',
    };
    // Clean up flat fields
    delete req.body.street;
    delete req.body.city;
    delete req.body.state;
    delete req.body.country;
    delete req.body.zipCode;
  }

  // Parse flat form fields into nested policies object
  if (req.body.checkIn || req.body.checkOut || req.body.cancellation || req.body.petsAllowed !== undefined || req.body.smokingAllowed !== undefined) {
    req.body.policies = {
      checkIn: req.body.checkIn || '2:00 PM',
      checkOut: req.body.checkOut || '11:00 AM',
      cancellation: req.body.cancellation || 'moderate',
      petsAllowed: req.body.petsAllowed === 'true' || req.body.petsAllowed === true,
      smokingAllowed: req.body.smokingAllowed === 'true' || req.body.smokingAllowed === true,
    };
    delete req.body.checkIn;
    delete req.body.checkOut;
    delete req.body.cancellation;
    delete req.body.petsAllowed;
    delete req.body.smokingAllowed;
  }

  // Parse price range if provided
  if (req.body.minPrice || req.body.maxPrice) {
    req.body.priceRange = {
      min: Number(req.body.minPrice) || 0,
      max: Number(req.body.maxPrice) || Number(req.body.minPrice) || 0,
      currency: 'INR',
    };
    delete req.body.minPrice;
    delete req.body.maxPrice;
  }

  // Parse star rating
  if (req.body.starRating) {
    req.body.starRating = Number(req.body.starRating);
  }

  // Parse location coordinates if provided — must have BOTH longitude and latitude
  if (req.body.longitude && req.body.latitude) {
    const lng = parseFloat(req.body.longitude);
    const lat = parseFloat(req.body.latitude);
    if (!isNaN(lng) && !isNaN(lat)) {
      req.body.location = {
        type: 'Point',
        coordinates: [lng, lat],
      };
    } else {
      // Invalid coordinates — remove location entirely
      delete req.body.location;
    }
  } else {
    // No coordinates provided — ensure location is not set at all
    delete req.body.location;
  }
  delete req.body.longitude;
  delete req.body.latitude;

  // Parse amenities if string
  if (typeof req.body.amenities === 'string') {
    req.body.amenities = req.body.amenities.split(',').map((a) => a.trim()).filter(Boolean);
  }

  // Generate a slug from the name if not provided
  if (req.body.name && !req.body.slug) {
    req.body.slug = req.body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now();
  }

  if (!req.body.status) {
    req.body.status = 'approved';
    req.body.isApproved = true;
  }

  const hotel = await Hotel.create(req.body);

  // Auto-generate starter rooms for newly created properties
  const baseMinPrice = Number(hotel.priceRange?.min) || 4500;
  const baseMaxPrice = Number(hotel.priceRange?.max) || baseMinPrice * 2 || 9000;
  const roomImgs = (hotel.images && hotel.images.length > 0)
    ? hotel.images
    : [{ url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80', public_id: 'default-room' }];

  try {
    await Room.create([
      {
        hotel: hotel._id,
        roomType: 'deluxe',
        title: 'Deluxe Room',
        description: `Spacious luxury accommodation at ${hotel.name} with premium bedding, modern amenities, and scenic views.`,
        pricePerNight: baseMinPrice,
        maxGuests: 2,
        totalRooms: 5,
        bedType: 'king',
        size: 400,
        amenities: ['WiFi', 'AC', 'Room Service', 'Smart TV', 'Private Bathroom'],
        images: [roomImgs[1] || roomImgs[0]],
        isAvailable: true,
        status: 'available',
      },
      {
        hotel: hotel._id,
        roomType: 'suite',
        title: 'Executive Luxury Suite',
        description: `Premium executive suite at ${hotel.name} featuring an expansive living area, panoramic views, and exclusive VIP concierge access.`,
        pricePerNight: baseMaxPrice,
        maxGuests: 4,
        totalRooms: 2,
        bedType: 'king',
        size: 700,
        amenities: ['Panoramic View', 'Living Area', 'WiFi', 'AC', 'Bathtub', 'Espresso Machine', '24/7 Butler Service'],
        images: [roomImgs[2] || roomImgs[0]],
        isAvailable: true,
        status: 'available',
      },
    ]);
  } catch (err) {
    console.warn('Auto room creation note:', err.message);
  }

  res.status(201).json({
    success: true,
    message: 'Hotel created and published successfully.',
    hotel,
  });
});

// @desc    Update hotel
// @route   PUT /api/v1/hotels/:id
// @access  Owner
exports.updateHotel = asyncHandler(async (req, res, next) => {
  let hotel = await Hotel.findById(req.params.id);

  if (!hotel) {
    return next(new ApiError('Hotel not found', 404));
  }

  // Check ownership
  if (hotel.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ApiError('You are not authorized to update this hotel', 403));
  }

  // Handle new images (supports both Cloudinary and disk storage)
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file) => {
      const isCloudinary = file.path && file.path.startsWith('http');
      return {
        public_id: file.filename || file.originalname,
        url: isCloudinary ? file.path : `/uploads/${file.destination.split(/[/\\]uploads[/\\]/)[1] || 'misc'}/${file.filename}`,
      };
    });
    req.body.images = [...(hotel.images || []), ...newImages];
  }

  // Handle image removal
  if (req.body.removeImages) {
    const removeImages = Array.isArray(req.body.removeImages) 
      ? req.body.removeImages 
      : JSON.parse(req.body.removeImages || '[]');

    if (removeImages.length > 0 && hotel.images) {
      for (const publicId of removeImages) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.warn(`Image removal notice for ${publicId}:`, err.message);
        }
      }
      
      const updatedImages = hotel.images.filter(img => !removeImages.includes(img.public_id));
      req.body.images = req.body.images 
        ? req.body.images.filter(img => !removeImages.includes(img.public_id))
        : updatedImages;
    }
  }

  // Parse flat form fields into nested address object
  if (req.body.city || req.body.state || req.body.country) {
    req.body.address = {
      street: req.body.street || hotel.address?.street || '',
      city: req.body.city || hotel.address?.city,
      state: req.body.state || hotel.address?.state,
      country: req.body.country || hotel.address?.country || 'India',
      zipCode: req.body.zipCode || hotel.address?.zipCode || '',
    };
    delete req.body.street;
    delete req.body.city;
    delete req.body.state;
    delete req.body.country;
    delete req.body.zipCode;
  }

  // Parse flat form fields into nested policies object
  if (req.body.checkIn || req.body.checkOut || req.body.cancellation || req.body.petsAllowed !== undefined || req.body.smokingAllowed !== undefined) {
    req.body.policies = {
      checkIn: req.body.checkIn || hotel.policies?.checkIn || '2:00 PM',
      checkOut: req.body.checkOut || hotel.policies?.checkOut || '11:00 AM',
      cancellation: req.body.cancellation || hotel.policies?.cancellation || 'moderate',
      petsAllowed: req.body.petsAllowed === 'true' || req.body.petsAllowed === true,
      smokingAllowed: req.body.smokingAllowed === 'true' || req.body.smokingAllowed === true,
    };
    delete req.body.checkIn;
    delete req.body.checkOut;
    delete req.body.cancellation;
    delete req.body.petsAllowed;
    delete req.body.smokingAllowed;
  }

  // Parse price range if provided
  if (req.body.minPrice || req.body.maxPrice) {
    req.body.priceRange = {
      min: Number(req.body.minPrice) || hotel.priceRange?.min || 0,
      max: Number(req.body.maxPrice) || hotel.priceRange?.max || 0,
      currency: 'INR',
    };
    delete req.body.minPrice;
    delete req.body.maxPrice;
  }

  // Parse star rating
  if (req.body.starRating) {
    req.body.starRating = Number(req.body.starRating);
  }

  // Parse location coordinates if provided — must have BOTH longitude and latitude
  if (req.body.longitude && req.body.latitude) {
    const lng = parseFloat(req.body.longitude);
    const lat = parseFloat(req.body.latitude);
    if (!isNaN(lng) && !isNaN(lat)) {
      req.body.location = {
        type: 'Point',
        coordinates: [lng, lat],
      };
    } else {
      delete req.body.location;
    }
  } else {
    delete req.body.location;
  }
  delete req.body.longitude;
  delete req.body.latitude;

  if (typeof req.body.amenities === 'string') {
    req.body.amenities = req.body.amenities.split(',').map((a) => a.trim()).filter(Boolean);
  }

  hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Hotel updated successfully',
    hotel,
  });
});

// @desc    Delete hotel
// @route   DELETE /api/v1/hotels/:id
// @access  Owner
exports.deleteHotel = asyncHandler(async (req, res, next) => {
  const hotel = await Hotel.findById(req.params.id);

  if (!hotel) {
    return next(new ApiError('Hotel not found', 404));
  }

  if (hotel.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ApiError('You are not authorized to delete this hotel', 403));
  }

  // Delete images from Cloudinary (safely ignore if Cloudinary keys are unconfigured)
  if (hotel.images && hotel.images.length > 0) {
    for (const image of hotel.images) {
      if (image.public_id) {
        try {
          await cloudinary.uploader.destroy(image.public_id);
        } catch (cloudinaryErr) {
          console.warn(`Cloudinary image deletion notice for ${image.public_id}:`, cloudinaryErr.message);
        }
      }
    }
  }

  // Delete all rooms associated with this hotel
  await Room.deleteMany({ hotel: hotel._id });

  // Cancel all bookings associated with this hotel
  await Booking.updateMany({ hotel: hotel._id }, { bookingStatus: 'cancelled' });

  // Delete all reviews associated with this hotel
  await Review.deleteMany({ hotel: hotel._id });

  await hotel.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Hotel and associated rooms deleted successfully',
  });
});

// @desc    Get featured hotels
// @route   GET /api/v1/hotels/featured
// @access  Public
exports.getFeaturedHotels = asyncHandler(async (req, res, next) => {
  const rawHotels = await Hotel.find({ isFeatured: true, status: 'approved' })
    .limit(6)
    .sort('-rating');

  const hotels = await Promise.all(rawHotels.map(async (hotel) => {
    const cheapestPrice = await getCheapestPrice(hotel._id);
    const effectivePrice = cheapestPrice || hotel.priceRange?.min || 0;
    return { ...hotel.toObject(), cheapestPrice: effectivePrice, price: effectivePrice };
  }));

  res.status(200).json({
    success: true,
    hotels,
  });
});

// @desc    Get nearby hotels (geospatial)
// @route   GET /api/v1/hotels/nearby
// @access  Public
exports.getNearbyHotels = asyncHandler(async (req, res, next) => {
  const { lat, lng, longitude, latitude, radius = 50 } = req.query;

  const useLng = parseFloat(lng || longitude);
  const useLat = parseFloat(lat || latitude);

  if (!useLng || !useLat) {
    return next(new ApiError('Please provide lat and lng query parameters', 400));
  }

  const hotels = await Hotel.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [useLng, useLat] },
        distanceField: 'distanceMeters',
        maxDistance: Number(radius) * 1000, // km to meters
        spherical: true,
        query: { status: 'approved' },
      },
    },
    { $limit: 10 },
    {
      $addFields: {
        distanceKm: { $round: [{ $divide: ['$distanceMeters', 1000] }, 1] },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    count: hotels.length,
    hotels,
  });
});

// @desc    Get distinct cities from approved hotels
// @route   GET /api/v1/hotels/cities
// @access  Public
exports.getCities = asyncHandler(async (req, res, next) => {
  const cities = await Hotel.distinct('address.city', { status: 'approved' });
  res.status(200).json({
    success: true,
    data: cities.sort(),
  });
});

// @desc    Get owner's hotels
// @route   GET /api/v1/hotels/owner/my-hotels
// @access  Owner
exports.getMyHotels = asyncHandler(async (req, res, next) => {
  const rawHotels = await Hotel.find({ owner: req.user._id }).sort('-createdAt');

  const hotels = await Promise.all(rawHotels.map(async (hotel) => {
    const cheapestPrice = await getCheapestPrice(hotel._id);
    const effectivePrice = cheapestPrice || hotel.priceRange?.min || 0;
    return { ...hotel.toObject(), cheapestPrice: effectivePrice, price: effectivePrice };
  }));

  res.status(200).json({
    success: true,
    count: hotels.length,
    hotels,
  });
});

// @desc    Get categories and counts
// @route   GET /api/v1/hotels/categories
// @access  Public
exports.getCategoriesCount = asyncHandler(async (req, res, next) => {
  const counts = await Hotel.aggregate([
    { $match: { status: 'approved' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $project: { _id: 0, category: '$_id', count: 1 } },
  ]);
  res.status(200).json({
    success: true,
    data: counts,
  });
});

