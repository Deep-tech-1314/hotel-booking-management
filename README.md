# 🏨 BookMyStay — Premium Hotel Booking & Property Management Platform

> 🚀 **Live Demo & Production Application:** [https://hotel-booking-management-kappa.vercel.app](https://hotel-booking-management-kappa.vercel.app)

![BookMyStay Hero Banner](https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-BookMyStay-6366F1?style=for-the-badge&logo=vercel&logoColor=white)](https://hotel-booking-management-kappa.vercel.app)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-v5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express.js-Backend-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)

---

## ✨ Overview

**BookMyStay** is a full-stack, enterprise-grade hotel reservation and property management web application designed for seamless luxury travel bookings. Built with modern web technologies (**React 18**, **Redux Toolkit**, **Express.js**, **MongoDB Atlas**, **Stripe**, **Razorpay**), it provides an immersive end-to-end booking experience for guests, a comprehensive management portal ("Grand Theme") for property owners, and a high-level admin dashboard for platform management.

---

## 🔗 Quick Links

* 🌐 **Live Web Application**: [https://hotel-booking-management-kappa.vercel.app](https://hotel-booking-management-kappa.vercel.app)
* ⚡ **Live API Health Check**: [https://hotel-booking-management-kappa.vercel.app/api/v1/health](https://hotel-booking-management-kappa.vercel.app/api/v1/health)
* 🏨 **Live Hotels Endpoint**: [https://hotel-booking-management-kappa.vercel.app/api/v1/hotels](https://hotel-booking-management-kappa.vercel.app/api/v1/hotels)

---

## 🌟 Key Features

### 👤 Guest Experience
- **Interactive Hotel Search & Filtering**: Filter 30+ luxury hotels across top Indian & global destinations by city, price range, star rating, property category (*Hotel, Resort, Villa, Apartment, Hostel*), and amenities.
- **Detailed Property Pages**: High-resolution image galleries, room type breakdowns, amenity badges, location details, and verified guest reviews.
- **Seamless Booking Flow**: Real-time room availability check, customizable check-in/check-out date range picker, guest count selection, and instant discount coupon validation.
- **Dual Secure Payment Gateways**: Integrated with both **Stripe** (Credit/Debit Cards) and **Razorpay** (UPI, NetBanking, Wallets).
- **Personalized Guest Dashboard**: View active & past reservations, manage wishlist items, track booking receipts, update profile information, and leave property reviews.

### 🏨 Property Owner Portal ("Grand Theme")
- **Custom Owner Workspace**: Dedicated dashboard for hotel owners with custom luxury UI.
- **Inventory & Room Management**: Add, update, or remove property listings, adjust seasonal pricing, update room types, and manage high-resolution photo uploads via Cloudinary integration.
- **Booking & Revenue Analytics**: Track incoming guest reservations, revenue breakdowns, occupancy metrics, and payout status.
- **Guest Communication**: Direct message center for resolving guest inquiries.

### 🛡️ Admin Management Suite
- **Platform Analytics**: Comprehensive revenue metrics, user registration stats, booking trends, and property breakdown charts powered by **Recharts**.
- **User & Owner Controls**: Manage registered user accounts, approve owner property submissions, and adjust permissions.
- **Coupon & Promotion Engine**: Create, update, and manage global discount codes with percentage/fixed-amount savings and expiry dates.
- **Real-Time Notification System**: Server-Sent Events (SSE) stream delivering real-time notification alerts to platform administrators.

---

## 🛠️ Technology Stack

| Domain | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, Vite, Redux Toolkit, React Router v6, Vanilla CSS (Glassmorphism & Grand Luxury Theme), React Icons, React Hot Toast, Recharts |
| **Backend** | Node.js, Express.js, MongoDB Atlas, Mongoose ODM, JWT Authentication (Cookies & Refresh Tokens) |
| **Media & Storage** | Cloudinary Cloud Storage & Multer middleware |
| **Payments** | Stripe (`@stripe/stripe-js`, `stripe`), Razorpay (`razorpay`) |
| **Security & Utilities** | Helmet, CORS, Express Rate Limit, bcryptjs, Nodemailer |
| **Deployment** | Vercel Serverless Functions (`@vercel/node`, `@vercel/static-build`) |

---

## 📂 Repository Structure

```
Hotel Booking Management/
├── client/                     # Frontend React 18 Application
│   ├── public/                 # Static assets & media
│   ├── src/
│   │   ├── components/         # Reusable UI components & layouts
│   │   ├── context/            # Global React Contexts (Language, Theme)
│   │   ├── pages/              # App views (Public, Guest, Owner, Admin)
│   │   ├── redux/              # Redux Toolkit store & feature slices
│   │   ├── styles/             # Modular CSS design system & Grand theme
│   │   └── utils/              # Axios instance, API helpers & formatters
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend Express.js Server API
│   ├── config/                 # DB (Mongoose) & Cloudinary configuration
│   ├── controllers/            # Request handlers (Auth, Hotels, Bookings, etc.)
│   ├── middleware/             # Auth, error handling, rate limiters, multer
│   ├── models/                 # Mongoose Data Schemas (User, Hotel, Room, etc.)
│   ├── routes/                 # Express API endpoint definitions
│   ├── services/               # Core business logic & notifications
│   ├── utils/                  # Database seeders, ApiError, helper modules
│   └── server.js               # Entry point
│
├── api/                        # Vercel Serverless Function Bridge
│   └── index.js
├── vercel.json                 # Vercel Deployment & Route Rewrites Config
├── package.json                # Project Root Dependencies & Scripts
└── README.md                   # Documentation
```

---

## ⚡ Quick Start Guide (Local Development)

### Prerequisites
- **Node.js** (v18.x or higher)
- **npm** or **yarn**
- **MongoDB Atlas** database connection URI (or local MongoDB server)

### 1. Clone the Repository
```bash
git clone https://github.com/Deep-tech-1314/hotel-booking-management.git
cd hotel-booking-management
```

### 2. Install Dependencies
Run the command below from the project root to install all dependencies for root, client, and server:
```bash
npm run install-all
```

### 3. Setup Environment Variables
Create a `.env` file in the `server` directory:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRE=7d

# Cloudinary (Optional - Fallback to local storage if empty)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payment Gateways (Optional)
STRIPE_SECRET_KEY=your_stripe_secret_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 4. Seed Database (Optional)
To populate your database with 30+ curated Indian luxury hotels, rooms, and categories:
```bash
cd server
npm run seed
```

### 5. Run Concurrent Development Server
Start both the React client and Express backend simultaneously:
```bash
npm run dev
```
- **Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api/v1`

---

## 🌐 Production Deployment (Vercel)

This project is fully configured for serverless deployment on **Vercel**:

1. Install Vercel CLI: `npm i -g vercel`
2. Link & Deploy: `vercel --prod`
3. Configure environment variables in the Vercel Dashboard under **Project Settings > Environment Variables**.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check out the issues page.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License.

---

<p align="center">
  Crafted with ❤️ by <a href="https://github.com/Deep-tech-1314">Deep-tech-1314</a>
</p>
