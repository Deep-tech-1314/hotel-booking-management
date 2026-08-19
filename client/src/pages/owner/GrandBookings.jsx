import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOwnerBookings } from '../../redux/slices/ownerSlice';
import api, { createBookingEventSource } from '../../utils/api';
import toast from 'react-hot-toast';
import { FiSearch, FiCalendar, FiFilter, FiCheckCircle, FiXCircle, FiLogOut, FiPlus } from 'react-icons/fi';
import { DashboardSkeleton } from '../../components/common/Skeleton';

const fmtMoney = (v) => `₹${(v || 0).toLocaleString('en-IN')}`;

const FILTERS = ['All', 'Today', 'Upcoming', 'Pending', 'Cancelled'];

const GrandBookings = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading: authLoading } = useSelector((s) => s.auth);
  const { bookings, loading, error } = useSelector((s) => s.owner);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const getDynamicDateRange = () => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 7);
    const formatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', formatOptions)} - ${end.toLocaleDateString('en-US', formatOptions)}`;
  };

  useEffect(() => {
    if (authLoading || !isAuthenticated) return undefined;

    dispatch(fetchOwnerBookings({ limit: 100 }));

    let es;
    if (user?.role === 'owner' || user?.role === 'admin') {
      es = createBookingEventSource();
      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'connected') return;
          if (['new_booking', 'check_in', 'cancellation', 'booking.payment_confirmed', 'booking.refund_processed'].includes(payload.type)) {
            dispatch(fetchOwnerBookings({ limit: 100 }));
          }
        } catch (e) { /* ignore malformed event */ }
      };
      es.onerror = () => es?.close();
    }
    return () => { if (es) es.close(); };
  }, [dispatch, authLoading, isAuthenticated, user]);

  if (loading && !bookings?.stats) return <DashboardSkeleton cards={4} />;
  if (error && !bookings?.stats) return <div style={{ color: 'var(--grand-text-muted)' }}>Error loading bookings: {error}</div>;
  if (!bookings || !bookings.stats) return <DashboardSkeleton cards={4} />;

  const { stats, table } = bookings;

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: newStatus });
      toast.success(`Booking updated to ${newStatus}`);
      dispatch(fetchOwnerBookings({ limit: 100 }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update booking status');
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const applyFilter = (row) => {
    const checkIn = new Date(row.dates?.split('→')[0]?.trim());
    switch (activeFilter) {
      case 'Today':
        return checkIn >= today && checkIn < tomorrow;
      case 'Upcoming':
        return checkIn >= tomorrow;
      case 'Pending':
        return row.status === 'pending';
      case 'Cancelled':
        return row.status === 'cancelled';
      default:
        return true;
    }
  };

  const filteredTable = table.filter(row =>
    applyFilter(row) && (
      row.guest.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.ref.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getStatusClass = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'checked-in': return 'checked-in';
      case 'pending': return 'pending';
      case 'confirmed': return 'confirmed';
      case 'checked-out': return 'checked-out';
      case 'cancelled': return 'cancelled';
      case 'paymentfailed': return 'cancelled';
      default: return '';
    }
  };

  return (
    <div>
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="grand-h1" style={{ marginBottom: '4px' }}>Bookings</h1>
          <p className="grand-subtext">Manage and view all reservations</p>
        </div>
        <div>
          <button className="grand-btn" onClick={() => window.open('/', '_blank')}>
            <FiPlus /> New Booking
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grand-grid grand-grid-4" style={{ marginBottom: '32px' }}>
        <div className="grand-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="grand-label">Total Bookings</div>
            <span className="grand-pill grand-pill-success">All time</span>
          </div>
          <div className="grand-stat-value">{stats.totalBookings || 0}</div>
        </div>
        
        <div className="grand-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="grand-label">Pending Approval</div>
            <span className="grand-pill grand-pill-danger">Action Needed</span>
          </div>
          <div className="grand-stat-value">{stats.pendingApproval || 0}</div>
        </div>

        <div className="grand-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="grand-label">Arrivals Today</div>
            <span className="grand-pill grand-pill-success">Today</span>
          </div>
          <div className="grand-stat-value">{stats.arrivalsToday || 0}</div>
        </div>

        <div className="grand-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="grand-label">Revenue This Month</div>
            <span className="grand-pill grand-pill-success">This Month</span>
          </div>
          <div className="grand-stat-value">{fmtMoney(stats.revenueMonth)}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', backgroundColor: 'var(--grand-card)', padding: '12px 24px', borderRadius: '12px', border: '1px solid var(--grand-border)' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                border: activeFilter === f ? '1px solid var(--grand-gold)' : '1px solid transparent',
                backgroundColor: activeFilter === f ? 'rgba(245,197,67,0.1)' : 'transparent',
                color: activeFilter === f ? 'var(--grand-gold)' : 'var(--grand-text-muted)',
                transition: 'all 0.15s ease',
                fontFamily: 'inherit',
              }}
            >
              {f}
              {f === 'Pending' && stats.pendingApproval > 0 && (
                <span style={{ marginLeft: '6px', backgroundColor: 'var(--grand-danger)', color: '#fff', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', fontWeight: 700 }}>
                  {stats.pendingApproval}
                </span>
              )}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="grand-search" style={{ width: '220px', padding: '8px 12px', backgroundColor: 'var(--grand-bg)' }}>
            <FiSearch color="var(--grand-text-muted)" size={14} />
            <input 
              type="text" 
              placeholder="Search guest or ID..." 
              style={{ fontSize: '13px' }} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="grand-btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', border: '1px solid var(--grand-border)', backgroundColor: 'var(--grand-bg)', cursor: 'pointer', fontFamily: 'inherit' }}>
            <FiCalendar /> {getDynamicDateRange()}
          </button>
          <button className="grand-btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', border: '1px solid var(--grand-border)', backgroundColor: 'var(--grand-bg)', cursor: 'pointer', fontFamily: 'inherit' }}>
            <FiFilter /> Room Type
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="grand-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="grand-table">
          <thead>
            <tr>
              <th>Guest</th>
              <th>Booking ID</th>
              <th>Room</th>
              <th>Dates</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTable.length > 0 ? filteredTable.map((row, idx) => (
              <tr key={row.id || idx}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--grand-bg)', border: '1px solid var(--grand-border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: 'var(--grand-text-muted)', fontWeight: 600 }}>
                      {row.initials}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--grand-text)' }}>{row.guest}</div>
                      <div style={{ fontSize: '12px', color: 'var(--grand-text-muted)' }}>{row.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--grand-text-muted)', fontFamily: 'monospace', fontSize: '12px' }}>{row.ref}</td>
                <td>
                  <div style={{ color: 'var(--grand-text)' }}>{row.roomTitle}</div>
                  <div style={{ fontSize: '12px', color: 'var(--grand-text-muted)', textTransform: 'capitalize' }}>{row.roomNum}</div>
                </td>
                <td>
                  <div style={{ color: 'var(--grand-text)' }}>{row.dates}</div>
                  <div style={{ fontSize: '12px', color: 'var(--grand-text-muted)' }}>{row.nights}</div>
                </td>
                <td>
                  <span className={`grand-status ${getStatusClass(row.status)}`}>{row.status?.toUpperCase()}</span>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  {fmtMoney(row.amount)}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    {(row.status === 'confirmed' || row.status === 'pending') && (
                      <button 
                        onClick={() => handleStatusChange(row.id, 'checked-in')}
                        title="Mark as Checked-In"
                        style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', backgroundColor: 'rgba(16,185,129,0.2)', color: '#34d399', border: '1px solid rgba(16,185,129,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit' }}>
                        <FiCheckCircle size={12} /> Check-In
                      </button>
                    )}
                    {row.status === 'checked-in' && (
                      <button 
                        onClick={() => handleStatusChange(row.id, 'checked-out')}
                        title="Mark as Checked-Out"
                        style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', backgroundColor: 'rgba(59,130,246,0.2)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit' }}>
                        <FiLogOut size={12} /> Check-Out
                      </button>
                    )}
                    {['pending', 'confirmed'].includes(row.status) && (
                      <button 
                        onClick={() => handleStatusChange(row.id, 'cancelled')}
                        title="Cancel Booking"
                        style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', backgroundColor: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit' }}>
                        <FiXCircle size={12} /> Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: 'var(--grand-text-muted)' }}>
                  {searchTerm || activeFilter !== 'All' ? 'No bookings match this filter.' : 'No bookings found for your properties.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GrandBookings;
