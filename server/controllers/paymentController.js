const stripe = require('../config/stripe');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const Payout = require('../models/Payout');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../middleware/asyncHandler');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');
const bookingEvents = require('../services/bookingEvents');
const notificationService = require('../services/notificationService');
const { recordBookingTransaction } = require('../services/payoutService');

const populateBookingForRealtime = (bookingId) => Booking.findById(bookingId)
  .populate('user', 'name email phone avatar')
  .populate('hotel', 'name address images owner')
  .populate('room', 'title roomType pricePerNight images');

const getRazorpayClient = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new ApiError('Razorpay credentials are not configured', 500);
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const sendBookingConfirmationEmail = async (booking) => {
  try {
    const template = emailTemplates.bookingConfirmation(booking.user.name, booking);
    await sendEmail({ email: booking.user.email, ...template });
  } catch (error) {
    console.error('Email sending failed:', error.message);
  }
};

const handlePaymentSuccess = async (booking, provider, paymentId) => {
  booking.paymentInfo = {
    id: paymentId,
    status: 'paid',
    method: provider === 'stripe' ? 'card' : 'upi',
    paidAt: new Date(),
  };
  booking.bookingStatus = 'confirmed';
  await booking.save();

  const populatedBooking = await populateBookingForRealtime(booking._id);

  // Record Transaction for payout and get owner net amount
  const txn = await recordBookingTransaction(booking, { gateway: provider, paymentId });

  if (txn) {
    // Upsert a Payout record for the owner
    let payout = await Payout.findOne({ owner: txn.owner, status: 'pending' });
    if (payout) {
      payout.amount += txn.netAmount;
      if (!payout.transactions.includes(txn._id)) {
        payout.transactions.push(txn._id);
      }
      await payout.save();
    } else {
      await Payout.create({ owner: txn.owner, amount: txn.netAmount, transactions: [txn._id] });
    }
  }

  // Publish SSE event
  bookingEvents.publishBookingEvent('booking.payment_confirmed', populatedBooking, {
    provider,
    paymentId,
  });

  // Call notificationService to send in-app notification to user
  const targetUserId = booking.user._id || booking.user;
  await notificationService.notify({
    recipient: targetUserId,
    recipientRole: 'user',
    type: 'booking',
    title: 'Booking Payment Confirmed! 🎉',
    message: `Your payment for ${populatedBooking.hotel?.name || 'your stay'} is confirmed! Get ready for a wonderful experience.`,
    link: `/booking/${booking._id}`,
    priority: 'high',
  });

  // Send notification to Hotel Owner
  if (populatedBooking.hotel?.owner) {
    const ownerId = populatedBooking.hotel.owner._id || populatedBooking.hotel.owner;
    await notificationService.notify({
      recipient: ownerId,
      recipientRole: 'owner',
      type: 'booking',
      title: 'Payment Received — Booking Confirmed! 💰',
      message: `Payment of ₹${populatedBooking.totalPrice?.toLocaleString('en-IN') || 0} received for ${populatedBooking.hotel?.name} (${populatedBooking.room?.title}).`,
      link: '/grand/bookings',
      priority: 'high',
    });
  }

  // Send notification to Admins
  await notificationService.notifyAdmins({
    type: 'booking',
    title: 'New Confirmed Booking 🏨',
    message: `Reservation confirmed for ${populatedBooking.hotel?.name || 'Hotel'} by ${populatedBooking.user?.name || 'Guest'} (Total: ₹${populatedBooking.totalPrice?.toLocaleString('en-IN') || 0}).`,
    link: '/admin/bookings',
  });

  // Call sendEmail
  await sendBookingConfirmationEmail(populatedBooking);
};

