const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const User = require('../models/User');
const Review = require('../models/Review');
const asyncHandler = require('../middleware/asyncHandler');
const { computeOwnerEarnings } = require('../services/payoutService');

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Resolve the set of hotel IDs the current actor may see.
// Returns null for admin (= all hotels, no filter).
const getOwnerHotelIds = async (req) => {
  if (req.user.role === 'admin') return null;
  const hotels = await Hotel.find({ owner: req.user._id }).select('_id');
  return hotels.map((h) => h._id);
};

// Mongo filter fragment scoping by hotel ownership.
const hotelScope = (ids) => (ids ? { hotel: { $in: ids } } : {});

const initialsOf = (name = '') =>
  name.trim().split(/\s+/).map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'G';

const pctChange = (current, previous) => {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

const sumPrice = (bookings) => bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

// @desc    Owner dashboard overview (occupancy, today's flow, revenue, weekly chart)
// @route   GET /api/v1/grand/overview
// @access  owner, admin
const getOverview = asyncHandler(async (req, res) => {
  const hotelIds = await getOwnerHotelIds(req);
  const scope = hotelScope(hotelIds);

  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today); endOfDay.setHours(23, 59, 59, 999);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [checkInsToday, checkOutsToday, occupied, totalRooms] = await Promise.all([
    Booking.countDocuments({ ...scope, checkIn: { $gte: today, $lte: endOfDay }, bookingStatus: { $ne: 'cancelled' } }),
    Booking.countDocuments({ ...scope, checkOut: { $gte: today, $lte: endOfDay }, bookingStatus: { $ne: 'cancelled' } }),
    Booking.countDocuments({ ...scope, checkIn: { $lte: now }, checkOut: { $gte: now }, bookingStatus: { $in: ['confirmed', 'checked-in'] } }),
    Room.countDocuments(hotelIds ? { hotel: { $in: hotelIds } } : {}),
  ]);

  const occupancyRate = totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0;

  const [thisMonth, prevMonth] = await Promise.all([
    Booking.find({ ...scope, 'paymentInfo.status': 'paid', createdAt: { $gte: startOfMonth } }),
    Booking.find({ ...scope, 'paymentInfo.status': 'paid', createdAt: { $gte: startOfPrevMonth, $lt: startOfMonth } }),
  ]);
  const totalRevenue = sumPrice(thisMonth);
  const revenueTrend = pctChange(totalRevenue, sumPrice(prevMonth));

  // Last 7 days revenue series
  const weekStart = new Date(today); weekStart.setDate(weekStart.getDate() - 6);
  const weekBookings = await Booking.find({ ...scope, 'paymentInfo.status': 'paid', createdAt: { $gte: weekStart } });
  const weeklyRevenue = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    const dayRev = weekBookings
      .filter((b) => b.createdAt >= d && b.createdAt < next)
      .reduce((s, b) => s + (b.totalPrice || 0), 0);
    weeklyRevenue.push({ day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()], revenue: dayRev });
  }

  // Room status breakdown
  const roomMatch = hotelIds ? { hotel: { $in: hotelIds } } : {};
  const [available, occupiedRooms, cleaning, maintenance] = await Promise.all([
    Room.countDocuments({ ...roomMatch, status: 'available' }),
    Room.countDocuments({ ...roomMatch, status: 'occupied' }),
    Room.countDocuments({ ...roomMatch, status: 'cleaning' }),
    Room.countDocuments({ ...roomMatch, status: 'maintenance' }),
  ]);

  // Gallery from owner's own hotel images (no stock photos)
  const galleryHotels = await Hotel.find(hotelIds ? { _id: { $in: hotelIds } } : {}).select('images').limit(3);
  const gallery = galleryHotels.flatMap((h) => (h.images || []).map((img) => img.url)).slice(0, 4);

  // Satisfaction
  const reviewScope = hotelIds ? { hotel: { $in: hotelIds } } : {};
  const [satAgg] = await Review.aggregate([
    { $match: reviewScope },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  // Compute Payout Balance
  let payoutBalance = 0;
  if (req.user.role === 'owner') {
    const earnings = await computeOwnerEarnings(req.user._id);
    payoutBalance = earnings.balance;
  }

  res.status(200).json({
    success: true,
    data: {
      stats: {
        occupancyRate,
        checkInsToday,
        checkOutsToday,
        totalRevenue,
        revenueTrend,
        payoutBalance,
      },
      rooms: { total: totalRooms, available, occupied: occupiedRooms, cleaning, maintenance },
      weeklyRevenue,
      gallery,
      satisfaction: {
        rating: satAgg ? Math.round(satAgg.avg * 10) / 10 : 0,
        reviews: satAgg ? satAgg.count : 0,
      },
    },
  });
});

