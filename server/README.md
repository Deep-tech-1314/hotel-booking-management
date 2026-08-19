# BookMyStay Backend

Express, MongoDB, Mongoose, JWT cookies, Stripe, Razorpay, Cloudinary, and Server-Sent Events power the BookMyStay API.

## Run Locally

```bash
cd server
copy .env.example .env
npm install
npm run dev
```

The API runs at `http://localhost:5000/api/v1`. The Vite client proxies `/api` to this server in development.

If `MONGO_URI` is unavailable, the current database connector starts an in-memory MongoDB and seeds demo data. For production, provide a durable MongoDB connection string.

## Required Environment

Use `.env.example` as the template. Production needs:

- `NODE_ENV=production`
- `FRONTEND_URL` set to the deployed client origin
- strong `JWT_SECRET` and `REFRESH_TOKEN_SECRET`
- MongoDB, Cloudinary, payment, and SMTP credentials
- Stripe webhook configured to `POST /api/v1/payments/webhook`

## API Surface

Auth:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `PUT /api/v1/auth/me/update`
- `PUT /api/v1/auth/me/password`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/forgot-password`
- `PUT /api/v1/auth/reset-password/:token`
- `GET /api/v1/auth/verify-email/:token`

Hotels and rooms:

- `GET /api/v1/hotels`
- `GET /api/v1/hotels/featured`
- `GET /api/v1/hotels/nearby`
- `GET /api/v1/hotels/:id`
- `GET /api/v1/hotels/owner/my-hotels`
- `POST /api/v1/hotels`
- `PUT /api/v1/hotels/:id`
- `DELETE /api/v1/hotels/:id`
- `GET /api/v1/hotels/:hotelId/rooms`
- `GET /api/v1/hotels/:hotelId/rooms/:id`
- `GET /api/v1/hotels/:hotelId/rooms/:id/availability`
- `POST /api/v1/hotels/:hotelId/rooms`
- `PUT /api/v1/hotels/:hotelId/rooms/:id`
- `DELETE /api/v1/hotels/:hotelId/rooms/:id`

Bookings and payments:

- `POST /api/v1/bookings`
- `GET /api/v1/bookings/stream`
- `GET /api/v1/bookings/me`
- `GET /api/v1/bookings/:id`
- `PUT /api/v1/bookings/:id/cancel`
- `PUT /api/v1/bookings/:id/status`
- `GET /api/v1/bookings/hotel/:hotelId`
- `GET /api/v1/bookings/admin/all`
- `POST /api/v1/payments/create-checkout-session`
- `POST /api/v1/payments/razorpay/order`
- `POST /api/v1/payments/razorpay/verify`
- `POST /api/v1/payments/webhook`
- `POST /api/v1/payments/refund/:bookingId`

Content, analytics, and engagement:

- `GET /api/v1/content/home`
- `POST /api/v1/content`
- `POST /api/v1/content/seed`
- `POST /api/v1/newsletter/subscribe`
- `GET /api/v1/newsletter/subscribers`
- `POST /api/v1/analytics/view`
- `GET /api/v1/analytics/recent`
- `GET /api/v1/analytics/recommendations`
- `GET /api/v1/hotels/:hotelId/videos`

Admin and owner dashboards:

- `GET /api/v1/admin/users`
- `PUT /api/v1/admin/users/:id/role`
- `DELETE /api/v1/admin/users/:id`
- `GET /api/v1/admin/hotels/pending`
- `PUT /api/v1/admin/hotels/:id/approve`
- `PUT /api/v1/admin/hotels/:id/reject`
- `GET /api/v1/admin/stats`
- `GET /api/v1/admin/revenue`
- `GET /api/v1/grand/overview`
- `GET /api/v1/grand/bookings`
- `GET /api/v1/grand/rooms`
- `GET /api/v1/grand/guests`
- `GET /api/v1/grand/reports`

## Booking Request Contract

The backend computes pricing and ignores browser-supplied totals. It accepts both current and legacy date names:

```json
{
  "hotel": "hotelObjectId",
  "room": "roomObjectId",
  "checkIn": "2026-07-01",
  "checkOut": "2026-07-05",
  "guests": { "adults": 2, "children": 0 },
  "numberOfRooms": 1,
  "couponCode": "BOOKMYSTAY",
  "specialRequests": "Late check-in"
}
```

`checkInDate` and `checkOutDate` are also accepted for older clients.

## Real-Time Booking Updates

Authenticated users can subscribe with Server-Sent Events:

```js
import { createBookingEventSource } from './utils/api';

const source = createBookingEventSource();

source.addEventListener('booking.created', (event) => {
  const payload = JSON.parse(event.data);
  console.log(payload.booking);
});

source.addEventListener('booking.payment_confirmed', (event) => {
  const payload = JSON.parse(event.data);
  console.log(payload.booking.bookingStatus);
});

source.addEventListener('booking.status_updated', (event) => {
  const payload = JSON.parse(event.data);
  console.log(payload.status);
});

source.addEventListener('booking.cancelled', (event) => {
  const payload = JSON.parse(event.data);
  console.log(payload.booking.cancellation);
});
```

Events are scoped on the server:

- users receive updates for their own bookings
- owners receive updates for hotels they own
- admins receive all booking updates

## Deployment Notes

1. Build the client with `cd client && npm run build`.
2. Deploy the server with `cd server && npm ci --omit=dev && npm start`.
3. Configure reverse proxy timeouts for SSE. Nginx should disable response buffering for `/api/v1/bookings/stream`.
4. Configure Stripe to send checkout events to `/api/v1/payments/webhook`.
5. Set `FRONTEND_URL` to the deployed client origin so cookies, CORS, email links, and payment redirects work.

## Verification

```bash
cd server
npm test
node --check server.js
```

There are currently no checked-in Jest specs, so add focused Supertest coverage as backend behavior grows.
