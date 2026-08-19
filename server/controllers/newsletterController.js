const Newsletter = require('../models/Newsletter');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendEmail = require('../utils/sendEmail');

/**
 * @desc   Subscribe to newsletter
 * @route  POST /api/v1/newsletter/subscribe
 * @access Public
 */
exports.subscribe = asyncHandler(async (req, res, next) => {
  const { email, name, source } = req.body;

  if (!email) {
    return next(new ApiError('Please provide an email address', 400));
  }

  let subscriber = await Newsletter.findOne({ email });

  if (subscriber) {
    if (subscriber.isSubscribed) {
      return next(new ApiError('You are already subscribed to our newsletter', 400));
    }
    // Resubscribe
    subscriber.isSubscribed = true;
    subscriber.unsubscribedAt = undefined;
    subscriber.name = name || subscriber.name;
    subscriber.source = source || subscriber.source;
    await subscriber.save();
  } else {
    subscriber = await Newsletter.create({
      email,
      name,
      source: source || 'website',
    });
  }

  // Send welcome email
  try {
    await sendEmail({
      email: subscriber.email,
      subject: 'Welcome to BookMyStay Exclusive Deals',
      message: `
        <h2>Welcome to BookMyStay, ${name || 'Traveler'}!</h2>
        <p>You're now part of our exclusive community. Get ready for:</p>
        <ul>
          <li>Up to 20% off your first luxury booking</li>
          <li>Early access to flash sales</li>
          <li>Curated destination guides</li>
          <li>Member-only property previews</li>
        </ul>
        <p style="margin-top:20px;">Happy travels,<br>The BookMyStay Team</p>
      `,
    });
  } catch (err) {
    console.error('Newsletter welcome email failed:', err.message);
  }

  res.status(200).json({
    success: true,
    message: 'Subscribed successfully! Check your inbox for a welcome gift.',
    data: subscriber,
  });
});

/**
 * @desc   Unsubscribe from newsletter
 * @route  POST /api/v1/newsletter/unsubscribe
 * @access Public
 */
exports.unsubscribe = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const subscriber = await Newsletter.findOne({ email });

  if (!subscriber || !subscriber.isSubscribed) {
    return next(new ApiError('Email not found or already unsubscribed', 404));
  }

  subscriber.isSubscribed = false;
  subscriber.unsubscribedAt = new Date();
  await subscriber.save();

  res.status(200).json({
    success: true,
    message: 'You have been unsubscribed successfully.',
  });
});

/**
 * @desc   Get all subscribers (admin)
 * @route  GET /api/v1/newsletter/subscribers
 * @access Private/Admin
 */
exports.getSubscribers = asyncHandler(async (req, res, next) => {
  const subscribers = await Newsletter.find()
    .sort({ createdAt: -1 })
    .select('-__v');

  res.status(200).json({
    success: true,
    count: subscribers.length,
    data: subscribers,
  });
});