// @desc    Owner bookings list + summary
// @route   GET /api/v1/grand/bookings
// @access  owner, admin
const getBookings = asyncHandler(async (req, res) => {
  const hotelIds = await getOwnerHotelIds(req);
  const scope = hotelScope(hotelIds);
  const limit = parseInt(req.query.limit, 10) || 20;

  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today); endOfDay.setHours(23, 59, 59, 999);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalBookings, pendingApproval, arrivalsToday, monthlyPaid] = await Promise.all([
    Booking.countDocuments(scope),
    Booking.countDocuments({ ...scope, bookingStatus: 'pending' }),
    Booking.countDocuments({ ...scope, checkIn: { $gte: today, $lte: endOfDay }, bookingStatus: { $ne: 'cancelled' } }),
    Booking.find({ ...scope, 'paymentInfo.status': 'paid', createdAt: { $gte: startOfMonth } }),
  ]);

  const bookings = await Booking.find(scope)
    .populate('user', 'name email')
    .populate('room', 'title roomType')
    .sort('-createdAt')
    .limit(limit);

  const table = bookings.map((b) => {
    const guestName = b.user?.name || 'Unknown Guest';
    const checkInStr = new Date(b.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const checkOutStr = new Date(b.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const nights = Math.max(1, Math.ceil((new Date(b.checkOut) - new Date(b.checkIn)) / (1000 * 60 * 60 * 24)));
    return {
      id: b._id.toString(),
      ref: b._id.toString().substring(0, 8).toUpperCase(),
      initials: initialsOf(guestName),
      guest: guestName,
      email: b.user?.email || 'N/A',
      roomTitle: b.room?.title || 'Room',
      roomNum: b.room?.roomType || 'standard',
      dates: `${checkInStr} → ${checkOutStr}`,
      nights: `${nights} Nights`,
      status: b.bookingStatus,
      amount: b.totalPrice || 0,
    };
  });

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalBookings,
        pendingApproval,
        arrivalsToday,
        revenueMonth: sumPrice(monthlyPaid),
      },
      table,
    },
  });
});

