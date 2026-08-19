const Message = require('../models/Message');
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../middleware/asyncHandler');
const notificationService = require('../services/notificationService');

// @desc    Send a direct message
// @route   POST /api/v1/messages
// @access  Authenticated
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const { recipientId, recipientEmail, hotelId, subject, body } = req.body;

  if ((!recipientId && !recipientEmail) || !subject || !body) {
    return next(new ApiError('Recipient, subject, and message body are required', 400));
  }

  let recipient;
  if (recipientId) {
    recipient = await User.findById(recipientId);
  } else if (recipientEmail) {
    recipient = await User.findOne({ email: recipientEmail.toLowerCase().trim() });
  }

  if (!recipient) {
    // Fallback: If recipient not specified, route to an admin
    recipient = await User.findOne({ role: 'admin' });
  }

  if (!recipient) {
    return next(new ApiError('Recipient user not found', 404));
  }

  const messageDoc = await Message.create({
    sender: req.user._id,
    recipient: recipient._id,
    hotel: hotelId || null,
    subject: subject.trim(),
    body: body.trim(),
  });

  // Notify recipient via Notification Bell stream
  await notificationService.notify({
    recipient: recipient._id,
    recipientRole: recipient.role,
    type: 'system',
    title: `New Message: ${subject}`,
    message: `${req.user.name}: "${body.slice(0, 100)}${body.length > 100 ? '...' : ''}"`,
    link: recipient.role === 'admin' ? '/admin/messages' : recipient.role === 'owner' ? '/grand/messages' : '/me/messages',
    priority: 'high',
  });


  res.status(201).json({
    success: true,
    message: `Message sent to ${recipient.name} successfully`,
    data: messageDoc,
  });
});

// @desc    Get current user's messages (Inbox & Outbox)
// @route   GET /api/v1/messages/me
// @access  Authenticated
exports.getMyMessages = asyncHandler(async (req, res) => {
  const inbox = await Message.find({ recipient: req.user._id })
    .populate('sender', 'name email avatar role')
    .populate('hotel', 'name')
    .sort('-createdAt');

  const outbox = await Message.find({ sender: req.user._id })
    .populate('recipient', 'name email avatar role')
    .populate('hotel', 'name')
    .sort('-createdAt');

  const unreadCount = inbox.filter((m) => !m.isRead).length;

  res.status(200).json({
    success: true,
    data: {
      inbox,
      outbox,
      unreadCount,
    },
  });
});

// @desc    Mark a message as read
// @route   PATCH /api/v1/messages/:id/read
// @access  Authenticated
exports.markMessageRead = asyncHandler(async (req, res, next) => {
  const messageDoc = await Message.findById(req.params.id);

  if (!messageDoc) {
    return next(new ApiError('Message not found', 404));
  }

  if (messageDoc.recipient.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ApiError('Not authorized', 403));
  }

  messageDoc.isRead = true;
  messageDoc.readAt = new Date();
  await messageDoc.save();

  res.status(200).json({
    success: true,
    message: 'Message marked as read',
    data: messageDoc,
  });
});

// @desc    Get all system messages (Admin only)
// @route   GET /api/v1/messages/all
// @access  Admin
exports.getAllMessagesAdmin = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new ApiError('Not authorized to access all messages', 403));
  }

  const allMessages = await Message.find({})
    .populate('sender', 'name email avatar role')
    .populate('recipient', 'name email avatar role')
    .populate('hotel', 'name')
    .sort('-createdAt');

  const unreadCount = allMessages.filter((m) => !m.isRead).length;

  res.status(200).json({
    success: true,
    data: {
      allMessages,
      unreadCount,
    },
  });
});

// @desc    Delete a message
// @route   DELETE /api/v1/messages/:id
// @access  Authenticated
exports.deleteMessage = asyncHandler(async (req, res, next) => {
  const messageDoc = await Message.findById(req.params.id);

  if (!messageDoc) {
    return next(new ApiError('Message not found', 404));
  }

  const isSender = messageDoc.sender?.toString() === req.user._id.toString();
  const isRecipient = messageDoc.recipient?.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isSender && !isRecipient && !isAdmin) {
    return next(new ApiError('Not authorized to delete this message', 403));
  }

  await messageDoc.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Message deleted successfully',
  });
});


