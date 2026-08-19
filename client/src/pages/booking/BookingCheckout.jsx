import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHotelDetails } from '../../redux/slices/hotelSlice';
import api from '../../utils/api';
import { calculateNights, formatPrice } from '../../utils/constants';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';
import '../../styles/luxury-checkout.css';

import {
  FiUser,
  FiMail,
  FiPhone,
  FiUsers,
  FiHome,
  FiCheckCircle,
  FiLock,
  FiTag,
  FiCalendar,
  FiShield,
  FiAward,
  FiPlus,
  FiMinus,
  FiMapPin,
  FiStar,
  FiCreditCard,
  FiArrowRight,
  FiCheck
} from 'react-icons/fi';

import { HiSparkles } from 'react-icons/hi2';

const loadRazorpayScript = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

const PRESET_REQUESTS = [
  '✨ High Floor / Ocean View',
  '🌙 Late Check-in Request',
  '🛏️ Quiet Room Away from Elevator',
  '🍾 Honeymoon / Anniversary Setup',
  '🚗 Airport Transfer Needed'
];

const BookingCheckout = () => {
  const { roomId: legacyRoomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const hotelId = searchParams.get('hotelId');
  const roomId = searchParams.get('roomId') || legacyRoomId;
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');

  const { hotelDetails: hotel, rooms, loading: hotelLoading } = useSelector((state) => state.hotels);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [guests, setGuests] = useState(Number(searchParams.get('guests')) || 2);
  const [numberOfRooms, setNumberOfRooms] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [contact, setContact] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    setContact({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }

    if (hotelId && hotel?._id !== hotelId) {
      dispatch(fetchHotelDetails(hotelId));
    }
  }, [dispatch, hotel?._id, hotelId, isAuthenticated, navigate]);

  const room = rooms.find((item) => item._id === roomId);

  const pricing = useMemo(() => {
    if (!room || !checkIn || !checkOut) {
      return { nights: 0, roomCharges: 0, taxes: 0, serviceFee: 0, totalBeforeDiscount: 0, totalAmount: 0 };
    }

    const nights = Math.max(1, calculateNights(checkIn, checkOut));
    const roomCharges = room.pricePerNight * nights * numberOfRooms;
    const taxes = Math.round(roomCharges * 0.18);
    const serviceFee = Math.round(roomCharges * 0.05);
    const totalBeforeDiscount = roomCharges + taxes + serviceFee;
    const totalAmount = Math.max(0, totalBeforeDiscount - discount);

    return { nights, roomCharges, taxes, serviceFee, totalBeforeDiscount, totalAmount };
  }, [checkIn, checkOut, discount, numberOfRooms, room]);

  const handleApplyCoupon = async (codeToUse) => {
    const finalCode = (typeof codeToUse === 'string' ? codeToUse : couponCode).trim();
    if (!finalCode) {
      setDiscount(0);
      return toast.error('Enter a coupon code');
    }

    setCouponLoading(true);
    try {
      const { data } = await api.post('/coupons/apply', {
        code: finalCode,
        bookingAmount: pricing.totalBeforeDiscount,
        hotelId: hotel._id,
      });
      setDiscount(data.discount || 0);
      toast.success(`Coupon "${finalCode}" applied!`);
    } catch (error) {
      setDiscount(0);
      toast.error(error.response?.data?.message || 'Coupon could not be applied');
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePresetRequest = (presetText) => {
    if (specialRequests.includes(presetText)) return;
    setSpecialRequests((prev) => (prev ? `${prev}, ${presetText}` : presetText));
    toast.success('Added to special requests');
  };

  const handleRazorpayCheckout = async (bookingId) => {
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load Razorpay SDK. Check your internet connection.');
        setLoading(false);
        return;
      }

      const { data: orderData } = await api.post('/payments/razorpay/order', { bookingId });

      if (orderData.alreadyPaid) {
        toast.success('Reservation already paid!');
        navigate(`/payment/success?bookingId=${bookingId}&method=razorpay`);
        return;
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'BookMyStay Grand Luxury',
        description: `Reservation at ${hotel?.name || 'Resort'} — ${room?.title || 'Suite'}`,
        image: hotel?.images?.[0]?.url || '',
        order_id: orderData.orderId,
        prefill: {
          name: contact.name,
          email: contact.email,
          contact: contact.phone,
        },
        theme: {
          color: '#c5a880',
        },
        handler: async (response) => {
          try {
            const { data: verifyRes } = await api.post('/payments/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId,
            });

            if (verifyRes.success) {
              toast.success('Payment verified & luxury reservation confirmed!');
              navigate(`/payment/success?bookingId=${bookingId}&method=razorpay`);
            } else {
              toast.error('Payment verification failed. Please contact support.');
            }
          } catch (verifyErr) {
            toast.error('Payment verification failed: ' + (verifyErr.response?.data?.message || verifyErr.message));
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment was cancelled.');
            setLoading(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error?.description || 'Unknown error'}`);
        setLoading(false);
      });
      razorpayInstance.open();
    } catch (err) {
      toast.error('Razorpay Checkout failed: ' + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (!contact.name || !contact.email) {
      return toast.error('Please enter your name and email');
    }

    const cleanPhone = contact.phone ? contact.phone.replace(/\D/g, '') : '';
    if (!cleanPhone || cleanPhone.length !== 10) {
      return toast.error('Phone number must consist of 10 digits');
    }

    if (/^(\d)\1{9}$/.test(cleanPhone)) {
      return toast.error('Please enter a valid phone number');
    }

    if (!hotel || !room || !checkIn || !checkOut) {
      return toast.error('Please select a valid hotel, room, and dates');
    }

    setLoading(true);

    try {
      const bookingData = {
        hotel: hotel._id,
        room: room._id,
        checkIn,
        checkOut,
        guests: { adults: guests, children: 0 },
        numberOfRooms,
        specialRequests,
        couponCode: couponCode.trim() || undefined,
        contact,
      };

      const { data: bookingRes } = await api.post('/bookings', bookingData);
      const bookingId = bookingRes.booking._id;

      if (paymentMethod === 'stripe') {
        const { data: stripeRes } = await api.post('/payments/create-checkout-session', { bookingId });
        const sessionUrl = stripeRes.sessionUrl || stripeRes.url;
        if (sessionUrl) {
          window.location.href = sessionUrl;
          return;
        } else {
          toast.error('Stripe session could not be created. Please try again.');
          setLoading(false);
        }
      } else if (paymentMethod === 'razorpay') {
        await handleRazorpayCheckout(bookingId);
        return;
      }
    } catch (error) {
      toast.error('Checkout failed: ' + (error.response?.data?.message || error.message));
      setLoading(false);
    }
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!hotelId || !roomId || !checkIn || !checkOut) {
    return (
      <div className="checkout-wrapper text-center py-20">
        <div className="luxury-card mx-auto max-w-lg p-10 text-center">
          <div className="luxury-title-icon mx-auto mb-4" style={{ width: 60, height: 60, fontSize: '1.8rem' }}>
            <FiCalendar />
          </div>
          <h1 className="checkout-main-title text-2xl mb-2">Select Your Stay Dates</h1>
          <p className="checkout-sub-title mb-6">Choose your hotel, room, and stay duration to review your checkout details.</p>
          <Link to="/hotels">
            <Button size="lg" className="luxury-submit-btn">
              Explore Luxury Hotels <FiArrowRight />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (hotelLoading || !hotel) {
    return (
      <div className="page-loader">
        <div className="loader"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="checkout-wrapper text-center py-20">
        <div className="luxury-card mx-auto max-w-lg p-10 text-center">
          <h1 className="checkout-main-title text-2xl mb-2">Selected Room Unavailable</h1>
          <p className="checkout-sub-title mb-6">The requested room details could not be found. Please select another accommodation.</p>
          <Link to={`/hotel/${hotelId}`}>
            <Button size="lg" className="luxury-submit-btn">
              Back to Hotel
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const maxGuestLimit = Math.max(10, (room?.maxGuests || 4) * numberOfRooms);

  return (
    <div className="checkout-wrapper">
      {/* Header & Stepper */}
      <div className="checkout-header-hero">
        <div className="checkout-badge">
          <HiSparkles /> Luxury Reservation Portal
        </div>
        <h1 className="checkout-main-title">Confirm Your Stay</h1>
        <p className="checkout-sub-title">Review guest details, apply exclusive promotional offers, and complete payment.</p>

        <div className="checkout-stepper">
          <div className="stepper-item completed">
            <div className="stepper-number"><FiCheck /></div>
            <span className="stepper-label">Select Suite</span>
          </div>
          <div className="stepper-divider active"></div>
          <div className="stepper-item active">
            <div className="stepper-number">2</div>
            <span className="stepper-label">Guest & Payment</span>
          </div>
          <div className="stepper-divider"></div>
          <div className="stepper-item">
            <div className="stepper-number">3</div>
            <span className="stepper-label">Confirmation</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleCheckout} className="checkout-grid-container">
        {/* Left Column Form */}
        <div className="checkout-form-column">

          {/* Hotel Banner Card */}
          <div className="hotel-banner-card">
            <img
              src={hotel.images?.[0]?.url || 'https://images.unsplash.com/photo-1542314831-c6a4d1400820?auto=format&fit=crop&q=80&w=400'}
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542314831-c6a4d1400820?auto=format&fit=crop&q=80&w=400'; }}
              alt={hotel.name}
              className="hotel-banner-img"
            />
            <div className="hotel-banner-info">
              <h2 className="hotel-banner-title">{hotel.name}</h2>
              <div className="hotel-banner-location">
                <FiMapPin className="text-primary" />
                <span>
                  {hotel.address?.city || (typeof hotel.address === 'string' ? hotel.address : null) || hotel.city || 'Luxury Destination'}
                </span>
                <span className="mx-1">•</span>
                <FiStar className="text-amber fill-amber" />
                <span className="font-bold text-primary">{hotel.rating || '5.0'}</span>
              </div>
              <div className="hotel-banner-tags">
                <span className="hotel-tag">{room.title}</span>
                <span className="hotel-tag">Instant Confirmation</span>
                <span className="hotel-tag">Free Wifi & Breakfast</span>
              </div>
            </div>
          </div>

          {/* Section 1: Guest Details */}
          <section className="luxury-card">
            <div className="luxury-card-title">
              <div className="luxury-title-icon"><FiUser /></div>
              <span>Guest Information</span>
            </div>

            <div className="luxury-form-grid">
              <div className="field-group">
                <label className="field-label">Full Name *</label>
                <div className="input-with-icon">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    className="luxury-input"
                    value={contact.name}
                    onChange={(e) => setContact({ ...contact, name: e.target.value })}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Email Address *</label>
                <div className="input-with-icon">
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    className="luxury-input"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Phone Number *</label>
                <div className="input-with-icon">
                  <FiPhone className="input-icon" />
                  <input
                    type="tel"
                    className="luxury-input"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="10 digit mobile number"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Number of Guests</label>
                <div className="counter-box">
                  <button
                    type="button"
                    className="counter-btn"
                    onClick={() => setGuests((prev) => Math.max(1, prev - 1))}
                    disabled={guests <= 1}
                  >
                    <FiMinus />
                  </button>
                  <span className="counter-value">{guests} {guests === 1 ? 'Guest' : 'Guests'}</span>
                  <button
                    type="button"
                    className="counter-btn"
                    onClick={() => setGuests((prev) => Math.min(maxGuestLimit, prev + 1))}
                    disabled={guests >= maxGuestLimit}
                  >
                    <FiPlus />
                  </button>
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Number of Rooms</label>
                <div className="counter-box">
                  <button
                    type="button"
                    className="counter-btn"
                    onClick={() => setNumberOfRooms((prev) => Math.max(1, prev - 1))}
                    disabled={numberOfRooms <= 1}
                  >
                    <FiMinus />
                  </button>
                  <span className="counter-value">{numberOfRooms} {numberOfRooms === 1 ? 'Room' : 'Rooms'}</span>
                  <button
                    type="button"
                    className="counter-btn"
                    onClick={() => setNumberOfRooms((prev) => Math.min(room.totalRooms || 10, prev + 1))}
                    disabled={numberOfRooms >= (room.totalRooms || 10)}
                  >
                    <FiPlus />
                  </button>
                </div>
              </div>
            </div>

            {/* Special Requests */}
            <div className="field-group mt-5">
              <label className="field-label">Special Requests (Optional)</label>
              <textarea
                className="luxury-textarea"
                placeholder="Late check-in, twin beds, accessibility needs, or dietary preferences..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
              />

              <div className="preset-chips-title">Quick Add Preferences:</div>
              <div className="preset-chips-container">
                {PRESET_REQUESTS.map((preset, idx) => (
                  <button
                    type="button"
                    key={idx}
                    className="preset-chip"
                    onClick={() => handlePresetRequest(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Section 2: Coupon Code */}
          <section className="luxury-card coupon-card">
            <div className="luxury-card-title">
              <div className="luxury-title-icon"><FiTag /></div>
              <span>Promotional Offers & Coupons</span>
            </div>

            <div className="coupon-input-group">
              <div className="input-with-icon flex-1">
                <FiTag className="input-icon" />
                <input
                  type="text"
                  className="luxury-input coupon-input"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter Promo Code (e.g. BOOKMYSTAY)"
                />
              </div>
              <button
                type="button"
                className="coupon-apply-btn"
                onClick={() => handleApplyCoupon(couponCode)}
                disabled={couponLoading}
              >
                {couponLoading ? 'Applying...' : 'Apply Coupon'}
              </button>
            </div>

            <div className="available-promos">
              <span>Try Code:</span>
              <button
                type="button"
                className="promo-badge"
                onClick={() => {
                  setCouponCode('BOOKMYSTAY');
                  handleApplyCoupon('BOOKMYSTAY');
                }}
              >
                BOOKMYSTAY
              </button>
            </div>

            {discount > 0 && (
              <div className="trust-bar mt-4" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                <div className="trust-item">
                  <FiCheckCircle />
                  <span>Promo applied successfully! You saved {formatPrice(discount)}</span>
                </div>
              </div>
            )}
          </section>

          {/* Section 3: Payment Method */}
          <section className="luxury-card">
            <div className="luxury-card-title">
              <div className="luxury-title-icon"><FiCreditCard /></div>
              <span>Select Payment Method</span>
            </div>

            <div className="payment-selector-grid">
              {/* Stripe Option */}
              <div
                className={`payment-card-option ${paymentMethod === 'stripe' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('stripe')}
              >
                <div className="payment-card-header">
                  <div className="payment-brand-title">
                    <div className="radio-check-ring">
                      <div className="radio-check-inner"></div>
                    </div>
                    <span>Stripe Express</span>
                  </div>
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"
                    alt="Stripe"
                    className="payment-brand-logo"
                  />
                </div>
                <p className="payment-desc">Credit/Debit Cards, Apple Pay, Google Pay</p>
                <div className="payment-icons-strip">
                  <span className="pay-pill">VISA</span>
                  <span className="pay-pill">MASTERCARD</span>
                  <span className="pay-pill">AMEX</span>
                </div>
              </div>

              {/* Razorpay Option */}
              <div
                className={`payment-card-option ${paymentMethod === 'razorpay' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('razorpay')}
              >
                <div className="payment-card-header">
                  <div className="payment-brand-title">
                    <div className="radio-check-ring">
                      <div className="radio-check-inner"></div>
                    </div>
                    <span>Razorpay Pay</span>
                  </div>
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg"
                    alt="Razorpay"
                    className="payment-brand-logo"
                  />
                </div>
                <p className="payment-desc">UPI, NetBanking, Instant QR & Wallets</p>
                <div className="payment-icons-strip">
                  <span className="pay-pill">UPI</span>
                  <span className="pay-pill">GPAY</span>
                  <span className="pay-pill">NETBANKING</span>
                </div>
              </div>
            </div>

            <div className="trust-bar">
              <div className="trust-item"><FiLock /> 256-Bit SSL Encrypted</div>
              <div className="trust-item"><FiShield /> Guaranteed Confirmation</div>
              <div className="trust-item"><FiAward /> 100% Secure</div>
            </div>
          </section>

        </div>

        {/* Right Column Sticky Price Summary */}
        <aside className="summary-sticky-card">
          <div className="summary-card-title">
            <span>Price Summary</span>
            <FiAward className="text-primary" />
          </div>

          <div className="summary-hotel-header">
            <img
              src={hotel.images?.[0]?.url || 'https://images.unsplash.com/photo-1542314831-c6a4d1400820?auto=format&fit=crop&q=80&w=400'}
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542314831-c6a4d1400820?auto=format&fit=crop&q=80&w=400'; }}
              alt={hotel.name}
              className="summary-hotel-thumb"
            />
            <div>
              <h3 className="summary-hotel-name">{hotel.name}</h3>
              <p className="summary-room-title">{room.title}</p>
            </div>
          </div>

          {/* Dates Grid */}
          <div className="summary-dates-box">
            <div className="date-col">
              <span className="date-label">Check-In</span>
              <span className="date-val">{formatDateDisplay(checkIn)}</span>
            </div>
            <span className="nights-badge">{pricing.nights} {pricing.nights === 1 ? 'Night' : 'Nights'}</span>
            <div className="date-col">
              <span className="date-label">Check-Out</span>
              <span className="date-val">{formatDateDisplay(checkOut)}</span>
            </div>
          </div>

          {/* Breakdown List */}
          <div className="summary-rows">
            <div className="summary-row">
              <span>Room Charges ({pricing.nights} {pricing.nights === 1 ? 'night' : 'nights'})</span>
              <span className="summary-row-val">{formatPrice(pricing.roomCharges)}</span>
            </div>
            <div className="summary-row">
              <span>Taxes & GST (18%)</span>
              <span className="summary-row-val">{formatPrice(pricing.taxes)}</span>
            </div>
            <div className="summary-row">
              <span>Resort Service Fee (5%)</span>
              <span className="summary-row-val">{formatPrice(pricing.serviceFee)}</span>
            </div>

            {discount > 0 && (
              <div className="summary-row discount">
                <span>Promotional Discount</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
          </div>

          <div className="summary-total-divider"></div>

          <div className="summary-total-row">
            <div>
              <div className="total-title">Total Amount</div>
              <div className="total-subtext">Includes taxes & all fees</div>
            </div>
            <div className="total-price-amount">{formatPrice(pricing.totalAmount)}</div>
          </div>

          <button
            type="submit"
            className="luxury-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span>Processing Reservation...</span>
            ) : (
              <>
                <FiLock /> Proceed to Payment ({formatPrice(pricing.totalAmount)})
              </>
            )}
          </button>

          <div className="summary-guarantee-note">
            <FiCheckCircle className="text-success" />
            <span>Free cancellation up to 24h before check-in</span>
          </div>
        </aside>
      </form>
    </div>
  );
};

export default BookingCheckout;