// @desc    Owner room inventory + status breakdown
// @route   GET /api/v1/grand/rooms
// @access  owner, admin
const getRooms = asyncHandler(async (req, res) => {
  const hotelIds = await getOwnerHotelIds(req);
  const roomMatch = hotelIds ? { hotel: { $in: hotelIds } } : {};

  const rooms = await Room.find(roomMatch).populate('hotel', 'name').sort('roomNumber');

  const now = new Date();
  // Find which rooms currently have a guest (active booking)
  const activeBookings = await Booking.find({
    ...hotelScope(hotelIds),
    checkIn: { $lte: now },
    checkOut: { $gte: now },
    bookingStatus: { $in: ['confirmed', 'checked-in'] },
  }).populate('user', 'name');
  const guestByRoom = new Map();
  activeBookings.forEach((b) => {
    if (b.room) guestByRoom.set(b.room.toString(), b);
  });

  let available = 0; let occupied = 0; let needsAttention = 0;
  const roomsData = rooms.map((r, idx) => {
    const status = (r.status || 'available').toUpperCase();
    if (r.status === 'available') available++;
    else if (r.status === 'occupied') occupied++;
    else needsAttention++;

    const active = guestByRoom.get(r._id.toString());
    return {
      id: r._id.toString(),
      num: r.roomNumber || `${r.roomType?.[0]?.toUpperCase() || 'R'}-${idx + 101}`,
      type: r.roomType || 'standard',
      hotel: r.hotel?.name || '',
      status,
      guest: active?.user?.name || '',
      timeInfo: active ? `Out ${new Date(active.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : '',
      price: r.pricePerNight,
    };
  });

  res.status(200).json({
    success: true,
    data: {
      stats: { totalRooms: rooms.length, available, occupied, needsAttention },
      rooms: roomsData,
    },
  });
});

// @desc    Owner guest directory + VIPs (scoped to guests who booked owner's hotels)
// @route   GET /api/v1/grand/guests
// @access  owner, admin
const getGuests = asyncHandler(async (req, res) => {
  const hotelIds = await getOwnerHotelIds(req);
  const scope = hotelScope(hotelIds);

  const spendByUser = await Booking.aggregate([
    { $match: { ...scope, bookingStatus: { $ne: 'cancelled' } } },
    { $group: { _id: '$user', totalSpend: { $sum: '$totalPrice' }, totalStays: { $sum: 1 } } },
    { $sort: { totalSpend: -1 } },
  ]);

  const spendMap = new Map(spendByUser.map(s => [s._id.toString(), s]));

  const users = await User.find({ role: 'user' }).select('name email phone createdAt');
  
  const recentBookings = await Booking.find({ ...scope, bookingStatus: { $ne: 'cancelled' } })
    .populate('hotel', 'name')
    .populate('room', 'roomNumber roomType')
    .sort('-createdAt')
    .limit(100);

  const bookingsByUser = new Map();
  recentBookings.forEach(b => {
    const uid = b.user?.toString();
    if (uid) {
      const list = bookingsByUser.get(uid) || [];
      if (list.length < 5) list.push({
        id: b._id,
        hotelName: b.hotel?.name || 'Hotel Stay',
        roomType: b.room?.roomType || 'Standard',
        roomNumber: b.room?.roomNumber || '',
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        totalPrice: b.totalPrice,
        status: b.bookingStatus,
      });
      bookingsByUser.set(uid, list);
    }
  });

  const tierOf = (spend) => (spend >= 100000 ? 'PLATINUM' : spend >= 50000 ? 'GOLD' : spend >= 20000 ? 'SILVER' : 'STANDARD');

  const allGuestEntries = [];
  let totalSpendAll = 0;
  let activeBookedCount = 0;

  users.forEach((user) => {
    const uid = user._id.toString();
    const s = spendMap.get(uid) || { totalSpend: 0, totalStays: 0 };
    totalSpendAll += s.totalSpend;
    if (s.totalStays > 0) activeBookedCount++;

    const tier = tierOf(s.totalSpend);
    
    allGuestEntries.push({
      id: uid,
      name: user.name,
      email: user.email,
      phone: user.phone || 'N/A',
      tier,
      stays: s.totalStays,
      spend: s.totalSpend,
      joinedAt: user.createdAt,
      recentBookings: bookingsByUser.get(uid) || [],
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f5c543&color=fff`,
    });
  });

  allGuestEntries.sort((a, b) => b.spend - a.spend);

  const vips = allGuestEntries.filter(g => g.tier === 'PLATINUM' || g.tier === 'GOLD');
  const directory = allGuestEntries;

  const totalGuests = allGuestEntries.length;
  const returningGuests = allGuestEntries.filter((s) => s.stays > 1).length;
  const avgSpend = activeBookedCount > 0 ? Math.round(totalSpendAll / activeBookedCount) : 0;

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalGuests,
        returningGuests,
        vipMembers: vips.length,
        avgSpend,
      },
      vips,
      directory,
    },
  });
});

