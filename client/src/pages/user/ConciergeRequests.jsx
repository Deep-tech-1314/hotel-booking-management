import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiPlus, FiClock, FiCheckCircle, FiXCircle, FiSend, FiTruck, FiCoffee, FiStar, FiCalendar } from 'react-icons/fi';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

const ConciergeRequests = () => {
  const [requests, setRequests] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    bookingId: '',
    requestType: 'airport_transfer',
    title: '',
    details: '',
    flightDetails: { airline: '', flightNumber: '', arrivalTime: '' },
    preferredTime: '',
  });

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/concierge/me');
      if (data.success) setRequests(data.data || []);
    } catch (err) {
      toast.error('Failed to load concierge requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/bookings/me');
      if (data.success) setMyBookings(data.bookings || []);
    } catch (err) { /* ignore */ }
  };

  useEffect(() => {
    fetchRequests();
    fetchBookings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.bookingId || !form.title || !form.details) {
      return toast.error('Please select a booking and fill in request details');
    }

    setSubmitting(true);
    try {
      await api.post('/concierge', form);
      toast.success('Concierge service request submitted successfully!');
      setShowModal(false);
      setForm({
        bookingId: '',
        requestType: 'airport_transfer',
        title: '',
        details: '',
        flightDetails: { airline: '', flightNumber: '', arrivalTime: '' },
        preferredTime: '',
      });
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
      case 'fulfilled':
        return <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 rounded-full text-xs font-bold flex items-center gap-1"><FiCheckCircle /> CONFIRMED</span>;
      case 'declined':
        return <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 rounded-full text-xs font-bold flex items-center gap-1"><FiXCircle /> DECLINED</span>;
      default:
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 dark:bg-yellow-900/40 dark:text-yellow-400 rounded-full text-xs font-bold flex items-center gap-1"><FiClock /> PENDING</span>;
    }
  };

  return (
    <div className="container py-12" style={{ maxWidth: '900px' }}>
      <div className="flex justify-between items-end mb-8 flex-wrap gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold font-serif mb-2">Concierge & Special Services</h1>
          <p className="text-secondary text-sm">Request airport pickups, late check-out, room upgrades, or special amenities for your stays</p>
        </div>

        <Button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus size={18} /> New Request
        </Button>
      </div>

      {/* List of Requests */}
      <div className="flex flex-col gap-6">
        {loading ? (
          <div className="page-loader"><div className="loader"></div></div>
        ) : requests.length === 0 ? (
          <div className="card p-12 text-center border border-border shadow-sm">
            <FiTruck size={40} className="mx-auto mb-4 text-grand-gold" />
            <h3 className="text-xl font-bold font-serif mb-2">No Service Requests</h3>
            <p className="text-secondary max-w-md mx-auto mb-6 text-sm">
              Enhance your luxury stay by requesting tailored concierge services like private airport transfers, late check-outs, or celebratory arrangements.
            </p>
            <Button onClick={() => setShowModal(true)} className="btn-primary">
              Make Your First Request
            </Button>
          </div>
        ) : (
          requests.map((r) => (
            <div key={r._id} className="card p-6 border border-border shadow-sm flex flex-col gap-4 bg-primary">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <h3 className="text-xl font-bold font-serif text-primary dark:text-white mb-1">{r.title}</h3>
                  <p className="text-xs text-secondary flex items-center gap-2">
                    <FiCalendar size={12} className="text-grand-gold" /> Hotel: <strong>{r.hotel?.name}</strong> • Submitted {new Date(r.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                {getStatusBadge(r.status)}
              </div>

              <div className="p-4 rounded-xl bg-primary-light border border-border/50 text-sm text-secondary leading-relaxed">
                {r.details}
                {r.preferredTime && (
                  <div className="mt-2 text-xs font-semibold text-primary dark:text-gray-300">
                    Preferred Time: {r.preferredTime}
                  </div>
                )}
              </div>

              {r.responseMessage && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm text-amber-200">
                  <strong>Hotel Response:</strong> {r.responseMessage}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Request Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Concierge Request">
        <form onSubmit={handleSubmit} className="p-2 flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">Select Stay / Reservation *</label>
            <select
              value={form.bookingId}
              onChange={(e) => setForm({ ...form, bookingId: e.target.value })}
              required
              className="w-full p-3 bg-primary border border-border rounded-lg text-sm text-primary dark:text-white"
            >
              <option value="">-- Choose an upcoming stay --</option>
              {myBookings.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.hotel?.name} ({new Date(b.checkIn).toLocaleDateString('en-IN')} - {new Date(b.checkOut).toLocaleDateString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">Service Type *</label>
            <select
              value={form.requestType}
              onChange={(e) => setForm({ ...form, requestType: e.target.value })}
              className="w-full p-3 bg-primary border border-border rounded-lg text-sm text-primary dark:text-white"
            >
              <option value="airport_transfer">🚗 Private Airport Pickup / Transfer</option>
              <option value="late_checkout">🕒 Late Check-out Request</option>
              <option value="early_checkin">🌅 Early Check-in Request</option>
              <option value="room_upgrade">✨ Room Upgrade Inquiry</option>
              <option value="dietary_preference">🍽️ Special Dietary / Dining Arrangement</option>
              <option value="special_amenity">🎁 Anniversary / Birthday Celebration</option>
              <option value="other">📌 Other Assistance</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">Subject / Title *</label>
            <input
              type="text"
              placeholder="e.g. Airport Transfer for 2 Adults with luggage"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full p-3 bg-primary border border-border rounded-lg text-sm text-primary dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">Detailed Description *</label>
            <textarea
              rows={4}
              placeholder="Provide flight details, preferred timing, or specific preferences..."
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
              required
              className="w-full p-3 bg-primary border border-border rounded-lg text-sm text-primary dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} className="btn-primary flex items-center gap-2">
              <FiSend size={16} /> Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ConciergeRequests;
