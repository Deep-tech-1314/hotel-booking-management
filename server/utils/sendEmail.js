const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"BookMyStay" <${process.env.SMTP_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.html || options.message,
  };

  await transporter.sendMail(mailOptions);
};

// Email Templates
const emailTemplates = {
  welcome: (name) => ({
    subject: 'Welcome to BookMyStay! 🏨',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #1c2032; color: #f8fafc; padding: 40px; border-radius: 12px; border: 1px solid rgba(197, 168, 128, 0.2);">
        <h1 style="color: #c5a880; margin-bottom: 20px;">Welcome, ${name}! 🎉</h1>
        <p>Thank you for joining BookMyStay. We're thrilled to have you on board!</p>
        <p>Start exploring thousands of verified hotels, resorts, and villas worldwide.</p>
        <a href="${process.env.FRONTEND_URL}" style="display: inline-block; background: #c5a880; color: #1c2032; font-weight: 600; padding: 12px 30px; border-radius: 8px; text-decoration: none; margin-top: 20px;">Explore Hotels</a>
        <p style="margin-top: 30px; color: #94a3b8;">Happy Travels,<br>The BookMyStay Team</p>
      </div>
    `,
  }),

  verifyEmail: (name, verifyUrl) => ({
    subject: 'Verify Your Email - BookMyStay',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #1c2032; color: #f8fafc; padding: 40px; border-radius: 12px; border: 1px solid rgba(197, 168, 128, 0.2);">
        <h1 style="color: #c5a880;">Verify Your Email ✉️</h1>
        <p>Hi ${name},</p>
        <p>Please click the button below to verify your email address:</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #c5a880; color: #1c2032; font-weight: 600; padding: 12px 30px; border-radius: 8px; text-decoration: none; margin: 20px 0;">Verify Email</a>
        <p style="color: #94a3b8; font-size: 13px;">This link expires in 24 hours.</p>
        <p style="color: #94a3b8; font-size: 13px;">If you didn't create an account, please ignore this email.</p>
      </div>
    `,
  }),

  resetPassword: (name, resetUrl) => ({
    subject: 'Password Reset - BookMyStay',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #1c2032; color: #f8fafc; padding: 40px; border-radius: 12px; border: 1px solid rgba(197, 168, 128, 0.2);">
        <h1 style="color: #c5a880;">Reset Your Password 🔐</h1>
        <p>Hi ${name},</p>
        <p>You requested a password reset. Click the button below:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #c5a880; color: #1c2032; font-weight: 600; padding: 12px 30px; border-radius: 8px; text-decoration: none; margin: 20px 0;">Reset Password</a>
        <p style="color: #94a3b8; font-size: 13px;">This link expires in 30 minutes.</p>
        <p style="color: #94a3b8; font-size: 13px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  }),

  bookingConfirmation: (name, booking) => ({
    subject: `Booking Confirmed! #${booking._id} - BookMyStay`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #1c2032; color: #f8fafc; padding: 40px; border-radius: 12px; border: 1px solid rgba(197, 168, 128, 0.2);">
        <h1 style="color: #c5a880;">Booking Confirmed! ✅</h1>
        <p>Hi ${name},</p>
        <p>Your booking has been successfully confirmed. Get ready for a great stay!</p>
        <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid rgba(197, 168, 128, 0.1);">
          <p style="margin-bottom: 8px;"><strong>Booking Ref:</strong> ${booking._id}</p>
          <p style="margin-bottom: 8px;"><strong>Check-in:</strong> ${new Date(booking.checkIn).toLocaleDateString()}</p>
          <p style="margin-bottom: 8px;"><strong>Check-out:</strong> ${new Date(booking.checkOut).toLocaleDateString()}</p>
          <p style="margin-bottom: 0;"><strong>Total Paid:</strong> ₹${booking.totalPrice}</p>
        </div>
        <a href="${process.env.FRONTEND_URL}/me/bookings" style="display: inline-block; background: #c5a880; color: #1c2032; font-weight: 600; padding: 12px 30px; border-radius: 8px; text-decoration: none;">View Booking</a>
      </div>
    `,
  }),

  paymentFailure: (name, booking) => ({
    subject: `Payment Failed - Action Required for Booking #${booking._id}`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #1c2032; color: #f8fafc; padding: 40px; border-radius: 12px; border: 1px solid #ef4444;">
        <h1 style="color: #ef4444;">Payment Failed ❌</h1>
        <p>Hi ${name},</p>
        <p>Unfortunately, your payment for the booking at <strong>${booking.hotel?.name || 'BookMyStay'}</strong> was unsuccessful.</p>
        <p>Your booking has not been confirmed. Please try again or use a different payment method.</p>
        <a href="${process.env.FRONTEND_URL}/hotel/${booking.hotel?._id}" style="display: inline-block; background: #c5a880; color: #1c2032; font-weight: 600; padding: 12px 30px; border-radius: 8px; text-decoration: none; margin-top: 20px;">Retry Booking</a>
      </div>
    `,
  }),

  bookingCancellation: (name, booking) => ({
    subject: `Booking Cancelled - #${booking._id}`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #1c2032; color: #f8fafc; padding: 40px; border-radius: 12px; border: 1px solid rgba(197, 168, 128, 0.2);">
        <h1 style="color: #c5a880;">Booking Cancelled</h1>
        <p>Hi ${name},</p>
        <p>Your booking <strong>#${booking._id}</strong> has been cancelled as requested.</p>
        <p>If you are eligible for a refund, it will be processed to your original payment method within 5-7 business days.</p>
        <a href="${process.env.FRONTEND_URL}/hotels" style="display: inline-block; background: #c5a880; color: #1c2032; font-weight: 600; padding: 12px 30px; border-radius: 8px; text-decoration: none; margin-top: 20px;">Explore Other Hotels</a>
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };
