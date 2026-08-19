const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Review = require('../models/Review');
const Transaction = require('../models/Transaction');
const Payout = require('../models/Payout');
const PlatformSettings = require('../models/PlatformSettings');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../middleware/asyncHandler');
const notificationService = require('../services/notificationService');
const { logAudit } = require('../services/auditService');
const { sendEmail } = require('../utils/sendEmail');

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Build a dense last-N-months series from a [{ _id:{year,month}, value }] aggregation.
const buildMonthlySeries = (rows, valueKey, months = 12) => {
  const map = new Map();
  rows.forEach((r) => map.set(`${r._id.year}-${r._id.month}`, r[valueKey] || 0));

  const series = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    series.push({
      label: `${MONTH_LABELS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      value: map.get(key) || 0,
    });
  }
  return series;
};

const buildDailySeries = (rows, valueKey, days = 30) => {
  const map = new Map();
  rows.forEach((r) => map.set(`${r._id.year}-${r._id.month}-${r._id.day}`, r[valueKey] || 0));

  const series = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    series.push({
      label: `${MONTH_LABELS[d.getMonth()]} ${d.getDate()}`,
      value: map.get(key) || 0,
    });
  }
  return series;
};

const monthlyGroup = (extraValue) => ({
  _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
  ...extraValue,
});

const dailyGroup = (extraValue) => ({
  _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } },
  ...extraValue,
});

// ──────────────────────── USER MANAGEMENT ────────────────────────────

// @desc    Get all users (paginated, filterable, searchable)
// @route   GET /api/v1/admin/users
// @access  Admin
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20, role, status, search, sort = '-createdAt' } = req.query;

  const query = {};
  if (role) query.role = role;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);

  // Count bookings and total spent per user
  const userIds = users.map(u => u._id);
  const bookingStats = await Booking.aggregate([
    { $match: { user: { $in: userIds } } },
    { $group: { _id: '$user', bookingCount: { $sum: 1 }, totalSpent: { $sum: '$totalPrice' } } },
  ]);
  const statsMap = {};
  bookingStats.forEach(s => { statsMap[s._id.toString()] = s; });

  const enrichedUsers = users.map(u => ({
    ...u.toObject(),
    bookingCount: statsMap[u._id.toString()]?.bookingCount || 0,
    totalSpent: statsMap[u._id.toString()]?.totalSpent || 0,
  }));

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    users: enrichedUsers,
  });
});

// @desc    Update user role
// @route   PUT /api/v1/admin/users/:id/role
// @access  Admin
exports.updateUserRole = asyncHandler(async (req, res, next) => {
  const { role } = req.body;

  if (!['user', 'owner', 'admin'].includes(role)) {
    return next(new ApiError('Invalid role', 400));
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ApiError('User not found', 404));
  }

  const before = { role: user.role };
  user.role = role;
  await user.save();

  await logAudit(req, 'user.role_updated', 'User', user._id, { before, after: { role } });

  res.status(200).json({
    success: true,
    message: `User role updated to ${role}`,
    user,
  });
});

// @desc    Update user (role, profile, etc.)
// @route   PUT /api/v1/admin/users/:id
// @access  Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const { role, status: newStatus, ownerProfile, verificationStatus } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ApiError('User not found', 404));
  }

  if (role) {
    if (!['user', 'owner', 'admin'].includes(role)) {
      return next(new ApiError('Invalid role', 400));
    }
    user.role = role;
  }

  if (newStatus) {
    if (!['active', 'inactive', 'suspended'].includes(newStatus)) {
      return next(new ApiError('Invalid status', 400));
    }
    user.status = newStatus;
  }

  if (verificationStatus || ownerProfile?.verificationStatus) {
    const vStatus = verificationStatus || ownerProfile?.verificationStatus;
    if (['pending', 'verified', 'rejected'].includes(vStatus)) {
      if (!user.ownerProfile) user.ownerProfile = {};
      user.ownerProfile.verificationStatus = vStatus;
    }
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    user,
  });
});

// @desc    Update user status (suspend/activate)
// @route   PUT /api/v1/admin/users/:id/status
// @access  Admin
exports.updateUserStatus = asyncHandler(async (req, res, next) => {
  const { status: newStatus } = req.body;

  if (!['active', 'suspended'].includes(newStatus)) {
    return next(new ApiError('Status must be active or suspended', 400));
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ApiError('User not found', 404));
  }

  if (user.role === 'admin') {
    return next(new ApiError('Cannot modify admin status', 400));
  }

  user.status = newStatus;
  if (newStatus === 'suspended' && user.role === 'owner') {
    user.ownerProfile = user.ownerProfile || {};
    user.ownerProfile.suspendedAt = new Date();
    user.ownerProfile.suspendReason = req.body.reason || 'Suspended by admin';
  }
  await user.save();

  await logAudit(req, 'user.status_updated', 'User', user._id, { after: { status: newStatus } });

  res.status(200).json({
    success: true,
    message: `User ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully`,
    user,
  });
});

// @desc    Delete user
// @route   DELETE /api/v1/admin/users/:id
// @access  Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ApiError('User not found', 404));
  }

  if (user.role === 'admin') {
    return next(new ApiError('Cannot delete admin users', 400));
  }

  await user.deleteOne();
  await logAudit(req, 'user.deleted', 'User', user._id, { before: { email: user.email, role: user.role } });

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});

// ──────────────────────── HOTEL MANAGEMENT ───────────────────────────

// @desc    Get all hotels for admin (paginated, filterable)
// @route   GET /api/v1/admin/hotels
// @access  Admin
exports.getAllHotelsAdmin = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 15, status, category, city, search, sort = '-createdAt' } = req.query;

  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;
  if (city) query['address.city'] = { $regex: city, $options: 'i' };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { 'address.city': { $regex: search, $options: 'i' } },
    ];
  }

  const [hotels, total] = await Promise.all([
    Hotel.find(query)
      .populate('owner', 'name email')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit)),
    Hotel.countDocuments(query),
  ]);

  // Get counts by status for filter badges
  const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
    Hotel.countDocuments({ status: 'pending' }),
    Hotel.countDocuments({ status: 'approved' }),
    Hotel.countDocuments({ status: 'rejected' }),
  ]);

  res.status(200).json({
    success: true,
    count: hotels.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    statusCounts: { pending: pendingCount, approved: approvedCount, rejected: rejectedCount },
    hotels,
  });
});

// @desc    Approve hotel listing
// @route   PUT /api/v1/admin/hotels/:id/approve
// @access  Admin
exports.approveHotel = asyncHandler(async (req, res, next) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) {
    return next(new ApiError('Hotel not found', 404));
  }

  hotel.status = 'approved';
  hotel.rejectionReason = undefined;
  hotel.approvedBy = req.user._id;
  hotel.approvedAt = new Date();
  await hotel.save();

  await logAudit(req, 'hotel.approved', 'Hotel', hotel._id, { after: { status: 'approved' } });
  await notificationService.notify({
    recipient: hotel.owner,
    recipientRole: 'owner',
    type: 'hotel.approved',
    title: 'Hotel approved',
    message: `Your hotel "${hotel.name}" has been approved and is now live.`,
    link: '/owner/hotels',
    meta: { hotelId: hotel._id },
  });

  res.status(200).json({
    success: true,
    message: 'Hotel approved successfully',
    hotel,
  });
});

// @desc    Reject hotel listing
// @route   PUT /api/v1/admin/hotels/:id/reject
// @access  Admin
exports.rejectHotel = asyncHandler(async (req, res, next) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) {
    return next(new ApiError('Hotel not found', 404));
  }

  hotel.status = 'rejected';
  hotel.rejectionReason = req.body.reason || 'Did not meet platform requirements';
  await hotel.save();

  await logAudit(req, 'hotel.rejected', 'Hotel', hotel._id, { after: { status: 'rejected', reason: hotel.rejectionReason } });
  await notificationService.notify({
    recipient: hotel.owner,
    recipientRole: 'owner',
    type: 'hotel.rejected',
    title: 'Hotel rejected',
    message: `Your hotel "${hotel.name}" was rejected: ${hotel.rejectionReason}`,
    link: '/owner/hotels',
    meta: { hotelId: hotel._id },
  });

  res.status(200).json({
    success: true,
    message: 'Hotel rejected',
    hotel,
  });
});

// @desc    Get all pending hotels
// @route   GET /api/v1/admin/hotels/pending
// @access  Admin
exports.getPendingHotels = asyncHandler(async (req, res, next) => {
  const hotels = await Hotel.find({ status: 'pending' })
    .populate('owner', 'name email')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: hotels.length,
    hotels,
  });
});

// ──────────────────────── BOOKING MANAGEMENT ─────────────────────────

// @desc    Get all bookings for admin (paginated, filterable)
// @route   GET /api/v1/admin/bookings
// @access  Admin
exports.getAllBookingsAdmin = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 15, status, hotel, search, dateFrom, dateTo, sort = '-createdAt' } = req.query;

  const query = {};
  if (status) query.bookingStatus = status;
  if (hotel) query.hotel = hotel;
  if (dateFrom || dateTo) {
    query.checkIn = {};
    if (dateFrom) query.checkIn.$gte = new Date(dateFrom);
    if (dateTo) query.checkIn.$lte = new Date(dateTo);
  }

  if (search) {
    // Search by booking ID or populate and filter by guest name
    if (search.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = search;
    }
    // For guest name search, we need to do it differently
  }

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate('user', 'name email phone avatar')
      .populate('hotel', 'name address images owner')
      .populate('room', 'title roomType pricePerNight')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit)),
    Booking.countDocuments(query),
  ]);

  // If searching by guest name, filter post-query
  let filteredBookings = bookings;
  if (search && !search.match(/^[0-9a-fA-F]{24}$/)) {
    const searchLower = search.toLowerCase();
    filteredBookings = bookings.filter(b =>
      b.user?.name?.toLowerCase().includes(searchLower) ||
      b._id.toString().startsWith(searchLower)
    );
  }

  // Get status counts
  const statusCounts = await Booking.aggregate([
    { $group: { _id: '$bookingStatus', count: { $sum: 1 } } },
  ]);
  const statusCountMap = {};
  statusCounts.forEach(s => { statusCountMap[s._id] = s.count; });

  res.status(200).json({
    success: true,
    count: filteredBookings.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    statusCounts: statusCountMap,
    bookings: filteredBookings,
  });
});

// @desc    Admin cancel an invalid booking
// @route   PUT /api/v1/admin/bookings/:id/cancel
// @access  Admin
exports.cancelBookingAdmin = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  const booking = await Booking.findById(req.params.id).populate('user', 'name email');

  if (!booking) {
    return next(new ApiError('Booking not found', 404));
  }

  booking.bookingStatus = 'cancelled';
  booking.cancellation = {
    cancelledAt: new Date(),
    cancelledBy: 'admin',
    reason: reason || 'Cancelled by admin due to invalid details',
  };
  await booking.save();

  // Send in-app notification to user
  await notificationService.notify({
    recipient: booking.user._id,
    recipientRole: 'user',
    type: 'booking',
    title: 'Booking Cancelled by Admin ⚠️',
    message: `Your reservation #${booking._id.toString().slice(-6).toUpperCase()} was cancelled by admin. Reason: ${reason || 'Invalid details'}.`,
    link: `/booking/${booking._id}`,
    priority: 'high',
  });

  res.status(200).json({
    success: true,
    message: 'Booking cancelled by admin successfully',
    booking,
  });
});

