const Notification = require('../models/Notification');
const User = require('../models/User');

const clients = new Map();
const HEARTBEAT_INTERVAL_MS = 25000;

const writeSseEvent = (res, event, data) => {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

const subscribeToNotifications = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const clientId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const client = {
    id: clientId,
    userId: req.user._id.toString(),
    res,
  };

  clients.set(clientId, client);
  writeSseEvent(res, 'connected', { success: true, message: 'Notification stream connected' });

  req.on('close', () => clients.delete(clientId));
};

const heartbeat = setInterval(() => {
  for (const [clientId, client] of clients.entries()) {
    try {
      client.res.write(': heartbeat\n\n');
    } catch (error) {
      clients.delete(clientId);
    }
  }
}, HEARTBEAT_INTERVAL_MS);
heartbeat.unref?.();

const publishNotification = (notification) => {
  const recipientId = notification.recipient.toString();
  for (const [clientId, client] of clients.entries()) {
    if (client.userId !== recipientId) continue;
    try {
      writeSseEvent(client.res, 'notification', notification);
    } catch (error) {
      clients.delete(clientId);
    }
  }
};

// Create a single notification. Best-effort: never throws into the request flow.
const notify = async ({ recipient, recipientRole, type, title, message, link = '', priority = 'normal', meta = {} }) => {
  try {
    if (!recipient || !type || !title || !message) return null;

    // Resolve role & preferences if not provided
    const user = await User.findById(recipient).select('role notificationPreferences');
    if (!user) return null;
    let role = recipientRole || user.role || 'user';

    const prefs = user.notificationPreferences || {};
    if (prefs.inAppAlerts === false) return null;
    if (type === 'booking' && prefs.bookingUpdates === false) return null;
    if (type === 'hotel' && prefs.hotelUpdates === false) return null;
    if (type === 'system' && prefs.systemAlerts === false) return null;

    const notification = await Notification.create({
      recipient,
      recipientRole: role,
      type,
      title,
      message,
      link,
      priority,
      meta,
    });
    
    publishNotification(notification);
    return notification;
  } catch (err) {
    console.error('notify() failed:', err.message);
    return null;
  }
};

// Fan-out a notification to every admin (e.g. new owner request, hotel submitted).
const notifyAdmins = async ({ type, title, message, link = '', priority = 'normal', meta = {} }) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id');
    if (!admins.length) return [];
    const docs = admins.map((a) => ({
      recipient: a._id,
      recipientRole: 'admin',
      type,
      title,
      message,
      link,
      priority,
      meta,
    }));
    const inserted = await Notification.insertMany(docs);
    inserted.forEach(publishNotification);
    return inserted;
  } catch (err) {
    console.error('notifyAdmins() failed:', err.message);
    return [];
  }
};

// Paginated feed for a recipient. `onlyUnread` filters to unread items.
const list = async (recipientId, { page = 1, limit = 20, onlyUnread = false } = {}) => {
  const query = { recipient: recipientId };
  if (onlyUnread) query.isRead = false;

  const [items, total, unread] = await Promise.all([
    Notification.find(query).sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit)),
    Notification.countDocuments(query),
    Notification.countDocuments({ recipient: recipientId, isRead: false }),
  ]);

  return { items, total, unread, page: parseInt(page), pages: Math.ceil(total / limit) };
};

const unreadCount = (recipientId) =>
  Notification.countDocuments({ recipient: recipientId, isRead: false });

const markRead = (id, recipientId) =>
  Notification.findOneAndUpdate(
    { _id: id, recipient: recipientId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

const markAllRead = (recipientId) =>
  Notification.updateMany(
    { recipient: recipientId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

const deleteNotification = (id, recipientId) =>
  Notification.findOneAndDelete({ _id: id, recipient: recipientId });

module.exports = { notify, notifyAdmins, list, unreadCount, markRead, markAllRead, deleteNotification, subscribeToNotifications };
