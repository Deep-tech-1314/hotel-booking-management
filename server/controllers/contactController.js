const ContactMessage = require('../models/ContactMessage');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Submit a contact form message
 * @route   POST /api/v1/contact
 * @access  Public
 */
exports.submitContactForm = asyncHandler(async (req, res, next) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return next(new ApiError('Please provide all required fields', 400));
  }

  const contactMessage = await ContactMessage.create({
    name,
    email,
    subject,
    message,
  });

  res.status(201).json({
    success: true,
    message: 'Your message has been sent successfully! We will get back to you within 24 hours.',
    data: {
      id: contactMessage._id,
      name: contactMessage.name,
      email: contactMessage.email,
      subject: contactMessage.subject,
      createdAt: contactMessage.createdAt,
    },
  });
});

/**
 * @desc    Get all contact messages (admin only)
 * @route   GET /api/v1/contact
 * @access  Admin
 */
exports.getContactMessages = asyncHandler(async (req, res, next) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;

  const messages = await ContactMessage.find(query)
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await ContactMessage.countDocuments(query);

  res.status(200).json({
    success: true,
    count: messages.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    messages,
  });
});

/**
 * @desc    Update contact message status
 * @route   PUT /api/v1/contact/:id/status
 * @access  Admin
 */
exports.updateMessageStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!['new', 'read', 'replied'].includes(status)) {
    return next(new ApiError('Invalid status value', 400));
  }

  const message = await ContactMessage.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!message) {
    return next(new ApiError('Message not found', 404));
  }

  res.status(200).json({
    success: true,
    message: `Message status updated to ${status}`,
    data: message,
  });
});