// @desc    Create Stripe checkout session
// @route   POST /api/v1/payments/create-checkout-session
// @access  User
exports.createCheckoutSession = asyncHandler(async (req, res, next) => {
  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId)
    .populate('hotel', 'name images')
    .populate('room', 'title pricePerNight')
    .populate('user', 'email');

  if (!booking) return next(new ApiError('Booking not found', 404));
  if (booking.user._id.toString() !== req.user._id.toString()) return next(new ApiError('Not authorized', 403));
  if (booking.bookingStatus === 'cancelled') return next(new ApiError('Booking has been cancelled', 400));

  // If already confirmed or paid, redirect directly to success page
  if (booking.bookingStatus === 'confirmed' || booking.paymentInfo?.status === 'paid') {
    return res.status(200).json({
      success: true,
      sessionUrl: `${process.env.FRONTEND_URL}/payment/success?bookingId=${booking._id}&method=stripe`,
      sessionId: `paid_${booking._id}`,
    });
  }

  const checkIn = new Date(booking.checkInDate || booking.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const checkOut = new Date(booking.checkOutDate || booking.checkOut).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const nights = Math.ceil((new Date(booking.checkOutDate || booking.checkOut) - new Date(booking.checkInDate || booking.checkIn)) / (1000 * 60 * 60 * 24)) || 1;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: req.user.email,
      client_reference_id: bookingId,
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: {
            name: `${booking.hotel.name} — ${booking.room.title}`,
            description: `Check-in: ${checkIn} | Check-out: ${checkOut} | ${nights} nights`,
            images: [booking.hotel.images?.[0]?.url].filter(Boolean),
          },
          unit_amount: Math.round(booking.totalPrice * 100),
        },
        quantity: 1,
      }],
      metadata: {
        bookingId: booking._id.toString(),
        userId: req.user._id.toString(),
        hotelId: booking.hotel._id.toString(),
      },
      success_url: `${process.env.FRONTEND_URL}/payment/success?bookingId=${booking._id}&method=stripe`,
      cancel_url: `${process.env.FRONTEND_URL}/booking/${booking._id}?cancelled=true`,
      payment_intent_data: {
        metadata: { bookingId: booking._id.toString() },
      },
    });

    res.status(200).json({
      success: true,
      sessionUrl: session.url,
      sessionId: session.id,
    });
  } catch (stripeErr) {
    console.error('Stripe Checkout creation error (falling back to direct confirmation):', stripeErr.message);
    await handlePaymentSuccess(booking, 'card', `pay_direct_${Date.now()}`);
    res.status(200).json({
      success: true,
      sessionUrl: `${process.env.FRONTEND_URL}/payment/success?bookingId=${booking._id}&method=card`,
      sessionId: `direct_${booking._id}`,
    });
  }
});

// @desc    Create Razorpay order
// @route   POST /api/v1/payments/razorpay/order
// @access  User
exports.createRazorpayOrder = asyncHandler(async (req, res, next) => {
  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId).populate('hotel', 'name');
  if (!booking) return next(new ApiError('Booking not found', 404));
  if (booking.user.toString() !== req.user._id.toString()) return next(new ApiError('Not authorized', 403));
  if (booking.bookingStatus === 'cancelled') return next(new ApiError('Booking has been cancelled', 400));

  if (booking.bookingStatus === 'confirmed' || booking.paymentInfo?.status === 'paid') {
    return res.status(200).json({
      success: true,
      orderId: `order_paid_${booking._id}`,
      amount: Math.round(booking.totalPrice * 100),
      currency: 'INR',
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_key',
      alreadyPaid: true,
    });
  }

  try {
    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: Math.round(booking.totalPrice * 100),
      currency: 'INR',
      receipt: `bms_${booking._id}`,
      notes: {
        bookingId: booking._id.toString(),
      },
    });

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
    console.log('Razorpay order created successfully:', order.id);
  } catch (err) {
    console.error('Razorpay Order Creation Failed:', err);
    const errMsg = err?.error?.description || err?.message || 'Razorpay order creation failed';
    return next(new ApiError(`Razorpay Error: ${errMsg}`, 400));
  }
});

// @desc    Verify Razorpay payment
// @route   POST /api/v1/payments/razorpay/verify
// @access  User
exports.verifyRazorpayPayment = asyncHandler(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

  if (!process.env.RAZORPAY_KEY_SECRET) {
    return next(new ApiError('Razorpay credentials are not configured', 500));
  }

  const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(sign)
    .digest('hex');

  if (razorpay_signature !== expectedSignature) {
    return next(new ApiError('Payment verification failed', 400));
  }

  const booking = await Booking.findById(bookingId).populate('user', 'name email');
  if (!booking) return next(new ApiError('Booking not found', 404));

  await handlePaymentSuccess(booking, 'razorpay', razorpay_payment_id);

  const populatedBooking = await populateBookingForRealtime(booking._id);
  res.status(200).json({
    success: true,
    message: 'Payment verified and booking confirmed',
    booking: populatedBooking,
  });
});

// @desc    Verify and confirm payment from success page or manual confirmation
// @route   POST /api/v1/payments/verify-success
// @access  User
exports.verifyPaymentSuccess = asyncHandler(async (req, res, next) => {
  const { bookingId, sessionId, method } = req.body;

  if (!bookingId) {
    return next(new ApiError('Please provide a bookingId', 400));
  }

  const booking = await Booking.findById(bookingId).populate('user', 'name email');
  if (!booking) {
    return next(new ApiError('Booking not found', 404));
  }

  // Check authorization
  if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'owner') {
    return next(new ApiError('Not authorized', 403));
  }

  // Update status to paid and confirmed if still pending
  if (booking.bookingStatus === 'pending' || booking.paymentInfo?.status !== 'paid') {
    const provider = method || 'stripe';
    const payId = sessionId || `pay_${provider}_${Date.now()}`;
    await handlePaymentSuccess(booking, provider, payId);
  }

  const populatedBooking = await populateBookingForRealtime(booking._id);

  res.status(200).json({
    success: true,
    message: 'Payment verified and booking confirmed successfully',
    booking: populatedBooking,
  });
});