// ──────────────────────── PAYMENT MANAGEMENT ─────────────────────────

// @desc    Get payment statistics and transactions
// @route   GET /api/v1/admin/payments
// @access  Admin
exports.getPaymentStats = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 15, status, gateway, dateFrom, dateTo, sort = '-createdAt' } = req.query;

  // Summary KPIs
  const [totals] = await Transaction.aggregate([
    { $match: { type: 'booking' } },
    { $group: {
      _id: null,
      totalCollected: { $sum: '$grossAmount' },
      totalCommission: { $sum: '$commissionAmount' },
      totalOwnerNet: { $sum: '$netAmount' },
    }},
  ]);

  const [paidOutAgg] = await Payout.aggregate([
    { $match: { status: 'paid' } },
    { $group: { _id: null, totalPaidOut: { $sum: '$amount' } } },
  ]);

  const pendingPayouts = (totals?.totalOwnerNet || 0) - (paidOutAgg?.totalPaidOut || 0);

  // Transactions with filters
  const txnQuery = {};
  if (status) txnQuery.status = status;
  if (gateway) txnQuery.gateway = gateway;
  if (dateFrom || dateTo) {
    txnQuery.createdAt = {};
    if (dateFrom) txnQuery.createdAt.$gte = new Date(dateFrom);
    if (dateTo) txnQuery.createdAt.$lte = new Date(dateTo);
  }

  const [transactions, txnTotal] = await Promise.all([
    Transaction.find(txnQuery)
      .populate('booking', 'checkIn checkOut totalPrice bookingStatus')
      .populate('hotel', 'name')
      .populate('owner', 'name email')
      .populate('user', 'name email')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit)),
    Transaction.countDocuments(txnQuery),
  ]);

  // Owner payout summaries
  const ownerPayouts = await Transaction.aggregate([
    { $match: { type: 'booking', status: 'completed' } },
    { $group: {
      _id: '$owner',
      totalEarned: { $sum: '$netAmount' },
      totalGross: { $sum: '$grossAmount' },
      hotelCount: { $addToSet: '$hotel' },
    }},
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'ownerInfo' } },
    { $unwind: '$ownerInfo' },
    { $lookup: { from: 'payouts', localField: '_id', foreignField: 'owner', as: 'payouts' } },
    { $project: {
      ownerName: '$ownerInfo.name',
      ownerEmail: '$ownerInfo.email',
      totalEarned: 1,
      totalGross: 1,
      hotelCount: { $size: '$hotelCount' },
      totalPaidOut: {
        $sum: {
          $map: {
            input: { $filter: { input: '$payouts', as: 'p', cond: { $eq: ['$$p.status', 'paid'] } } },
            as: 'pp',
            in: '$$pp.amount',
          },
        },
      },
    }},
    { $addFields: { pendingBalance: { $subtract: ['$totalEarned', '$totalPaidOut'] } } },
  ]);

  res.status(200).json({
    success: true,
    summary: {
      totalCollected: totals?.totalCollected || 0,
      totalCommission: totals?.totalCommission || 0,
      totalPaidToOwners: paidOutAgg?.totalPaidOut || 0,
      pendingPayouts: Math.max(0, pendingPayouts),
    },
    transactions,
    txnTotal,
    page: parseInt(page),
    pages: Math.ceil(txnTotal / limit),
    ownerPayouts,
  });
});

