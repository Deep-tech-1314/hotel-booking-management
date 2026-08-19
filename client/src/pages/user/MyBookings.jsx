import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyBookings, cancelBooking } from '../../redux/slices/bookingSlice';
import { calculateNights, formatDate, formatPrice, getStatusColor } from '../../utils/constants';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import InvoiceModal from '../../components/common/InvoiceModal';
import toast from 'react-hot-toast';
import { FiCalendar, FiMapPin, FiClock, FiAlertTriangle, FiCheckCircle, FiDownload } from 'react-icons/fi';

const MyBookings = () => {
  const dispatch = useDispatch();
  const { bookings, loading } = useSelector((state) => state.bookings);
  const [filter, setFilter] = useState('');
  const [cancelModal, setCancelModal] = useState({ isOpen: false, bookingId: null });
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    dispatch(fetchMyBookings(filter));
  }, [dispatch, filter]);

  const confirmCancel = (id) => {
    setCancelModal({ isOpen: true, bookingId: id });
  };

  const handleCancel = async () => {
    if (!cancelModal.bookingId) return;
    setIsCancelling(true);
    try {
      await dispatch(cancelBooking({ id: cancelModal.bookingId, reason: 'User requested cancellation' })).unwrap();
      toast.success('Booking cancelled successfully');
      setCancelModal({ isOpen: false, bookingId: null });
    } catch (err) {
      toast.error(err || 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmPayment = async (bookingId) => {
    try {
      const { data } = await api.post('/payments/verify-success', { bookingId, method: 'card' });
      if (data.success) {
        toast.success('Payment confirmed & booking status updated!');
        dispatch(fetchMyBookings());
      }
    } catch (err) {
      toast.error('Failed to confirm payment: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading && bookings.length === 0) {
    return <div className="page-loader"><div className="loader" style={{ borderTopColor: 'var(--grand-gold)' }}></div></div>;
  }

  return (
    <div className="container py-12" style={{ maxWidth: '900px' }}>
      <div className="flex justify-between items-end mb-10 flex-wrap gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold font-serif mb-2">My Bookings</h1>
          <p className="text-secondary text-sm">Manage your upcoming stays and past reservations</p>
        </div>
        <select
          className="form-select bg-primary border border-border rounded-lg text-sm"
          style={{ width: '200px', padding: '10px 16px' }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All Reservations</option>
          <option value="confirmed">Upcoming Stays</option>
          <option value="checked-out">Past Stays</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="flex flex-col gap-6 cine-list-enter">
        {bookings.length === 0 ? (
          <div className="card p-12 text-center border-border shadow-sm">
            <div className="mx-auto mb-6" style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(197, 168, 128, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--grand-gold)' }}>
              <FiCalendar size={28} />
            </div>
            <h3 className="text-xl font-bold font-serif mb-2">No reservations found</h3>
            <p className="text-secondary mb-8 max-w-md mx-auto leading-relaxed">
              You haven't made any bookings yet, or none match your current filter. Start exploring our curated collection of extraordinary stays.
            </p>
            <Link to="/hotels">
              <Button className="btn-primary" style={{ padding: '12px 32px' }}>Explore the Collection</Button>
            </Link>
          </div>
        ) : (
          bookings.map((booking) => {
            const guestCount = (booking.guests?.adults || 0) + (booking.guests?.children || 0);
            const isConfirmedOrPaid = ['confirmed', 'checked-in', 'checked-out'].includes(booking.bookingStatus);
            const paymentStatus = isConfirmedOrPaid ? 'paid' : (booking.paymentInfo?.status || 'pending');
            const nights = calculateNights(booking.checkIn, booking.checkOut) || 1;
            
            const city = booking.hotel?.address?.city || booking.hotel?.city || 'Location';
            const state = booking.hotel?.address?.state ? `, ${booking.hotel.address.state}` : '';
            const locationStr = `${city}${state}`;
            
            // Context sensitive status
            let isUpcoming = booking.bookingStatus === 'confirmed' && new Date(booking.checkIn) > new Date();
            let isOngoing = booking.bookingStatus === 'checked-in';
            let isPast = ['completed', 'checked-out'].includes(booking.bookingStatus);
            let isCancelled = booking.bookingStatus === 'cancelled';

            return (
              <div key={booking._id} className="card flex flex-col md:flex-row overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow group">
                <div className="md:w-64 h-48 md:h-auto relative overflow-hidden flex-shrink-0">
                  <img
                    src={booking.hotel?.images?.[0]?.url || 'https://images.unsplash.com/photo-1542314831-c6a4d1400820?auto=format&fit=crop&q=80&w=400'}
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542314831-c6a4d1400820?auto=format&fit=crop&q=80&w=400'; }}
                    alt={booking.hotel?.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden"></div>
                  {isUpcoming && <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full shadow-sm text-black">UPCOMING</div>}
                  {isOngoing && <div className="absolute top-4 left-4 bg-green-500/90 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full shadow-sm text-white">IN PROGRESS</div>}
                  {isCancelled && <div className="absolute top-4 left-4 bg-red-500/90 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full shadow-sm text-white">CANCELLED</div>}
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-between bg-primary relative">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-xl font-bold font-serif text-primary dark:text-white">{booking.hotel?.name || 'Hotel Stay'}</h3>
                      <div className="text-right">
                        <span className="font-serif text-xl font-bold text-grand-gold block leading-none">{formatPrice(booking.totalPrice)}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-secondary mb-6 flex items-center gap-2">
                      <FiMapPin size={14} className="text-grand-gold" /> {locationStr} • {booking.room?.title || booking.room?.roomType || 'Deluxe Room'}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 rounded-xl border border-border" style={{ backgroundColor: 'var(--grand-card, rgba(0,0,0,0.03))' }}>
                      <div>
                        <span className="text-xs uppercase tracking-wider text-secondary block mb-1">Check-in</span>
                        <span className="font-semibold text-sm text-primary dark:text-white">{formatDate(booking.checkIn)}</span>
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider text-secondary block mb-1">Check-out</span>
                        <span className="font-semibold text-sm text-primary dark:text-white">{formatDate(booking.checkOut)}</span>
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider text-secondary block mb-1">Duration</span>
                        <span className="font-semibold text-sm text-primary dark:text-white">{nights} night{nights !== 1 ? 's' : ''}</span>
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider text-secondary block mb-1">Guests</span>
                        <span className="font-semibold text-sm text-primary dark:text-white">{guestCount || 1} Guest{guestCount > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border">
                    <div className="flex gap-2">
                      <span className={`text-xs px-3 py-1 rounded-md font-bold tracking-wider ${
                        paymentStatus === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border border-green-300 dark:border-green-800' : 
                        paymentStatus === 'refunded' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 border border-orange-300 dark:border-orange-800' :
                        'bg-amber-100 text-amber-800 dark:bg-yellow-900/40 dark:text-yellow-400 border border-amber-300 dark:border-yellow-800'
                      }`}>
                        PAYMENT: {paymentStatus.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex gap-3 ml-auto flex-wrap">
                      {paymentStatus === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleConfirmPayment(booking._id)}
                          className="btn-primary flex items-center gap-1 font-bold"
                        >
                          Confirm Payment
                        </Button>
                      )}

                      {paymentStatus === 'paid' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInvoiceBooking(booking)}
                          className="border-border hover:border-grand-gold text-primary dark:text-white flex items-center gap-1"
                        >
                          <FiDownload size={14} /> Tax Invoice
                        </Button>
                      )}

                      {['confirmed', 'pending'].includes(booking.bookingStatus) && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => confirmCancel(booking._id)}
                          className="border-red-900/30 text-red-400 hover:bg-red-900/10 hover:border-red-500/50 hover:text-red-300"
                        >
                          Cancel Reservation
                        </Button>
                      )}
                      
                      {isPast && (
                        <Link to={`/hotel/${booking.hotel?._id}`}>
                          <Button variant="outline" size="sm" className="border-border hover:border-grand-gold">
                            Book Again
                          </Button>
                        </Link>
                      )}

                      <Link to={`/booking/${booking._id}`}>
                        <Button className="btn-primary" size="sm">
                          {isUpcoming ? 'Manage Booking' : 'View Details'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal 
        isOpen={cancelModal.isOpen} 
        onClose={() => setCancelModal({ isOpen: false, bookingId: null })}
        title="Cancel Reservation"
      >
        <div className="p-2">
          <div className="flex items-center gap-4 mb-4 p-4 bg-orange-900/10 border border-orange-900/30 rounded-lg">
            <FiAlertTriangle size={24} className="text-orange-500 flex-shrink-0" />
            <p className="text-sm text-orange-200">
              Are you sure you want to cancel this reservation? Depending on the hotel's policy, a cancellation fee may apply.
            </p>
          </div>
          <p className="text-sm text-secondary mb-6">
            If you have already paid, any eligible refunds will be automatically processed to your original payment method within 5-7 business days. This action cannot be undone.
          </p>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
            <Button variant="outline" onClick={() => setCancelModal({ isOpen: false, bookingId: null })} disabled={isCancelling}>
              Keep Booking
            </Button>
            <Button 
              variant="danger" 
              onClick={handleCancel}
              loading={isCancelling}
              className="bg-red-600 hover:bg-red-700 text-white border-0"
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={!!selectedInvoiceBooking}
        onClose={() => setSelectedInvoiceBooking(null)}
        booking={selectedInvoiceBooking}
      />
    </div>
  );
};

export default MyBookings;
