import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { FiCheckCircle, FiX, FiCalendar, FiMapPin, FiCheck } from 'react-icons/fi';
import Button from '../../components/common/Button';
import { fireConfetti } from '../../utils/confetti';
import api from '../../utils/api';
import '../../styles/luxury-checkout.css';

const BookingSuccess = () => {
  const { bookingId: bookingIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId') || bookingIdParam;
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState('loading');
  const [bookingDetails, setBookingDetails] = useState(null);
  const confettiFired = useRef(false);

  useEffect(() => {
    const confirmAndFetchBooking = async () => {
      if (!bookingId) {
        if (sessionId) {
          setTimeout(() => setStatus('success'), 1000);
        } else {
          setStatus('failed');
        }
        return;
      }

      try {
        const method = searchParams.get('method') || 'stripe';
        const { data: confirmData } = await api.post('/payments/verify-success', {
          bookingId,
          sessionId,
          method,
        });

        if (confirmData.success && confirmData.booking) {
          setBookingDetails(confirmData.booking);
        } else {
          const { data } = await api.get(`/bookings/${bookingId}`);
          setBookingDetails(data.data);
        }
        setStatus('success');
      } catch (error) {
        try {
          const { data } = await api.get(`/bookings/${bookingId}`);
          setBookingDetails(data.data || data.booking);
          setStatus('success');
        } catch (e) {
          setStatus('failed');
        }
      }
    };

    confirmAndFetchBooking();
  }, [bookingId, sessionId, searchParams]);

  useEffect(() => {
    if (status !== 'success' || confettiFired.current) return undefined;
    confettiFired.current = true;
    const cancel = fireConfetti();
    return cancel;
  }, [status]);

  const getHotelLocationStr = (hotel) => {
    if (!hotel) return '';
    if (typeof hotel.city === 'string' && hotel.city) {
      return `${hotel.city}${hotel.country ? `, ${hotel.country}` : ''}`;
    }
    if (hotel.address) {
      if (typeof hotel.address === 'string') return hotel.address;
      if (typeof hotel.address === 'object') {
        const parts = [hotel.address.city, hotel.address.country].filter(Boolean);
        if (parts.length > 0) return parts.join(', ');
      }
    }
    return '';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="container flex items-center justify-center py-16" style={{ minHeight: '85vh' }}>
      <div className="card text-center overflow-hidden success-card-wrapper">
        {status === 'loading' && (
          <div className="p-16 text-center">
            <div className="loader mx-auto mb-6" style={{ width: 56, height: 56, borderWidth: 3, borderTopColor: '#8e7355' }}></div>
            <h2 className="text-2xl font-bold mb-2 font-serif text-dark-navy">Verifying Reservation...</h2>
            <p className="text-dark-slate">Please wait while we securely confirm your payment.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="animate-fadeInUp text-left">
            <div className="success-hero-banner">
              <div className="success-check-ring">
                <FiCheckCircle size={38} />
              </div>
              <h2 className="text-3xl font-bold mb-1 font-serif text-white">Reservation Confirmed</h2>
              <p className="text-sm text-slate-300">You are all set for your luxury stay!</p>
            </div>

            <div className="p-8">
              <p className="mb-6 text-center text-sm font-medium text-dark-body">
                A confirmation email with your booking details has been sent to your registered email address.
              </p>

              <div className="success-ticket-box">
                <div className="flex justify-between items-center mb-5 pb-5 border-b border-border border-dashed">
                  <div>
                    <p className="text-xs uppercase tracking-wider font-semibold text-slate-muted">Confirmation Number</p>
                    <p className="font-mono text-xl font-extrabold tracking-wide text-dark-navy">
                      {(bookingId || sessionId || 'BMS-19034').toString().slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wider font-semibold mb-1 text-slate-muted">Status</p>
                    <span className="success-status-badge">
                      <FiCheck size={12} /> CONFIRMED
                    </span>
                  </div>
                </div>

                {bookingDetails && (
                  <div className="mb-5 pb-5 border-b border-border border-dashed space-y-4">
                    <div className="flex items-start gap-3">
                      <FiMapPin className="success-icon-gold" size={20} />
                      <div>
                        <p className="font-bold text-base text-dark-navy">{bookingDetails.hotel?.name || 'Luxury Resort'}</p>
                        <p className="text-sm font-medium text-dark-slate">{getHotelLocationStr(bookingDetails.hotel) || 'Prime Destination'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <FiCalendar className="success-icon-gold" size={20} />
                      <div>
                        <p className="font-bold text-base text-dark-navy">
                          {formatDate(bookingDetails.checkIn)} - {formatDate(bookingDetails.checkOut)}
                        </p>
                        <p className="text-sm font-medium text-dark-slate">
                          {bookingDetails.numberOfRooms || 1} Room(s), {bookingDetails.guests?.adults || 2} Guest(s)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-1">
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate-muted">Total Amount Paid</p>
                  <p className="font-serif text-2xl font-extrabold text-dark-navy">
                    {bookingDetails ? `₹${bookingDetails.totalPrice.toLocaleString('en-IN')}` : 'Paid Securely'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to={bookingId ? `/booking/${bookingId}` : '/bookings'} className="flex-1">
                  <Button className="luxury-submit-btn">View Booking Details</Button>
                </Link>
                <Link to="/me/bookings" className="flex-1">
                  <Button variant="outline" className="w-full py-3 font-bold text-base text-dark-navy">My Reservations</Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="animate-fadeInUp p-10 text-center">
            <div className="mx-auto mb-6 flex items-center justify-center rounded-full bg-red-100 text-red-600" style={{ width: 72, height: 72 }}>
              <FiX size={36} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold mb-3 font-serif text-dark-navy">Payment Unsuccessful</h2>
            <p className="mb-6 leading-relaxed text-sm font-medium text-dark-slate">
              We could not verify your payment or booking details. If any amount was debited, it will be automatically refunded within 3-5 business days.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.history.back()} variant="outline" className="text-dark-navy">Go Back</Button>
              <Link to="/contact">
                <Button>Contact Support</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingSuccess;