// @desc    Process payouts
// @route   PUT /api/v1/admin/payouts/process
// @access  Admin
exports.processPayouts = asyncHandler(async (req, res, next) => {
  const { ownerId } = req.body; // If specified, process for single owner

  let payouts;
  if (ownerId) {
    payouts = await Payout.find({ owner: ownerId, status: 'pending' });
  } else {
    payouts = await Payout.find({ status: 'pending' });
  }

  if (payouts.length === 0) {
    return res.status(200).json({ success: true, message: 'No pending payouts to process', processed: 0 });
  }

  let totalAmount = 0;
  for (const payout of payouts) {
    payout.status = 'paid';
    payout.approvedBy = req.user._id;
    payout.approvedAt = new Date();
    payout.paidAt = new Date();
    totalAmount += payout.amount;
    await payout.save();

    // Notify owner
    await notificationService.notify({
      recipient: payout.owner,
      recipientRole: 'owner',
      type: 'payout.processed',
      title: 'Payout Processed',
      message: `Your payout of ₹${payout.amount.toLocaleString('en-IN')} has been processed.`,
      link: '/owner/dashboard',
    });
  }

  res.status(200).json({
    success: true,
    message: `Processed ${payouts.length} payouts totalling ₹${totalAmount.toLocaleString('en-IN')}`,
    processed: payouts.length,
    totalAmount,
  });
});

