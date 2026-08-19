import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../utils/api';
import { calculateNights, formatDate, formatPrice, getStatusColor } from '../../utils/constants';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

const BookingDetails = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchBooking = async () => {
    try {
      const { data } = await api.get(`/bookings/${id}`);
      setBooking(data.booking);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load booking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const canCancel = useMemo(() => {
    if (!booking) return false;
    return ['pending', 'confirmed'].includes(booking.bookingStatus);
  }, [booking]);

  const handleCancel = async () => {
    if (!canCancel) return;
    if (!window.confirm('Cancel this booking? Refunds follow the hotel cancellation policy.')) return;

    setCancelling(true);
    try {
      const { data } = await api.put(`/bookings/${booking._id}/cancel`, {
        reason: 'Guest requested cancellation',
      });
      setBooking(data.booking);
      toast.success('Booking cancelled');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirmPayment = async () => {
    try {
      const { data } = await api.post('/payments/verify-success', { bookingId: booking._id, method: 'card' });
      if (data.success) {
        toast.success('Payment confirmed & reservation updated!');
        fetchBooking();
      }
    } catch (err) {
      toast.error('Failed to confirm payment: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return <div className="page-loader"><div className="loader"></div></div>;
  }

  if (!booking) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Booking not found</h1>
        <Link to="/bookings"><Button>Back to bookings</Button></Link>
      </div>
    );
  }

  const nights = calculateNights(booking.checkIn, booking.checkOut);
  const guestCount = (booking.guests?.adults || 0) + (booking.guests?.children || 0);
  const breakdown = booking.priceBreakdown || {};

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <p className="text-sm text-secondary mb-2">Booking ID: {booking._id}</p>
          <h1 className="text-3xl font-bold">Reservation Details</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" onClick={() => window.print()}>Download Invoice</Button>
          {canCancel && (
            <Button variant="danger" onClick={handleCancel} loading={cancelling}>
              Cancel Booking
            </Button>
          )}
        </div>
      </div>

      <div className="grid booking-detail-grid">
        <section className="card p-6">
          <div className="flex gap-4 mb-6 booking-detail-hero">
            <img
              src={booking.hotel?.images?.[0]?.url || 'https://images.unsplash.com/photo-1542314831-c6a4d1400820?auto=format&fit=crop&q=80&w=800'}
              alt={booking.hotel?.name}
              style={{ width: 180, height: 130, objectFit: 'cover', borderRadius: 'var(--radius-lg)' }}
            />
            <div>
              <h2 className="text-2xl font-bold mb-2">{booking.hotel?.name}</h2>
              <p className="text-secondary mb-2">
                {booking.hotel?.address?.street}, {booking.hotel?.address?.city}, {booking.hotel?.address?.country}
              </p>
              <span className={`badge badge-${getStatusColor(booking.bookingStatus)}`}>
                {booking.bookingStatus}
              </span>
            </div>
          </div>

          <div className="grid grid-2 gap-4 mb-6">
            <div className="detail-tile">
              <span>Check-in</span>
              <strong>{formatDate(booking.checkIn)}</strong>
            </div>
            <div className="detail-tile">
              <span>Check-out</span>
              <strong>{formatDate(booking.checkOut)}</strong>
            </div>
            <div className="detail-tile">
              <span>Room</span>
              <strong>{booking.room?.title}</strong>
            </div>
            <div className="detail-tile">
              <span>Guests</span>
              <strong>{guestCount || 1} guests, {booking.numberOfRooms || 1} room</strong>
            </div>
          </div>

          <h3 className="text-xl font-bold mb-3">Room Details</h3>
          <p className="text-secondary mb-4">
            {booking.room?.roomType} room for {nights} night{nights === 1 ? '' : 's'}.
          </p>
          {booking.room?.amenities?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {booking.room.amenities.map((amenity) => (
                <span className="badge badge-secondary" key={amenity}>{amenity}</span>
              ))}
            </div>
          )}
        </section>

        <aside className="card p-6 h-fit">
          <h2 className="text-xl font-bold mb-4">Payment Summary</h2>
          <div className="summary-list">
            <div><span>Room charge</span><strong>{formatPrice(breakdown.roomCharges || 0)}</strong></div>
            <div><span>Taxes</span><strong>{formatPrice(breakdown.taxes || 0)}</strong></div>
            <div><span>Service fee</span><strong>{formatPrice(breakdown.serviceFee || 0)}</strong></div>
            {(breakdown.discount || 0) > 0 && <div><span>Discount</span><strong>-{formatPrice(breakdown.discount)}</strong></div>}
            <div className="summary-total"><span>Total</span><strong>{formatPrice(booking.totalPrice)}</strong></div>
          </div>
          {(() => {
            const isConfirmedOrPaid = ['confirmed', 'checked-in', 'checked-out'].includes(booking.bookingStatus);
            const paymentStatus = isConfirmedOrPaid ? 'paid' : (booking.paymentInfo?.status || 'pending');
            return (
              <>
                <div className={`badge badge-${paymentStatus === 'paid' ? 'success' : paymentStatus === 'refunded' ? 'warning' : 'danger'} mt-4`}>
                  Payment: {paymentStatus.toUpperCase()}
                </div>
                {paymentStatus === 'pending' && (
                  <Button
                    size="sm"
                    onClick={handleConfirmPayment}
                    className="btn-primary w-full mt-3 font-bold"
                  >
                    Confirm Payment
                  </Button>
                )}
              </>
            );
          })()}

          {booking.hotel?.policies && (
            <div className="border-t mt-4 pt-4">
              <h3 className="font-bold mb-2">Hotel Policies</h3>
              <p className="text-sm text-secondary">Check-in: {booking.hotel.policies.checkIn}</p>
              <p className="text-sm text-secondary">Check-out: {booking.hotel.policies.checkOut}</p>
              <p className="text-sm text-secondary">Cancellation: {booking.hotel.policies.cancellation}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default BookingDetails;
