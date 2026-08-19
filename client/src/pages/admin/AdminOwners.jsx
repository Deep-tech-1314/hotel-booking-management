import React, { useEffect, useState, useCallback } from 'react';
import { FiSearch, FiShield, FiCheckCircle, FiAlertTriangle, FiHome, FiDollarSign, FiUser, FiMoreVertical, FiX, FiCheck, FiSlash, FiTrash2 } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const AdminOwners = () => {
  const [owners, setOwners] = useState([]);
  const [stats, setStats] = useState({
    totalOwners: 0,
    verifiedOwners: 0,
    pendingOwners: 0,
    activeOwners: 0,
    suspendedOwners: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchOwners = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search: search || undefined,
        status: statusFilter || undefined,
        verificationStatus: verificationFilter || undefined,
      };
      const { data } = await api.get('/admin/owners', { params });
      if (data.success && data.data) {
        setOwners(data.data.owners || []);
        setStats(data.data.stats || {});
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch owners list');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, verificationFilter]);

  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  const handleToggleStatus = async (owner) => {
    const isSuspended = owner.status === 'suspended';
    const newStatus = isSuspended ? 'active' : 'suspended';
    const actionLabel = isSuspended ? 'activate' : 'suspend';
    
    if (!window.confirm(`Are you sure you want to ${actionLabel} ${owner.name}?`)) return;

    try {
      const { data } = await api.put(`/admin/users/${owner.id}/status`, {
        status: newStatus,
        reason: isSuspended ? '' : 'Administrative action',
      });
      if (data.success) {
        toast.success(`Owner ${owner.name} is now ${newStatus}`);
        fetchOwners();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update owner status');
    }
  };

  const handleDeleteOwner = async (owner) => {
    if (!window.confirm(`Are you sure you want to permanently delete owner "${owner.name}"? This will delete all their account data.`)) return;

    try {
      const { data } = await api.delete(`/admin/users/${owner.id}`);
      if (data.success) {
        toast.success(`Owner account deleted successfully`);
        setShowDetailModal(false);
        fetchOwners();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete owner account');
    }
  };

  const handleVerifyOwner = async (owner, newVerification) => {
    try {
      const { data } = await api.put(`/admin/users/${owner.id}`, {
        verificationStatus: newVerification,
        ownerProfile: { verificationStatus: newVerification }
      });
      if (data.success) {
        toast.success(`Owner ${owner.name} verification set to ${newVerification}`);
        setOwners(prev => prev.map(o => o.id === owner.id ? { ...o, verificationStatus: newVerification } : o));
        fetchOwners();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update verification status');
    }
  };


  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div className="admin-flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="admin-page-heading" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiShield style={{ color: 'var(--admin-primary)' }} /> Property Owners Management
          </h1>
          <p style={{ color: 'var(--admin-text-secondary)', margin: 0, fontSize: '14px' }}>
            Comprehensive directory of registered hotel owners, verification badges, property metrics, and financial performance.
          </p>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="admin-grid-4" style={{ marginBottom: '24px' }}>
        <div className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Owners</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>{stats.totalOwners || 0}</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiUser size={20} />
          </div>
        </div>

        <div className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verified Owners</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>{stats.verifiedOwners || 0}</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiCheckCircle size={20} />
          </div>
        </div>

        <div className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Verification</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>{stats.pendingOwners || 0}</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiAlertTriangle size={20} />
          </div>
        </div>

        <div className="admin-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active vs Suspended</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
              {stats.activeOwners || 0} <span style={{ fontSize: '14px', color: '#ef4444', fontWeight: 400 }}>/ {stats.suspendedOwners || 0}</span>
            </div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiHome size={20} />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="admin-card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-secondary)' }} />
            <input
              type="text"
              placeholder="Search owners by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-form-input"
              style={{ paddingLeft: '36px', height: '40px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="admin-form-input"
              style={{ height: '40px', minWidth: '160px' }}
            >
              <option value="">All Verifications</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-form-input"
              style={{ height: '40px', minWidth: '140px' }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

        </div>
      </div>

      {/* Owners Data Table */}
      <div className="admin-card admin-table-wrap" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="admin-skeleton" style={{ height: '240px' }} />
          </div>
        ) : owners.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--admin-text-secondary)' }}>
            No owner accounts found matching your filters.
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Owner Details</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Verification</th>
                <th>Hotels</th>
                <th>Bookings & Revenue</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {owners.map((owner) => (
                <tr key={owner.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '50%',
                        backgroundColor: 'var(--admin-primary)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '14px'
                      }}>
                        {owner.name?.charAt(0)?.toUpperCase() || 'O'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>{owner.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>{owner.email}</div>
                      </div>
                    </div>
                  </td>

                  <td style={{ fontSize: '13px' }}>{owner.phone}</td>

                  <td>
                    <span className={`admin-badge ${owner.status === 'active' ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                      {owner.status}
                    </span>
                  </td>

                  <td>
                    <span className={`admin-badge ${
                      owner.verificationStatus === 'verified' ? 'admin-badge-success' : owner.verificationStatus === 'pending' ? 'admin-badge-warning' : 'admin-badge-danger'
                    }`}>
                      {owner.verificationStatus}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <FiHome size={14} color="var(--admin-primary)" />
                      {owner.totalHotels} {owner.totalHotels === 1 ? 'Hotel' : 'Hotels'}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                      ${owner.totalRevenue.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-secondary)' }}>
                      {owner.totalBookings} total bookings
                    </div>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      {owner.verificationStatus !== 'verified' ? (
                        <button
                          onClick={() => handleVerifyOwner(owner, 'verified')}
                          className="admin-btn admin-btn-sm"
                          style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                          title="Verify Owner"
                        >
                          <FiCheck size={14} /> Verify
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerifyOwner(owner, 'pending')}
                          className="admin-btn admin-btn-sm"
                          style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}
                          title="Revoke Verification"
                        >
                          <FiX size={14} /> Unverify
                        </button>
                      )}

                      <button
                        onClick={() => handleToggleStatus(owner)}
                        className={`admin-btn admin-btn-sm ${owner.status === 'suspended' ? 'admin-btn-outline' : ''}`}
                        style={{ color: owner.status === 'suspended' ? '#10b981' : '#ef4444', borderColor: owner.status === 'suspended' ? '#10b981' : 'rgba(239, 68, 68, 0.3)' }}
                        title={owner.status === 'suspended' ? 'Activate Account' : 'Suspend Account'}
                      >
                        <FiSlash size={14} /> {owner.status === 'suspended' ? 'Activate' : 'Suspend'}
                      </button>

                      <button
                        onClick={() => { setSelectedOwner(owner); setShowDetailModal(true); }}
                        className="admin-btn admin-btn-sm admin-btn-outline"
                        title="View Properties & Portfolio"
                      >
                        Details
                      </button>

                      <button
                        onClick={() => handleDeleteOwner(owner)}
                        className="admin-btn admin-btn-danger admin-btn-sm"
                        title="Permanently Delete Owner Account"
                      >
                        <FiTrash2 size={14} /> Delete
                      </button>

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>


      {/* Owner Details Modal */}
      {showDetailModal && selectedOwner && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '560px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Owner Profile &amp; Portfolio</h3>
              <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-secondary)' }}>
                <FiX size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--admin-border)' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'var(--admin-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700 }}>
                {selectedOwner.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>{selectedOwner.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--admin-text-secondary)' }}>{selectedOwner.email} • {selectedOwner.phone}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: 'var(--admin-bg)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>Total Revenue</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--admin-primary)' }}>${selectedOwner.totalRevenue.toLocaleString()}</div>
              </div>
              <div style={{ backgroundColor: 'var(--admin-bg)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>Total Bookings</div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>{selectedOwner.totalBookings}</div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Properties Owned ({selectedOwner.hotelsList?.length || 0})</div>
              {selectedOwner.hotelsList?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedOwner.hotelsList.map((hName, idx) => (
                    <div key={idx} style={{ padding: '8px 12px', backgroundColor: 'var(--admin-bg)', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiHome size={14} color="var(--admin-primary)" /> {hName}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>No properties registered yet.</div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
              <button
                className="admin-btn admin-btn-sm"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                onClick={() => handleDeleteOwner(selectedOwner)}
              >
                <FiTrash2 size={14} /> Delete Owner Account
              </button>
              <button className="admin-btn admin-btn-outline" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>

      )}
    </div>
  );
};

export default AdminOwners;