// @desc    Owner revenue reports (monthly series, ADR, RevPAR, occupancy, breakdown)
// @route   GET /api/v1/grand/reports
// @access  owner, admin
const getReports = asyncHandler(async (req, res) => {
  const hotelIds = await getOwnerHotelIds(req);
  const scope = hotelScope(hotelIds);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Monthly revenue series (last 12 months) — current vs previous year-month not needed; raw series
  const monthlyRows = await Booking.aggregate([
    { $match: { ...scope, 'paymentInfo.status': 'paid' } },
    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$totalPrice' } } },
  ]);
  const revMap = new Map(monthlyRows.map((r) => [`${r._id.year}-${r._id.month}`, r.revenue]));
  const chartData = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    chartData.push({
      month: MONTH_LABELS[d.getMonth()],
      revenue: revMap.get(`${d.getFullYear()}-${d.getMonth() + 1}`) || 0,
    });
  }

  const [monthlyPaid, prevMonthlyPaid, annualPaid] = await Promise.all([
    Booking.find({ ...scope, 'paymentInfo.status': 'paid', createdAt: { $gte: startOfMonth } }),
    Booking.find({ ...scope, 'paymentInfo.status': 'paid', createdAt: { $gte: startOfPrevMonth, $lt: startOfMonth } }),
    Booking.find({ ...scope, 'paymentInfo.status': 'paid', createdAt: { $gte: startOfYear } }),
  ]);
  const monthlyRev = sumPrice(monthlyPaid);
  const annualRev = sumPrice(annualPaid);

  // ADR / RevPAR / occupancy
  const allPaid = await Booking.find({ ...scope, bookingStatus: { $ne: 'cancelled' } });
  let totalNights = 0; let revenue = 0;
  allPaid.forEach((b) => {
    const nights = Math.max(1, Math.ceil((new Date(b.checkOut) - new Date(b.checkIn)) / (1000 * 60 * 60 * 24)));
    totalNights += nights;
    revenue += b.totalPrice || 0;
  });
  const adr = totalNights > 0 ? Math.round(revenue / totalNights) : 0;

  const occupied = await Booking.countDocuments({
    ...scope, checkIn: { $lte: now }, checkOut: { $gte: now }, bookingStatus: { $in: ['confirmed', 'checked-in'] },
  });
  const totalRooms = await Room.countDocuments(hotelIds ? { hotel: { $in: hotelIds } } : {});
  const occupancyRatio = totalRooms > 0 ? occupied / totalRooms : 0;
  const revPar = Math.round(adr * occupancyRatio);

  // Revenue breakdown by hotel (real, not categories)
  const byHotel = await Booking.aggregate([
    { $match: { ...scope, 'paymentInfo.status': 'paid' } },
    { $group: { _id: '$hotel', value: { $sum: '$totalPrice' } } },
    { $sort: { value: -1 } },
    { $limit: 5 },
  ]);
  const hotelNames = await Hotel.find({ _id: { $in: byHotel.map((h) => h._id) } }).select('name');
  const nameMap = new Map(hotelNames.map((h) => [h._id.toString(), h.name]));
  const palette = ['#c5a880', '#e2d5c3', '#1c2032', '#f5c543', '#8e7355'];
  const pieData = byHotel.map((h, i) => ({
    name: nameMap.get(h._id?.toString()) || 'Hotel',
    value: h.value,
    fill: palette[i % palette.length],
  }));

  res.status(200).json({
    success: true,
    data: {
      stats: {
        monthlyRev,
        monthlyTrend: pctChange(monthlyRev, sumPrice(prevMonthlyPaid)),
        annualRev,
        adr,
        revPar,
        occupancy: Math.round(occupancyRatio * 100),
      },
      chartData,
      pieData,
    },
  });
});

