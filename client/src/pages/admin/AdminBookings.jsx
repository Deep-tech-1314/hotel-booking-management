import React, { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import { FiCalendar, FiDollarSign, FiX, FiCheck, FiDownload, FiChevronDown, FiChevronUp, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';

const statuses = ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'paymentFailed'];

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [hotelFilter, setHotelFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const [hotels, setHotels] = useState([]);
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [statusCounts, setStatusCounts] = useState({});

  // Actions states
  const [processingId, setProcessingId] = useState(null);

  const fetchHotels = useCallback(async () => {
    try {
      const { data } = await api.get('/hotels', { params: { limit: 100 } });
      if (data.success) {
        setHotels(data.hotels || []);
      }
    } catch (err) {
      console.error('Failed to fetch hotels:', err);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        status: status || undefined,
        hotel: hotelFilter || undefined,
        search: search || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };
      const { data } = await api.get('/admin/bookings', { params });
      if (data.success) {
        setBookings(data.bookings || []);
        setTotalPages(data.pages || 1);
        if (data.statusCounts) {
          setStatusCounts(data.statusCounts);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  }, [page, status, hotelFilter, search, dateFrom, dateTo]);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleToggleExpand = (id) => {
    setExpandedBookingId(prev => prev === id ? null : id);
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    setProcessingId(bookingId);
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: newStatus });
      toast.success(`Booking status updated to ${newStatus}`);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update booking status');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setProcessingId(bookingId);
    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRefundBooking = async (bookingId) => {
    const reason = prompt('Please enter refund reason:', 'Requested by customer');
    if (reason === null) return;
    setProcessingId(bookingId);
    try {
      await api.post(`/payments/refund/${bookingId}`, { reason });
      toast.success('Refund processed successfully');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process refund');
    } finally {
      setProcessingId(null);
    }
  };

  const handleExportCSV = () => {
    if (bookings.length === 0) {
      toast.error('No bookings to export');
      return;
    }

    const headers = ['Booking ID', 'Guest Name', 'Guest Email', 'Hotel', 'Room Title', 'Check In', 'Check Out', 'Total Price', 'Status', 'Payment Method'];
    const rows = bookings.map(b => [
      b._id,
      b.user?.name || 'N/A',
      b.user?.email || 'N/A',
      b.hotel?.name || 'N/A',
      b.room?.title || 'N/A',
      new Date(b.checkIn).toLocaleDateString('en-IN'),
      new Date(b.checkOut).toLocaleDateString('en-IN'),
      b.totalPrice,
      b.bookingStatus,
      b.paymentInfo?.method || 'N/A'
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bookings_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="admin-flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="admin-page-heading">Bookings</h1>
          <p style={{ color: 'var(--admin-text-secondary)', margin: 0, fontSize: '14px' }}>
            Manage room reservations, check-in statuses, cancellations, and refunds.
          </p>
        </div>
        <button className="admin-btn admin-btn-outline" onClick={handleExportCSV}>
          <FiDownload size={14} /> Export CSV
        </button>
      </div>

      {/* Filters and tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div className="admin-tabs">
          <button className={`admin-tab ${status === '' ? 'active' : ''}`} onClick={() => { setStatus(''); setPage(1); }}>
            All Bookings
          </button>
          {statuses.map(st => (
            <button key={st} className={`admin-tab ${status === st ? 'active' : ''}`} onClick={() => { setStatus(st); setPage(1); }}>
              <span style={{ textTransform: 'capitalize' }}>{st}</span>
              {statusCounts[st] !== undefined && <span className="admin-tab-count">{statusCounts[st]}</span>}
            </button>
          ))}
        </div>

        <div className="admin-filter-bar" style={{ margin: 0 }}>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search booking ID, guest..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />

          <select className="admin-select" value={hotelFilter} onChange={(e) => { setHotelFilter(e.target.value); setPage(1); }}>
            <option value="">All Hotels</option>
            {hotels.map(h => (
              <option key={h._id} value={h._id}>{h.name}</option>
            ))}
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="date" className="admin-search-input" style={{ width: '130px', padding: '7px 10px' }} value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
            <span style={{ color: 'var(--admin-text-muted)', fontSize: '12px' }}>to</span>
            <input type="date" className="admin-search-input" style={{ width: '130px', padding: '7px 10px' }} value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div className="admin-card" style={{ padding: '40px', textAlign: 'center' }}>
          <div className="admin-skeleton" style={{ height: '300px' }} />
        </div>
      ) : bookings.length === 0 ? (
        <div className="admin-card">
          <div className="admin-empty">
            <div className="admin-empty-icon">📅</div>
            <div className="admin-empty-title">No Bookings Found</div>
            <p style={{ fontSize: '13px', margin: 0 }}>Try adjusting your filters or search terms.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <div className="admin-table-scroll-hint">← Swipe to view more →</div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Guest</th>
                  <th>Hotel &amp; Room</th>
                  <th>Check In / Out</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const isExpanded = expandedBookingId === b._id;
                  return (
                    <React.Fragment key={b._id}>
                      <tr style={{ cursor: 'pointer' }} onClick={() => handleToggleExpand(b._id)}>
                        <td className="admin-text-mono" style={{ fontSize: '13px' }}>
                          #{b._id.slice(-8).toUpperCase()}
                        </td>
                        <td>
                          {b.user ? (
                            <div>
                              <div style={{ fontWeight: 600 }}>{b.user.name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--admin-text-secondary)' }}>{b.user.email}</div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--admin-text-muted)' }}>Guest N/A</span>
                          )}
                        </td>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600 }}>{b.hotel?.name || 'Hotel N/A'}</div>
                            <div style={{ fontSize: '11px', color: 'var(--admin-text-secondary)', textTransform: 'capitalize' }}>
                              {b.room?.title || 'Room N/A'}
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: '13px' }}>
                          <div>
                            <div>In: {new Date(b.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                            <div style={{ color: 'var(--admin-text-secondary)', fontSize: '11px' }}>
                              Out: {new Date(b.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>₹{b.totalPrice?.toLocaleString('en-IN')}</div>
                          <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--admin-text-muted)' }}>
                            {b.paymentInfo?.method || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-badge admin-badge-${b.bookingStatus}`}>
                            {b.bookingStatus}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                            {b.bookingStatus === 'pending' && (
                              <button
                                onClick={() => handleUpdateStatus(b._id, 'confirmed')}
                                className="admin-btn admin-btn-success admin-btn-sm"
                                disabled={processingId === b._id}
                                title="Confirm Booking"
                              >
                                <FiCheck size={14} />
                              </button>
                            )}
                            {b.bookingStatus === 'confirmed' && (
                              <button
                                onClick={() => handleUpdateStatus(b._id, 'checked-in')}
                                className="admin-btn admin-btn-outline admin-btn-sm"
                                style={{ color: 'var(--admin-primary)', borderColor: 'var(--admin-primary)' }}
                                disabled={processingId === b._id}
                                title="Check In"
                              >
                                Check In
                              </button>
                            )}
                            {b.bookingStatus === 'checked-in' && (
                              <button
                                onClick={() => handleUpdateStatus(b._id, 'checked-out')}
                                className="admin-btn admin-btn-outline admin-btn-sm"
                                style={{ color: '#8b5cf6', borderColor: '#8b5cf6' }}
                                disabled={processingId === b._id}
                                title="Check Out"
                              >
                                Check Out
                              </button>
                            )}
                            {['pending', 'confirmed'].includes(b.bookingStatus) && (
                              <button
                                onClick={() => handleCancelBooking(b._id)}
                                className="admin-btn admin-btn-danger admin-btn-sm"
                                disabled={processingId === b._id}
                                title="Cancel Reservation"
                              >
                                <FiX size={14} />
                              </button>
                            )}
                            {b.bookingStatus === 'cancelled' && (!b.cancellation || b.cancellation.refundStatus !== 'processed') && (
                              <button
                                onClick={() => handleRefundBooking(b._id)}
                                className="admin-btn admin-btn-outline admin-btn-sm"
                                style={{ color: '#d97706', borderColor: '#f59e0b' }}
                                disabled={processingId === b._id}
                                title="Process Refund"
                              >
                                Refund
                              </button>
                            )}
                            <button
                              className="admin-btn admin-btn-outline admin-btn-sm"
                              onClick={() => handleToggleExpand(b._id)}
                            >
                              {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Section */}
                      <tr>
                        <td colSpan="7" style={{ padding: 0 }}>
                          <div className={`admin-accordion-content ${isExpanded ? 'open' : ''}`}>
                            <div className="admin-accordion-inner">
                              <div className="admin-grid-3">
                                <div>
                                  <h4 style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 8px 0' }}>Reservation Details</h4>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                                    <div><strong>Guests:</strong> {b.guests?.adults || 1} Adults, {b.guests?.children || 0} Children</div>
                                    <div><strong>Number of Rooms:</strong> {b.numberOfRooms || 1}</div>
                                    <div><strong>Check-in Scheduled:</strong> {new Date(b.checkIn).toLocaleString('en-IN')}</div>
                                    <div><strong>Check-out Scheduled:</strong> {new Date(b.checkOut).toLocaleString('en-IN')}</div>
                                    {b.actualCheckIn && <div><strong>Checked In At:</strong> {new Date(b.actualCheckIn).toLocaleString('en-IN')}</div>}
                                    {b.actualCheckOut && <div><strong>Checked Out At:</strong> {new Date(b.actualCheckOut).toLocaleString('en-IN')}</div>}
                                  </div>
                                </div>
                                <div>
                                  <h4 style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 8px 0' }}>Financial breakdown</h4>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                                    <div><strong>Room Charges:</strong> ₹{b.priceBreakdown?.roomCharges?.toLocaleString('en-IN') || 0}</div>
                                    <div><strong>Taxes (GST):</strong> ₹{b.priceBreakdown?.taxes?.toLocaleString('en-IN') || 0}</div>
                                    {b.priceBreakdown?.serviceFee > 0 && <div><strong>Service Fee:</strong> ₹{b.priceBreakdown?.serviceFee?.toLocaleString('en-IN')}</div>}
                                    {b.priceBreakdown?.discount > 0 && <div style={{ color: '#10b981' }}><strong>Discount Applied:</strong> -₹{b.priceBreakdown?.discount}</div>}
                                    <div style={{ fontSize: '13px', borderTop: '1px solid var(--admin-border)', paddingTop: '6px', marginTop: '4px' }}>
                                      <strong>Gross Amount Paid:</strong> ₹{b.totalPrice?.toLocaleString('en-IN')}
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 8px 0' }}>Disbursement &amp; Payouts</h4>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                                    <div><strong>Platform Fee Rate:</strong> 15%</div>
                                    <div><strong>Platform Commission:</strong> ₹{b.commissionAmount?.toLocaleString('en-IN') || 0}</div>
                                    <div style={{ color: '#059669' }}><strong>Owner Net Share:</strong> ₹{b.netAmount?.toLocaleString('en-IN') || 0}</div>
                                    {b.cancellation?.refundAmount > 0 && (
                                      <div style={{ marginTop: '8px', borderTop: '1px solid var(--admin-border)', paddingTop: '6px' }}>
                                        <div style={{ color: '#dc2626' }}><strong>Refund Amount:</strong> ₹{b.cancellation.refundAmount.toLocaleString('en-IN')}</div>
                                        <div><strong>Refund Status:</strong> <span className={`admin-badge admin-badge-${b.cancellation.refundStatus}`}>{b.cancellation.refundStatus}</span></div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="admin-pagination">
              <button
                className="admin-page-btn"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  className={`admin-page-btn ${page === i + 1 ? 'active' : ''}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="admin-page-btn"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminBookings;
