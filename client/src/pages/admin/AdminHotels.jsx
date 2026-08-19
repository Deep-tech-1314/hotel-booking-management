import React, { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import { FiHome, FiCheck, FiX, FiTrash2, FiEye, FiMapPin, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';

const categories = ['hotel', 'resort', 'villa', 'apartment', 'hostel', 'guesthouse'];

const AdminHotels = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState(''); // '' means All
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [search, setSearch] = useState('');
  const [cities, setCities] = useState([]);
  const [statusCounts, setStatusCounts] = useState({ pending: 0, approved: 0, rejected: 0 });

  // Modals / Dialog state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fetchCities = useCallback(async () => {
    try {
      const { data } = await api.get('/hotels/cities');
      if (data.success) {
        setCities(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch cities:', err);
    }
  }, []);

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        status: status || undefined,
        category: category || undefined,
        city: city || undefined,
        search: search || undefined,
      };
      const { data } = await api.get('/admin/hotels', { params });
      if (data.success) {
        setHotels(data.hotels || []);
        setTotalPages(data.pages || 1);
        if (data.statusCounts) {
          setStatusCounts(data.statusCounts);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load hotels');
    } finally {
      setLoading(false);
    }
  }, [page, status, category, city, search]);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/hotels/${id}/approve`);
      toast.success('Hotel approved successfully');
      fetchHotels();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve hotel');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Please enter a rejection reason:', 'Did not meet platform requirements');
    if (reason === null) return;
    try {
      await api.put(`/admin/hotels/${id}/reject`, { reason });
      toast.success('Hotel rejected');
      fetchHotels();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject hotel');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/hotels/${deleteConfirmId}`);
      toast.success('Hotel deleted successfully');
      setDeleteConfirmId(null);
      fetchHotels();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete hotel');
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < rating ? '#f59e0b' : 'var(--admin-border)' }}>★</span>
    ));
  };

  const handleTabChange = (newStatus) => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <div>
      <div className="admin-flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="admin-page-heading">Properties</h1>
          <p style={{ color: 'var(--admin-text-secondary)', margin: 0, fontSize: '14px' }}>
            Manage hotel listings and verify pending submissions.
          </p>
        </div>
      </div>

      {/* Filter Tabs / Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div className="admin-tabs">
          <button className={`admin-tab ${status === '' ? 'active' : ''}`} onClick={() => handleTabChange('')}>
            All Hotels
          </button>
          <button className={`admin-tab ${status === 'pending' ? 'active' : ''}`} onClick={() => handleTabChange('pending')}>
            Pending <span className="admin-tab-count">{statusCounts.pending}</span>
          </button>
          <button className={`admin-tab ${status === 'approved' ? 'active' : ''}`} onClick={() => handleTabChange('approved')}>
            Approved <span className="admin-tab-count">{statusCounts.approved}</span>
          </button>
          <button className={`admin-tab ${status === 'rejected' ? 'active' : ''}`} onClick={() => handleTabChange('rejected')}>
            Rejected <span className="admin-tab-count">{statusCounts.rejected}</span>
          </button>
        </div>

        {/* Action Selects */}
        <div className="admin-filter-bar" style={{ margin: 0 }}>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search hotels, cities..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />

          <select className="admin-select" value={category} onChange={handleFilterChange(setCategory)}>
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c.toUpperCase()}</option>
            ))}
          </select>

          <select className="admin-select" value={city} onChange={handleFilterChange(setCity)}>
            <option value="">All Cities</option>
            {cities.map((ct) => (
              <option key={ct} value={ct}>{ct}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="admin-card" style={{ padding: '40px', textAlign: 'center' }}>
          <div className="admin-skeleton" style={{ height: '300px' }} />
        </div>
      ) : hotels.length === 0 ? (
        <div className="admin-card">
          <div className="admin-empty">
            <div className="admin-empty-icon">🏨</div>
            <div className="admin-empty-title">No Hotels Found</div>
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
                  <th>Hotel</th>
                  <th>Location</th>
                  <th className="admin-col-hide-mobile">Category</th>
                  <th className="admin-col-hide-mobile">Rating</th>
                  <th className="admin-col-hide-mobile">Owner</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hotels.map((hotel) => (
                  <tr key={hotel._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={hotel.images?.[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=80&h=80&q=80'}
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=80&h=80&q=80'; }}
                          alt={hotel.name}
                          className="admin-thumb"
                        />
                        <div>
                          <div style={{ fontWeight: 600 }}>{hotel.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--admin-text-secondary)', marginTop: '2px' }}>
                            Price range: ₹{hotel.priceRange?.min || 0} - ₹{hotel.priceRange?.max || 0}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                        <FiMapPin size={12} color="var(--admin-text-muted)" />
                        <span>{hotel.address?.city}, {hotel.address?.state}</span>
                      </div>
                    </td>
                    <td className="admin-col-hide-mobile" style={{ textTransform: 'capitalize' }}>
                      {hotel.category}
                    </td>
                    <td className="admin-col-hide-mobile">
                      <div className="admin-stars">{renderStars(hotel.starRating)}</div>
                      <span style={{ fontSize: '11px', color: 'var(--admin-text-secondary)' }}>
                        ({hotel.numReviews} reviews)
                      </span>
                    </td>
                    <td className="admin-col-hide-mobile">
                      {hotel.owner ? (
                        <div>
                          <div style={{ fontWeight: 500 }}>{hotel.owner.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>{hotel.owner.email}</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--admin-text-muted)' }}>N/A</span>
                      )}
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge-${hotel.status}`}>
                        {hotel.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <a
                          href={`/hotel/${hotel._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-btn admin-btn-outline admin-btn-sm"
                          title="View live page"
                        >
                          <FiEye size={14} />
                        </a>
                        {hotel.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(hotel._id)}
                              className="admin-btn admin-btn-success admin-btn-sm"
                              title="Approve"
                            >
                              <FiCheck size={14} />
                            </button>
                            <button
                              onClick={() => handleReject(hotel._id)}
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              title="Reject"
                            >
                              <FiX size={14} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setDeleteConfirmId(hotel._id)}
                          className="admin-btn admin-btn-outline admin-btn-danger admin-btn-sm"
                          title="Delete Property"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h2 className="admin-modal-title">Delete Property?</h2>
            <p style={{ fontSize: '14px', color: 'var(--admin-text-secondary)', margin: '0 0 20px 0' }}>
              Are you sure you want to delete this hotel? This action is permanent. All rooms will be deleted and active bookings will be cancelled.
            </p>
            <div className="admin-modal-actions">
              <button className="admin-btn admin-btn-outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </button>
              <button className="admin-btn admin-btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHotels;
