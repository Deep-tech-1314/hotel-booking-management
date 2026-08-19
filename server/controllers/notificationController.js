const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const notificationService = require('../services/notificationService');

// @desc    Get current user's notifications (paginated)
// @route   GET /api/v1/notifications
// @access  Authenticated
exports.getNotifications = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20, unread } = req.query;
  const result = await notificationService.list(req.user._id, {
    page,
    limit,
    onlyUnread: unread === 'true',
  });

  res.status(200).json({
    success: true,
    count: result.items.length,
    total: result.total,
    unread: result.unread,
    page: result.page,
    pages: result.pages,
    notifications: result.items,
  });
});

// @desc    Get unread notification count
// @route   GET /api/v1/notifications/unread-count
// @access  Authenticated
exports.getUnreadCount = asyncHandler(async (req, res, next) => {
  const unread = await notificationService.unreadCount(req.user._id);
  res.status(200).json({ success: true, unread });
});

// @desc    Mark a single notification as read
// @route   PATCH /api/v1/notifications/:id/read
// @access  Authenticated
exports.markRead = asyncHandler(async (req, res, next) => {
  const notification = await notificationService.markRead(req.params.id, req.user._id);
  if (!notification) {
    return next(new ApiError('Notification not found', 404));
  }
  res.status(200).json({ success: true, notification });
});

// @desc    Mark all notifications as read
// @route   PATCH /api/v1/notifications/read-all
// @access  Authenticated
exports.markAllRead = asyncHandler(async (req, res, next) => {
  await notificationService.markAllRead(req.user._id);
  res.status(200).json({ success: true, message: 'All notifications marked as read' });
});

// @desc    Send custom notification/message to a recipient user
// @route   POST /api/v1/notifications/send
// @access  Authenticated
exports.sendNotification = asyncHandler(async (req, res, next) => {
  const { recipient, title, message, priority = 'normal', type = 'system' } = req.body;

  if (!recipient || !title || !message) {
    return next(new ApiError('Recipient, title, and message are required', 400));
  }

  const notification = await notificationService.notify({
    recipient,
    recipientRole: 'user',
    type,
    title,
    message,
    priority,
  });

  res.status(201).json({
    success: true,
    message: 'Notification sent successfully',
    notification,
  });
});

// @desc    Delete a notification
// @route   DELETE /api/v1/notifications/:id
// @access  Authenticated
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await notificationService.deleteNotification(req.params.id, req.user._id);
  if (!notification) {
    return next(new ApiError('Notification not found', 404));
  }
  res.status(200).json({ success: true, message: 'Notification deleted successfully', id: req.params.id });
});