// ──────────────────────── STATISTICS & ANALYTICS ─────────────────────

// @desc    Get platform statistics (fully dynamic)
// @route   GET /api/v1/admin/stats
// @access  Admin
exports.getStats = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const [
    totalUsers, totalOwners, totalCustomers, newUsersThisMonth, newUsersThisWeek,
    totalHotels, approvedHotels, pendingHotels, rejectedHotels,
    totalRooms,
    totalBookings, activeBookings, pendingBookings, confirmedBookings,
    cancelledBookings, completedBookings, newBookingsThisWeek,
    totalReviews,
    settings,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'owner' }),
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    User.countDocuments({ createdAt: { $gte: startOfWeek } }),
    Hotel.countDocuments(),
    Hotel.countDocuments({ status: 'approved' }),
    Hotel.countDocuments({ status: 'pending' }),
    Hotel.countDocuments({ status: 'rejected' }),
    Room.countDocuments(),
    Booking.countDocuments(),
    Booking.countDocuments({ bookingStatus: { $in: ['confirmed', 'checked-in'] } }),
    Booking.countDocuments({ bookingStatus: 'pending' }),
    Booking.countDocuments({ bookingStatus: 'confirmed' }),
    Booking.countDocuments({ bookingStatus: 'cancelled' }),
    Booking.countDocuments({ bookingStatus: 'checked-out' }),
    Booking.countDocuments({ createdAt: { $gte: startOfWeek } }),
    Review.countDocuments(),
    PlatformSettings.findOne(),
  ]);

  const [totalRev] = await Booking.aggregate([
    { $match: { 'paymentInfo.status': 'paid' } },
    { $group: { _id: null, total: { $sum: '$totalPrice' }, avg: { $avg: '$totalPrice' }, commission: { $sum: '$commissionAmount' } } },
  ]);

  const [weekRev] = await Booking.aggregate([
    { $match: { 'paymentInfo.status': 'paid', createdAt: { $gte: startOfWeek } } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);

  const [monthRev] = await Booking.aggregate([
    { $match: { 'paymentInfo.status': 'paid', createdAt: { $gte: startOfMonth } } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);

  const totalRevenue = totalRev?.total || 0;
  const commissionRate = settings?.commissionRate ?? 15;
  const commission = totalRev?.commission || Math.round((totalRevenue * commissionRate) / 100);

  // Sparkline data: last 7 days for each KPI
  const [dailyBookings, dailyRevenue, dailyUsers] = await Promise.all([
    Booking.aggregate([
      { $match: { createdAt: { $gte: startOfWeek } } },
      { $group: { ...dailyGroup({ value: { $sum: 1 } }) } },
    ]),
    Booking.aggregate([
      { $match: { 'paymentInfo.status': 'paid', createdAt: { $gte: startOfWeek } } },
      { $group: { ...dailyGroup({ value: { $sum: '$totalPrice' } }) } },
    ]),
    User.aggregate([
      { $match: { createdAt: { $gte: startOfWeek } } },
      { $group: { ...dailyGroup({ value: { $sum: 1 } }) } },
    ]),
  ]);

  // Occupancy
  const occupied = await Booking.countDocuments({
    checkIn: { $lte: now },
    checkOut: { $gte: now },
    bookingStatus: { $in: ['confirmed', 'checked-in'] },
  });
  const occupancyRate = totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0;

  res.status(200).json({
    success: true,
    stats: {
      users: { total: totalUsers, owners: totalOwners, customers: totalCustomers, newThisMonth: newUsersThisMonth, newThisWeek: newUsersThisWeek },
      hotels: { total: totalHotels, approved: approvedHotels, pending: pendingHotels, rejected: rejectedHotels },
      rooms: { total: totalRooms },
      bookings: {
        total: totalBookings, active: activeBookings, pending: pendingBookings,
        confirmed: confirmedBookings, cancelled: cancelledBookings, completed: completedBookings,
        newThisWeek: newBookingsThisWeek,
      },
      revenue: {
        total: totalRevenue,
        monthly: monthRev?.total || 0,
        weekly: weekRev?.total || 0,
        commission,
        avgBooking: Math.round(totalRev?.avg || 0),
      },
      occupancyRate,
      sparklines: {
        bookings: buildDailySeries(dailyBookings, 'value', 7),
        revenue: buildDailySeries(dailyRevenue, 'value', 7),
        users: buildDailySeries(dailyUsers, 'value', 7),
      },
    },
  });
});

// @desc    Platform analytics: trend series + cancellation analysis + recent activity
// @route   GET /api/v1/admin/analytics
// @access  Admin
exports.getAnalytics = asyncHandler(async (req, res, next) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [revenueRows, dailyRevenueRows, dailyBookingRows, bookingRows, userRows, hotelRows, cancelRows] = await Promise.all([
    Booking.aggregate([
      { $match: { 'paymentInfo.status': 'paid' } },
      { $group: { ...monthlyGroup({ value: { $sum: '$totalPrice' } }) } },
    ]),
    Booking.aggregate([
      { $match: { 'paymentInfo.status': 'paid', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { ...dailyGroup({ value: { $sum: '$totalPrice' } }) } },
    ]),
    Booking.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { ...dailyGroup({ value: { $sum: 1 } }) } },
    ]),
    Booking.aggregate([{ $group: { ...monthlyGroup({ value: { $sum: 1 } }) } }]),
    User.aggregate([{ $group: { ...monthlyGroup({ value: { $sum: 1 } }) } }]),
    Hotel.aggregate([{ $group: { ...monthlyGroup({ value: { $sum: 1 } }) } }]),
    Booking.aggregate([
      { $match: { bookingStatus: 'cancelled' } },
      { $group: { ...monthlyGroup({ value: { $sum: 1 } }) } },
    ]),
  ]);

  const totalBookings = await Booking.countDocuments();
  const totalCancelled = await Booking.countDocuments({ bookingStatus: 'cancelled' });

  // Recent activities
  const [recentBookings, recentUsers, recentHotels] = await Promise.all([
    Booking.find().populate('user', 'name').populate('hotel', 'name').sort('-createdAt').limit(6),
    User.find().sort('-createdAt').limit(6),
    Hotel.find().populate('owner', 'name').sort('-createdAt').limit(6),
  ]);

  const activities = [
    ...recentBookings.map((b) => ({
      type: b.bookingStatus === 'cancelled' ? 'cancelled' : 'booking',
      title: `${b.bookingStatus === 'cancelled' ? 'Booking cancelled' : 'New booking'} — ${b.hotel?.name || 'Hotel'}`,
      subtitle: b.user?.name || 'Guest',
      at: b.createdAt,
    })),
    ...recentUsers.map((u) => ({
      type: 'registration',
      title: `New ${u.role} registered`,
      subtitle: u.name,
      at: u.createdAt,
    })),
    ...recentHotels.map((h) => ({
      type: h.status === 'approved' ? 'approval' : 'hotel',
      title: h.status === 'approved' ? `Hotel approved — ${h.name}` : `Hotel submitted — ${h.name}`,
      subtitle: h.owner?.name || 'Owner',
      at: h.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 15);

  res.status(200).json({
    success: true,
    analytics: {
      revenueTrend: buildMonthlySeries(revenueRows, 'value'),
      dailyRevenueTrend: buildDailySeries(dailyRevenueRows, 'value'),
      dailyBookingTrend: buildDailySeries(dailyBookingRows, 'value'),
      bookingTrend: buildMonthlySeries(bookingRows, 'value'),
      userGrowth: buildMonthlySeries(userRows, 'value'),
      hotelGrowth: buildMonthlySeries(hotelRows, 'value'),
      cancellation: {
        total: totalCancelled,
        rate: totalBookings > 0 ? Math.round((totalCancelled / totalBookings) * 100) : 0,
        trend: buildMonthlySeries(cancelRows, 'value'),
      },
      recentActivities: activities,
    },
  });
});

// @desc    Get revenue analytics
// @route   GET /api/v1/admin/revenue
// @access  Admin
exports.getRevenue = asyncHandler(async (req, res, next) => {
  const { period = 'monthly' } = req.query;

  let groupBy;
  switch (period) {
    case 'daily':
      groupBy = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } };
      break;
    case 'weekly':
      groupBy = { year: { $year: '$createdAt' }, week: { $week: '$createdAt' } };
      break;
    default:
      groupBy = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
  }

  const revenue = await Booking.aggregate([
    { $match: { 'paymentInfo.status': 'paid' } },
    { $group: { _id: groupBy, revenue: { $sum: '$totalPrice' }, bookings: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
  ]);

  res.status(200).json({ success: true, revenue });
});

// ──────────────────────── UTILITIES ──────────────────────────────────

// @desc    Send test email
// @route   POST /api/v1/admin/test-email
// @access  Admin
exports.testEmail = asyncHandler(async (req, res, next) => {
  try {
    await sendEmail({
      email: req.user.email || 'admin@bookmystay.com',
      subject: 'BookMyStay — Test Email',
      html: '<h1>Test Email</h1><p>This is a test email from BookMyStay admin panel. If you received this, your email configuration is working correctly.</p>',
    });

    res.status(200).json({
      success: true,
      message: `Test email sent to ${req.user.email}`,
    });
  } catch (error) {
    return next(new ApiError(`Email sending failed: ${error.message}`, 500));
  }
});

// @desc    Get all owners overview & management list
// @route   GET /api/v1/admin/owners
// @access  Admin
exports.getAllOwners = asyncHandler(async (req, res, next) => {
  const { status, verificationStatus, search } = req.query;

  const query = { role: 'owner' };
  if (status) query.status = status;
  if (verificationStatus) query['ownerProfile.verificationStatus'] = verificationStatus;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const [totalOwners, verifiedOwners, pendingOwners, activeOwners, suspendedOwners, owners] = await Promise.all([
    User.countDocuments({ role: 'owner' }),
    User.countDocuments({ role: 'owner', 'ownerProfile.verificationStatus': 'verified' }),
    User.countDocuments({ role: 'owner', 'ownerProfile.verificationStatus': 'pending' }),
    User.countDocuments({ role: 'owner', status: 'active' }),
    User.countDocuments({ role: 'owner', status: 'suspended' }),
    User.find(query).sort('-createdAt'),
  ]);

  const ownerIds = owners.map((o) => o._id);
  const hotels = await Hotel.find({ owner: { $in: ownerIds } }).select('_id owner name');
  const hotelsByOwner = new Map();
  hotels.forEach((h) => {
    const list = hotelsByOwner.get(h.owner.toString()) || [];
    list.push(h);
    hotelsByOwner.set(h.owner.toString(), list);
  });

  const hotelIdsAll = hotels.map((h) => h._id);
  const bookings = await Booking.aggregate([
    { $match: { hotel: { $in: hotelIdsAll } } },
    { $group: { _id: '$hotel', bookingCount: { $sum: 1 }, totalRevenue: { $sum: '$totalPrice' } } },
  ]);

  const statsByHotel = new Map();
  bookings.forEach((b) => statsByHotel.set(b._id.toString(), b));

  const tableData = owners.map((o) => {
    const ownerHotels = hotelsByOwner.get(o._id.toString()) || [];
    let ownerBookings = 0;
    let ownerRevenue = 0;
    ownerHotels.forEach((h) => {
      const st = statsByHotel.get(h._id.toString());
      if (st) {
        ownerBookings += st.bookingCount || 0;
        ownerRevenue += st.totalRevenue || 0;
      }
    });

    return {
      id: o._id.toString(),
      name: o.name,
      email: o.email,
      phone: o.phone || 'N/A',
      status: o.status || 'active',
      verificationStatus: o.ownerProfile?.verificationStatus || 'pending',
      totalHotels: ownerHotels.length,
      hotelsList: ownerHotels.map((h) => h.name),
      totalBookings: ownerBookings,
      totalRevenue: ownerRevenue,
      createdAt: o.createdAt,
    };
  });

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalOwners,
        verifiedOwners,
        pendingOwners,
        activeOwners,
        suspendedOwners,
      },
      owners: tableData,
    },
  });
});