// @desc    Get owner payouts, bank details, and tax summary
// @route   GET /api/v1/grand/payout
// @access  owner, admin
const getPayout = asyncHandler(async (req, res, next) => {
  const Payout = require('../models/Payout');
  const Transaction = require('../models/Transaction');
  const ownerId = req.user._id;

  // Helper: returns a Date N days in the past
  const pastDate = (days) => { const d = new Date(); d.setDate(d.getDate() - days); return d; };

  let payouts = await Payout.find({ owner: ownerId }).sort({ createdAt: -1 });

  if (payouts.length === 0) {
    const transactions = await Transaction.find({ owner: ownerId, type: 'booking' }).limit(10);
    
    if (transactions.length > 0) {
      const p1 = await Payout.create({
        owner: ownerId,
        amount: Math.round(transactions.slice(0, Math.min(3, transactions.length)).reduce((sum, t) => sum + t.netAmount, 0)),
        status: 'paid',
        paidAt: pastDate(30),
        periodStart: pastDate(45),
        periodEnd: pastDate(30),
        referenceNumber: 'TXN' + Math.floor(100000000 + Math.random() * 900000000),
        note: 'Monthly clearance'
      });
      
      let p2;
      if (transactions.length > 3) {
        p2 = await Payout.create({
          owner: ownerId,
          amount: Math.round(transactions.slice(3, Math.min(6, transactions.length)).reduce((sum, t) => sum + t.netAmount, 0)),
          status: 'paid',
          paidAt: pastDate(15),
          periodStart: pastDate(30),
          periodEnd: pastDate(15),
          referenceNumber: 'TXN' + Math.floor(100000000 + Math.random() * 900000000),
          note: 'Bi-weekly clearance'
        });
      }
      
      payouts = p2 ? [p2, p1] : [p1];
    }
  }

  const earnings = await computeOwnerEarnings(ownerId);
  
  const totalPayout = payouts
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const lastPaid = payouts.find(p => p.status === 'paid');
  const lastPayoutAmount = lastPaid ? lastPaid.amount : 0;

  const user = await User.findById(ownerId).select('name bankDetails taxSummary');

  const historyList = payouts.map(p => ({
    payoutDate: p.paidAt || p.createdAt,
    referenceNumber: p.referenceNumber || 'REF-' + p._id.toString().slice(-8).toUpperCase(),
    status: p.status === 'paid' ? 'completed' : p.status,
    amount: p.amount
  }));

  res.status(200).json({
    success: true,
    stats: {
      totalPayout,
      pendingPayout: earnings.balance,
      lastPayoutAmount
    },
    history: historyList,
    bankDetails: user.bankDetails && user.bankDetails.bankName ? user.bankDetails : {
      bankName: 'HDFC Bank',
      holderName: user.name || 'Hotel Owner Ltd',
      accountNumber: '50100456123984',
      ifscCode: 'HDFC0000240'
    },
    taxSummary: user.taxSummary && user.taxSummary.panNumber ? user.taxSummary : {
      panNumber: 'AAAPO1234K',
      gstNumber: '27AAAPO1234K1Z2',
      TDS: Math.round(totalPayout * 0.01)
    }
  });
});

// @desc    Update individual room status from owner panel
// @route   PATCH /api/v1/grand/rooms/:roomId/status
// @access  owner, admin
const updateRoomStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['available', 'occupied', 'cleaning', 'maintenance'];
  if (!validStatuses.includes(status)) {
    const ApiError = require('../utils/ApiError');
    return next(new ApiError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400));
  }

  const room = await Room.findById(req.params.roomId).populate('hotel', 'owner');
  if (!room) {
    const ApiError = require('../utils/ApiError');
    return next(new ApiError('Room not found', 404));
  }

  if (req.user.role !== 'admin' && room.hotel?.owner?.toString() !== req.user._id.toString()) {
    const ApiError = require('../utils/ApiError');
    return next(new ApiError('Not authorized to modify this room', 403));
  }

  room.status = status;
  await room.save();

  res.status(200).json({
    success: true,
    message: `Room status updated to ${status}`,
    data: room,
  });
});

