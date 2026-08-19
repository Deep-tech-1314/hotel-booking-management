const clients = new Map();

const HEARTBEAT_INTERVAL_MS = 25000;

const getObjectId = (value) => {
  if (!value) return undefined;
  if (value._id) return value._id.toString();
  return value.toString();
};

const summarizeUser = (user) => {
  if (!user || !user._id) return user ? { _id: getObjectId(user) } : null;
  return {
    _id: getObjectId(user),
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
  };
};

const summarizeHotel = (hotel) => {
  if (!hotel || !hotel._id) return hotel ? { _id: getObjectId(hotel) } : null;
  return {
    _id: getObjectId(hotel),
    name: hotel.name,
    address: hotel.address,
    images: hotel.images,
    owner: getObjectId(hotel.owner),
  };
};

const summarizeRoom = (room) => {
  if (!room || !room._id) return room ? { _id: getObjectId(room) } : null;
  return {
    _id: getObjectId(room),
    title: room.title,
    roomType: room.roomType,
    pricePerNight: room.pricePerNight,
    images: room.images,
  };
};

const toPlainBooking = (booking) => {
  if (!booking) return null;
  return typeof booking.toObject === 'function'
    ? booking.toObject({ virtuals: true })
    : booking;
};

const buildBookingPayload = (type, booking, meta = {}) => {
  const plainBooking = toPlainBooking(booking);
  if (!plainBooking) return null;

  const userId = getObjectId(plainBooking.user);
  const hotelId = getObjectId(plainBooking.hotel);
  const roomId = getObjectId(plainBooking.room);
  const hotelOwnerId = plainBooking.hotel?._id ? getObjectId(plainBooking.hotel.owner) : meta.hotelOwnerId;

  return {
    type,
    timestamp: new Date().toISOString(),
    bookingId: getObjectId(plainBooking),
    userId,
    hotelId,
    roomId,
    hotelOwnerId,
    booking: {
      _id: getObjectId(plainBooking),
      user: summarizeUser(plainBooking.user),
      hotel: summarizeHotel(plainBooking.hotel),
      room: summarizeRoom(plainBooking.room),
      checkIn: plainBooking.checkIn,
      checkOut: plainBooking.checkOut,
      guests: plainBooking.guests,
      numberOfRooms: plainBooking.numberOfRooms,
      totalPrice: plainBooking.totalPrice,
      priceBreakdown: plainBooking.priceBreakdown,
      paymentInfo: plainBooking.paymentInfo,
      bookingStatus: plainBooking.bookingStatus,
      specialRequests: plainBooking.specialRequests,
      cancellation: plainBooking.cancellation,
      coupon: plainBooking.coupon,
      createdAt: plainBooking.createdAt,
      updatedAt: plainBooking.updatedAt,
    },
    ...meta,
  };
};

const canReceiveBookingEvent = (client, payload) => {
  if (client.role === 'admin') return true;
  if (payload.userId && payload.userId === client.userId) return true;
  return client.role === 'owner' && payload.hotelOwnerId && payload.hotelOwnerId === client.userId;
};

const writeSseEvent = (res, event, data) => {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

const subscribeToBookingEvents = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const clientId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const client = {
    id: clientId,
    userId: req.user._id.toString(),
    role: req.user.role,
    res,
  };

  clients.set(clientId, client);
  writeSseEvent(res, 'connected', {
    success: true,
    clientId,
    userId: client.userId,
    role: client.role,
    message: 'Booking event stream connected',
  });

  req.on('close', () => {
    clients.delete(clientId);
  });
};

const publishBookingEvent = (type, booking, meta = {}) => {
  const payload = buildBookingPayload(type, booking, meta);
  if (!payload) return;

  for (const [clientId, client] of clients.entries()) {
    if (!canReceiveBookingEvent(client, payload)) continue;

    try {
      writeSseEvent(client.res, type, payload);
    } catch (error) {
      clients.delete(clientId);
    }
  }
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

module.exports = {
  publishBookingEvent,
  subscribeToBookingEvents,
};
