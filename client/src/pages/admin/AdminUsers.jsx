import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { FiSearch, FiTrash2, FiEye, FiActivity, FiDollarSign, FiClock, FiX, FiCheckCircle } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(''); // '', 'user', 'owner', 'suspended'
  
  // Drawer & detail state
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [userBookings, setUserBookings] = useState([]);
  const [loadingDrawer, setLoadingDrawer] = useState(false);

  const { user: currentUser } = useSelector((state) => state.auth);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: search || undefined,
        role: (tab === 'user' || tab === 'owner') ? tab : undefined,
        status: tab === 'suspended' ? 'suspended' : undefined,
      };
      const { data } = await api.get('/admin/users', { params });
      if (data.success) {
        setUsers(data.users || []);
        setTotal(data.total || 0);
        setTotalPages(data.pages || 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [page, search, tab]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (userToToggle) => {
    const isSuspended = userToToggle.status === 'suspended';
    const newStatus = isSuspended ? 'active' : 'suspended';
    const msg = isSuspended ? 'activate' : 'suspend';
    
    let reason = '';
    if (!isSuspended) {
      reason = prompt('Please enter a suspension reason:', 'Violated terms of service');
      if (reason === null) return;
    }

    // Optimistic UI update
    setUsers(prev => prev.map(u => u._id === userToToggle._id ? { ...u, status: newStatus } : u));
    if (selectedUser?._id === userToToggle._id) {
      setSelectedUser(prev => ({ ...prev, status: newStatus }));
    }

    try {
      await api.put(`/admin/users/${userToToggle._id}/status`, { status: newStatus, reason });
      toast.success(`User ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${msg} user`);
      // Revert on error
      fetchUsers();
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      toast.success(`Role updated to ${role}`);
      fetchUsers();
      if (selectedUser?._id === userId) {
        setSelectedUser(prev => ({ ...prev, role }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user? All bookings and listings will be deleted.')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully');
      setIsDrawerOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const openUserDrawer = async (userObj) => {
    setSelectedUser(userObj);
    setIsDrawerOpen(true);
    setLoadingDrawer(true);
    setUserBookings([]);
    try {
      // Find all bookings for this user using bookings endpoint
      const { data } = await api.get('/admin/bookings', { params: { limit: 50 } });
      if (data.success) {
        // filter bookings for this user
        const list = data.bookings.filter(b => b.user?._id === userObj._id);
        setUserBookings(list);
      }
    } catch (err) {
      console.error('Failed to load user bookings:', err);
    } finally {
      setLoadingDrawer(false);
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedUser(null);
  };

  return (
    <div>
      <div className="admin-flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="admin-page-heading">User Management</h1>
          <p style={{ color: 'var(--admin-text-secondary)', margin: 0, fontSize: '14px' }}>
            Manage platform guests, hotel owners, roles, and account statuses.
          </p>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--admin-text-secondary)' }}>
          Total Accounts: <strong style={{ color: 'var(--admin-primary)' }}>{total}</strong>
        </div>
      </div>

      {/* Filter Tabs / Pills & Search */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div className="admin-tabs">
          <button className={`admin-tab ${tab === '' ? 'active' : ''}`} onClick={() => { setTab(''); setPage(1); }}>
            All Accounts
          </button>
          <button className={`admin-tab ${tab === 'user' ? 'active' : ''}`} onClick={() => { setTab('user'); setPage(1); }}>
            Guests
          </button>
          <button className={`admin-tab ${tab === 'owner' ? 'active' : ''}`} onClick={() => { setTab('owner'); setPage(1); }}>
            Owners
          </button>
          <button className={`admin-tab ${tab === 'suspended' ? 'active' : ''}`} onClick={() => { setTab('suspended'); setPage(1); }}>
            Suspended
          </button>
        </div>

        <input
          type="text"
          className="admin-search-input"
          placeholder="Search by name, email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Table Data */}
      {loading ? (
        <div className="admin-card" style={{ padding: '40px', textAlign: 'center' }}>
          <div className="admin-skeleton" style={{ height: '300px' }} />
        </div>
      ) : users.length === 0 ? (
        <div className="admin-card">
          <div className="admin-empty">
            <div className="admin-empty-icon">👥</div>
            <div className="admin-empty-title">No Users Found</div>
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
                  <th>User</th>
                  <th>Role</th>
                  <th className="admin-col-hide-mobile">Bookings</th>
                  <th className="admin-col-hide-mobile">Total Spent</th>
                  <th className="admin-col-hide-mobile">Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          className="admin-initials"
                          style={{
                            background: u.status === 'suspended' ? 'rgba(239, 68, 68, 0.1)' : 'var(--admin-primary-light)',
                            color: u.status === 'suspended' ? '#dc2626' : 'var(--admin-primary)',
                          }}
                        >
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--admin-text-secondary)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge-${u.role}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="admin-col-hide-mobile">{u.bookingCount || 0}</td>
                    <td className="admin-col-hide-mobile">₹{(u.totalSpent || 0).toLocaleString('en-IN')}</td>
                    <td className="admin-col-hide-mobile" style={{ fontSize: '13px' }}>
                      {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge-${u.status === 'suspended' ? 'suspended' : 'active'}`}>
                        {u.status || 'active'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => openUserDrawer(u)}
                          className="admin-btn admin-btn-outline admin-btn-sm"
                          title="View user details & history"
                        >
                          <FiEye size={14} />
                        </button>
                        {u._id !== currentUser?._id && u.role !== 'admin' && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`admin-btn admin-btn-sm ${u.status === 'suspended' ? 'admin-btn-success' : 'admin-btn-danger'}`}
                              title={u.status === 'suspended' ? 'Activate Account' : 'Suspend Account'}
                            >
                              {u.status === 'suspended' ? <FiCheckCircle size={14} /> : <FiX size={14} />}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u._id)}
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              title="Permanently Delete Account"
                            >
                              <FiTrash2 size={14} /> Delete
                            </button>

                          </>
                        )}
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

      {/* User Details Slide-over Drawer */}
      {isDrawerOpen && selectedUser && (
        <>
          <div className="admin-drawer-overlay" onClick={closeDrawer} />
          <div className="admin-drawer">
            <div className="admin-drawer-header">
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Account Details</h2>
              <button className="admin-drawer-close" onClick={closeDrawer}>
                <FiX size={20} />
              </button>
            </div>

            {/* Profile summary */}
            <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--admin-border)' }}>
              <div
                className="admin-initials"
                style={{
                  width: '64px',
                  height: '64px',
                  fontSize: '24px',
                  margin: '0 auto 12px auto',
                  background: selectedUser.status === 'suspended' ? 'rgba(239, 68, 68, 0.1)' : 'var(--admin-primary-light)',
                  color: selectedUser.status === 'suspended' ? '#dc2626' : 'var(--admin-primary)',
                }}
              >
                {selectedUser.name?.charAt(0).toUpperCase()}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0' }}>{selectedUser.name}</h3>
              <p style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', margin: '0 0 12px 0' }}>{selectedUser.email}</p>
              
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <span className={`admin-badge admin-badge-${selectedUser.role}`}>{selectedUser.role}</span>
                <span className={`admin-badge admin-badge-${selectedUser.status === 'suspended' ? 'suspended' : 'active'}`}>{selectedUser.status || 'active'}</span>
              </div>
            </div>

            {/* User metadata & change role */}
            <div style={{ padding: '16px 0', borderBottom: '1px solid var(--admin-border)' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 12px 0' }}>Manage Account</h4>
              
              {selectedUser._id !== currentUser?._id && selectedUser.role !== 'admin' ? (
                <>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Change Role</label>
                    <select
                      className="admin-select"
                      style={{ width: '100%' }}
                      value={selectedUser.role}
                      onChange={(e) => handleRoleChange(selectedUser._id, e.target.value)}
                    >
                      <option value="user">Guest (User)</option>
                      <option value="owner">Hotel Owner</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button
                      onClick={() => handleToggleStatus(selectedUser)}
                      className={`admin-btn ${selectedUser.status === 'suspended' ? 'admin-btn-success' : 'admin-btn-danger'}`}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      {selectedUser.status === 'suspended' ? 'Activate Account' : 'Suspend Account'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(selectedUser._id)}
                      className="admin-btn admin-btn-outline"
                      style={{ color: '#dc2626', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--admin-text-muted)', margin: 0 }}>
                  You cannot modify administrative or your own accounts.
                </p>
              )}
            </div>

            {/* Booking History */}
            <div style={{ padding: '16px 0' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 12px 0' }}>Booking History</h4>
              {loadingDrawer ? (
                <div className="admin-skeleton" style={{ height: '80px' }} />
              ) : userBookings.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--admin-text-muted)', margin: 0 }}>No bookings recorded for this user.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {userBookings.map((b) => (
                    <div key={b._id} style={{ padding: '10px', border: '1px solid var(--admin-border)', borderRadius: '8px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span>{b.hotel?.name || 'Hotel'}</span>
                        <span style={{ color: 'var(--admin-primary)' }}>₹{b.totalPrice?.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ color: 'var(--admin-text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                        {new Date(b.checkIn).toLocaleDateString('en-IN')} - {new Date(b.checkOut).toLocaleDateString('en-IN')}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>ID: #{b._id.slice(-6)}</span>
                        <span className={`admin-badge admin-badge-${b.bookingStatus}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                          {b.bookingStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminUsers;