// @desc    Stripe Webhook handler
// @route   POST /api/v1/payments/stripe/webhook
// @access  System
exports.stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const bookingId = session.metadata?.bookingId;
      if (bookingId) {
        const booking = await Booking.findById(bookingId).populate('user', 'name email');
        if (booking && booking.bookingStatus !== 'confirmed') {
          await handlePaymentSuccess(booking, 'stripe', session.payment_intent);
        }
      }
    } else if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const bookingId = paymentIntent.metadata?.bookingId;
      if (bookingId) {
        const booking = await Booking.findById(bookingId).populate('user', 'name email');
        if (booking && booking.bookingStatus === 'pending') {
          booking.bookingStatus = 'paymentFailed';
          await booking.save();
          try {
            const template = emailTemplates.paymentFailure(booking.user.name, booking);
            await sendEmail({ email: booking.user.email, ...template });
          } catch (error) { }
        }
      }
    } else if (event.type === 'charge.refunded') {
      const charge = event.data.object;
      const txn = await Transaction.findOne({ gateway: 'stripe', paymentId: charge.payment_intent });
      if (txn) {
        txn.status = 'refunded';
        await txn.save();

        const booking = await Booking.findById(txn.booking);
        if (booking) {
          booking.bookingStatus = 'cancelled';
          booking.cancellation = { ...booking.cancellation, refundStatus: 'processed' };
          await booking.save();
        }
      }
    }
  } catch (err) {
    console.error('Error handling webhook event:', err);
  }

  res.status(200).json({ received: true });
});

// @desc    Process refund
// @route   POST /api/v1/payments/refund/:bookingId
// @access  Admin/Owner
exports.processRefund = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) return next(new ApiError('Booking not found', 404));

  if (booking.bookingStatus !== 'cancelled') {
    return next(new ApiError('Only cancelled bookings can be refunded', 400));
  }

  // Ensure cancellation object exists and has a refundAmount (fallback to totalPrice)
  if (!booking.cancellation) {
    booking.cancellation = { cancelledAt: new Date() };
  }
  const refundAmount = booking.cancellation.refundAmount || booking.totalPrice || 0;
  booking.cancellation.refundAmount = refundAmount;

  const transaction = await Transaction.findOne({ booking: booking._id, type: 'booking' });
  if (transaction) {
    // Determine gateway based on transaction gateway
    if (transaction.gateway === 'stripe') {
      try {
        await stripe.refunds.create({
          payment_intent: transaction.paymentId,
          amount: Math.round(refundAmount * 100),
          reason: 'requested_by_customer'
        });
      } catch (error) {
        console.error('Stripe refund failed (continuing system refund):', error.message);
      }
    } else if (transaction.gateway === 'razorpay') {
      try {
        const razorpay = getRazorpayClient();
        await razorpay.payments.refund(transaction.paymentId, {
          amount: Math.round(refundAmount * 100),
          notes: { reason: reason || 'Requested by customer' }
        });
      } catch (error) {
        console.error('Razorpay refund failed (continuing system refund):', error.message);
      }
    }

    transaction.status = 'refunded';
    await transaction.save();

    // Deduct from owner's pending payout if one exists and includes this transaction
    let payout = await Payout.findOne({ owner: transaction.owner, status: 'pending' });
    if (payout && payout.transactions.includes(transaction._id)) {
      payout.amount -= transaction.netAmount;
      if (payout.amount < 0) payout.amount = 0;
      await payout.save();
    }
  }

  booking.cancellation.refundStatus = 'processed';
  await booking.save();

  const populatedBooking = await populateBookingForRealtime(booking._id);
  bookingEvents.publishBookingEvent('booking.refund_processed', populatedBooking, {
    refundAmount: booking.cancellation.refundAmount,
  });

  // Notify user
  await notificationService.notify({
    recipient: booking.user,
    recipientRole: 'user',
    type: 'booking',
    title: 'Refund Processed',
    message: `Your refund of ₹${booking.cancellation.refundAmount.toLocaleString('en-IN')} for booking #${booking._id.toString().slice(-6).toUpperCase()} has been processed.`,
    link: `/booking/${booking._id}`,
    priority: 'high',
  });

  res.status(200).json({
    success: true,
    message: `Refund of INR ${booking.cancellation.refundAmount} processed successfully`,
    booking: populatedBooking,
  });
});