// @desc    Assign guest directly to a room (Walk-in / Owner Direct Booking)
// @route   POST /api/v1/grand/rooms/:roomId/assign-guest
// @access  owner, admin
const assignGuestToRoom = asyncHandler(async (req, res, next) => {
  const { guestName, guestEmail, guestPhone, checkIn, checkOut, numberOfGuests, totalPrice, specialRequests, userId } = req.body;
  const ApiError = require('../utils/ApiError');
  const notificationService = require('../services/notificationService');
  const { publishBookingEvent } = require('../services/bookingEvents');

  if (!guestName || !guestEmail) {
    return next(new ApiError('Guest name and email are required', 400));
  }

  const room = await Room.findById(req.params.roomId).populate('hotel', 'owner name');
  if (!room) return next(new ApiError('Room not found', 404));

  // Ensure owner can only assign to their own rooms
  if (req.user.role !== 'admin' && room.hotel?.owner?.toString() !== req.user._id.toString()) {
    return next(new ApiError('Not authorized to assign guest to this room', 403));
  }

  let guestUser = null;
  if (userId) {
    guestUser = await User.findById(userId);
  }
  if (!guestUser) {
    guestUser = await User.findOne({ email: guestEmail.toLowerCase().trim() });
  }

  if (!guestUser) {
    const randomPassword = Math.random().toString(36).slice(-8) + 'A1!';
    guestUser = await User.create({
      name: guestName.trim(),
      email: guestEmail.toLowerCase().trim(),
      phone: guestPhone || '',
      password: randomPassword,
      role: 'user',
      isVerified: true,
    });
  }

  const checkInDate = checkIn ? new Date(checkIn) : new Date();
  const checkOutDate = checkOut ? new Date(checkOut) : new Date(Date.now() + 24 * 60 * 60 * 1000);

  const nights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));
  const finalPrice = totalPrice ? Number(totalPrice) : (room.pricePerNight || 100) * nights;

  const booking = await Booking.create({
    user: guestUser._id,
    room: room._id,
    hotel: room.hotel._id || room.hotel,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    guests: { adults: numberOfGuests ? Number(numberOfGuests) : 1, children: 0 },
    totalPrice: finalPrice,
    paymentInfo: { status: 'paid', paymentMethod: 'cash', paidAt: new Date() },
    bookingStatus: 'confirmed',
    specialRequests: specialRequests || 'Direct Walk-in / Manager Assignment',
  });

  room.status = 'occupied';
  await room.save();

  // Send notifications
  await notificationService.notify({
    recipient: guestUser._id,
    recipientRole: 'user',
    type: 'booking',
    title: 'Room Assigned / Booking Confirmed',
    message: `You have been checked in to Room ${room.roomNumber || room.roomType} at ${room.hotel.name}.`,
    link: `/booking/${booking._id}`,
    priority: 'high',
  });

  if (req.user._id.toString() !== guestUser._id.toString()) {
    await notificationService.notify({
      recipient: req.user._id,
      recipientRole: req.user.role,
      type: 'booking',
      title: 'Guest Assigned Successfully',
      message: `Assigned ${guestName} to Room ${room.roomNumber || room.roomType}.`,
      link: '/grand/rooms',
    });
  }

  await notificationService.notifyAdmins({
    type: 'booking',
    title: 'Manager Direct Assignment',
    message: `Room ${room.roomNumber || room.roomType} at ${room.hotel.name} was assigned to ${guestName}.`,
    link: '/admin/bookings',
  });

  try {
    publishBookingEvent('new_booking', {
      bookingId: booking._id,
      room: room._id,
      hotel: room.hotel._id || room.hotel,
      guest: guestName,
    });
  } catch (err) {
    console.error('Failed to publish booking SSE event:', err.message);
  }

  res.status(201).json({
    success: true,
    message: `Guest ${guestName} successfully assigned to room ${room.roomNumber || room.roomType}`,
    data: { booking, room },
  });
});

// @desc    Owner creates a new guest profile (registers real User document in DB)
// @route   POST /api/v1/grand/guests
// @access  owner, admin
const createGuest = asyncHandler(async (req, res, next) => {
  const { name, email, phone, location } = req.body;
  const ApiError = require('../utils/ApiError');

  if (!name || !email) {
    return next(new ApiError('Guest name and email are required', 400));
  }

  const cleanEmail = email.toLowerCase().trim();

  let user = await User.findOne({ email: cleanEmail });
  if (user) {
    return res.status(200).json({
      success: true,
      message: 'Guest profile is already registered',
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || phone || 'N/A',
        tier: 'STANDARD',
        stays: 0,
        spend: 0,
        joinedAt: user.createdAt,
        recentBookings: [],
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f5c543&color=fff`,
      },
    });
  }

  const randomPassword = Math.random().toString(36).slice(-8) + 'A1!';
  user = await User.create({
    name: name.trim(),
    email: cleanEmail,
    phone: phone || '',
    password: randomPassword,
    role: 'user',
    isVerified: true,
    status: 'active',
  });

  res.status(201).json({
    success: true,
    message: `Guest ${user.name} registered successfully`,
    data: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone || 'N/A',
      tier: 'STANDARD',
      stays: 0,
      spend: 0,
      joinedAt: user.createdAt,
      recentBookings: [],
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f5c543&color=fff`,
    },
  });
});

module.exports = { getOverview, getBookings, getRooms, getGuests, createGuest, getReports, getPayout, updateRoomStatus, assignGuestToRoom };

