const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Payout = require('../models/Payout');
const Hotel = require('../models/Hotel');
const PlatformSettings = require('../models/PlatformSettings');

// Record (idempotently) the booking transaction for a paid booking and stamp the
// booking with commission + net. Returns the Transaction (existing or new).
// `booking` must have hotel populated OR a hotel id; pass the booking document.
const recordBookingTransaction = async (booking, { gateway = 'manual', paymentId } = {}) => {
  const hotelId = booking.hotel?._id || booking.hotel;
  const hotel = await Hotel.findById(hotelId).select('owner');
  if (!hotel) return null;

  const settings = await PlatformSettings.findOne();
  const commissionRate = settings?.commissionRate ?? 15;
  const gross = booking.totalPrice || 0;
  const commissionAmount = Math.round((gross * commissionRate) / 100);
  const netAmount = gross - commissionAmount;

  let txn = await Transaction.findOne({ booking: booking._id, type: 'booking' });
  
  if (txn) {
    txn.commissionRate = commissionRate;
    txn.commissionAmount = commissionAmount;
    txn.netAmount = netAmount;
    txn.status = 'completed';
    txn.gateway = gateway;
    txn.paymentId = paymentId;
    await txn.save();
  } else {
    txn = await Transaction.create({
      booking: booking._id,
      hotel: hotelId,
      owner: hotel.owner,
      user: booking.user?._id || booking.user,
      type: 'booking',
      grossAmount: gross,
      commissionRate,
      commissionAmount,
      netAmount,
      status: 'completed',
      gateway,
      paymentId,
    });
  }

  // Stamp the booking (best-effort; caller may also save)
  booking.commissionAmount = commissionAmount;
  booking.netAmount = netAmount;
  await booking.save().catch(() => {});

  return txn;
};

// Record a refund transaction (negative net = clawback from owner earnings).
const recordRefundTransaction = async (booking, refundAmount, { gateway = 'manual' } = {}) => {
  if (!refundAmount || refundAmount <= 0) return null;
  const hotelId = booking.hotel?._id || booking.hotel;
  const hotel = await Hotel.findById(hotelId).select('owner');
  if (!hotel) return null;

  return Transaction.create({
    booking: booking._id,
    hotel: hotelId,
    owner: hotel.owner,
    user: booking.user?._id || booking.user,
    type: 'refund',
    grossAmount: refundAmount,
    commissionRate: 0,
    commissionAmount: 0,
    netAmount: -Math.abs(refundAmount),
    status: 'refunded',
    gateway,
  });
};

// Aggregate an owner's earnings from transactions, minus what's already been paid out.
const computeOwnerEarnings = async (ownerId) => {
  const id = new mongoose.Types.ObjectId(ownerId);
  const [agg] = await Transaction.aggregate([
    { $match: { owner: id } },
    {
      $group: {
        _id: null,
        gross: { $sum: { $cond: [{ $eq: ['$type', 'booking'] }, '$grossAmount', 0] } },
        commission: { $sum: '$commissionAmount' },
        net: { $sum: '$netAmount' },
      },
    },
  ]);

  const [paidAgg] = await Payout.aggregate([
    { $match: { owner: id, status: 'paid' } },
    { $group: { _id: null, paidOut: { $sum: '$amount' } } },
  ]);

  const net = agg?.net || 0;
  const paidOut = paidAgg?.paidOut || 0;
  return {
    gross: agg?.gross || 0,
    commission: agg?.commission || 0,
    net,
    paidOut,
    balance: Math.max(0, net - paidOut),
  };
};

module.exports = {
  recordBookingTransaction,
  recordRefundTransaction,
  computeOwnerEarnings,
};
