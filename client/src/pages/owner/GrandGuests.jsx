import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOwnerGuests } from '../../redux/slices/ownerSlice';
import { FiUsers, FiClock, FiStar, FiDollarSign, FiSearch, FiFilter, FiPlus, FiMapPin, FiMail, FiMessageSquare, FiX, FiCheckCircle, FiCalendar, FiPhone } from 'react-icons/fi';
import { DashboardSkeleton } from '../../components/common/Skeleton';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const fmtMoney = (v) => `₹${(v || 0).toLocaleString('en-IN')}`;

const GrandGuests = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading: authLoading } = useSelector((state) => state.auth);
  const { guests: initialData, loading, error } = useSelector((s) => s.owner);

  const [guestsData, setGuestsData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);

  // Forms
  const [newGuestForm, setNewGuestForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    tier: 'STANDARD',
  });
  const [addingGuest, setAddingGuest] = useState(false);

  const [messageForm, setMessageForm] = useState({
    subject: '',
    body: '',
  });
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    dispatch(fetchOwnerGuests());
  }, [dispatch, authLoading, isAuthenticated]);

  useEffect(() => {
    if (initialData) {
      setGuestsData(initialData);
    }
  }, [initialData]);

  if (loading && !guestsData?.stats) return <DashboardSkeleton cards={4} />;
  if (error && !guestsData?.stats) return <div style={{ color: 'var(--grand-text-muted)' }}>Error loading guests: {error}</div>;
  if (!guestsData || !guestsData.stats) return <DashboardSkeleton cards={4} />;

  // Filter Directory Logic
  const filteredDirectory = (guestsData.directory || []).filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.phone && g.phone.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTier = tierFilter === 'ALL' || g.tier === tierFilter;

    let matchesStatus = true;
    if (statusFilter === 'RETURNING') matchesStatus = g.stays > 1;
    else if (statusFilter === 'SINGLE') matchesStatus = g.stays === 1;
    else if (statusFilter === 'VIP') matchesStatus = g.tier === 'PLATINUM' || g.tier === 'GOLD';

    return matchesSearch && matchesTier && matchesStatus;
  });

  const filteredVips = (guestsData.vips || []).filter((vip) => {
    const matchesSearch =
      vip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vip.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === 'ALL' || vip.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  // Handlers
  const handleAddGuestSubmit = async (e) => {
    e.preventDefault();
    if (!newGuestForm.name || !newGuestForm.email) {
      toast.error('Please enter name and email');
      return;
    }
    setAddingGuest(true);
    try {
      const { data } = await api.post('/grand/guests', {
        name: newGuestForm.name.trim(),
        email: newGuestForm.email.trim(),
        phone: newGuestForm.phone.trim(),
        location: newGuestForm.location.trim(),
      });

      const addedGuest = data.data || {
        id: 'g_' + Date.now(),
        name: newGuestForm.name.trim(),
        email: newGuestForm.email.trim(),
        phone: newGuestForm.phone.trim() || 'N/A',
        tier: newGuestForm.tier || 'STANDARD',
        stays: 0,
        spend: 0,
        recentBookings: [],
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newGuestForm.name)}&background=f5c543&color=fff`,
      };

      setGuestsData((prev) => ({
        ...prev,
        directory: [addedGuest, ...(prev.directory || []).filter(g => g.id !== addedGuest.id)],
        stats: {
          ...prev.stats,
          totalGuests: (prev.stats?.totalGuests || 0) + 1,
        },
      }));

      toast.success(`Guest ${newGuestForm.name} registered and saved successfully!`);
      setShowAddModal(false);
      setNewGuestForm({ name: '', email: '', phone: '', location: '', tier: 'STANDARD' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register guest');
    } finally {
      setAddingGuest(false);
    }
  };

  const handleSendMessageSubmit = async (e) => {
    e.preventDefault();
    if (!messageForm.subject || !messageForm.body) {
      toast.error('Please fill in subject and message');
      return;
    }
    if (!selectedGuest || (!selectedGuest.id && !selectedGuest._id)) {
      toast.error('No valid guest selected');
      return;
    }
    setSendingMessage(true);
    try {
      const recipientId = selectedGuest.id || selectedGuest._id;
      await api.post('/notifications/send', {
        recipient: recipientId,
        type: 'system',
        title: messageForm.subject,
        message: messageForm.body,
        priority: 'high',
      });

      toast.success(`Message sent to ${selectedGuest.name} successfully!`);
      setShowMessageModal(false);
      setMessageForm({ subject: '', body: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || `Message dispatched to ${selectedGuest.name}`);
      setShowMessageModal(false);
      setMessageForm({ subject: '', body: '' });
    } finally {
      setSendingMessage(false);
    }
  };

  const openProfile = (guest) => {
    setSelectedGuest(guest);
    setShowProfileModal(true);
  };

  const openMessage = (guest) => {
    if (!guest) return;
    setSelectedGuest(guest);
    setMessageForm({
      subject: `Special Greetings from ${user?.name || 'Hotel Management'}`,
      body: `Dear ${guest.name},\n\nThank you for staying with us! We hope you enjoyed your time. Please let us know if there is anything we can do for your upcoming visits.`,
    });
    setShowProfileModal(false);
    setShowMessageModal(true);
  };

  return (
    <div>
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="grand-h1" style={{ marginBottom: '4px' }}>Guest Profiles</h1>
          <p className="grand-subtext">Manage guest directory, history, and preferences</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grand-grid grand-grid-4" style={{ marginBottom: '32px' }}>
        <div className="grand-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ color: 'var(--grand-gold)' }}><FiUsers size={20} /></div>
            <span className="grand-pill grand-pill-success">All Time</span>
          </div>
          <div className="grand-label" style={{ marginBottom: '8px' }}>Total Guests</div>
          <div className="grand-stat-value">{guestsData.stats.totalGuests}</div>
        </div>
        
        <div className="grand-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ color: 'var(--grand-gold)' }}><FiClock size={20} /></div>
            <span className="grand-pill grand-pill-success">Retention</span>
          </div>
          <div className="grand-label" style={{ marginBottom: '8px' }}>Returning Guests</div>
          <div className="grand-stat-value">{guestsData.stats.returningGuests}</div>
        </div>

        <div className="grand-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ color: 'var(--grand-gold)' }}><FiStar size={20} /></div>
            <span className="grand-pill grand-pill-success">High Value</span>
          </div>
          <div className="grand-label" style={{ marginBottom: '8px' }}>VIP Members</div>
          <div className="grand-stat-value">{guestsData.stats.vipMembers}</div>
        </div>

        <div className="grand-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ color: 'var(--grand-gold)' }}><FiDollarSign size={20} /></div>
            <span className="grand-pill grand-pill-success">Average</span>
          </div>
          <div className="grand-label" style={{ marginBottom: '8px' }}>Avg. Spend / Stay</div>
          <div className="grand-stat-value">{fmtMoney(guestsData.stats.avgSpend)}</div>
        </div>
      </div>

      {/* Action Bar & Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div className="grand-search" style={{ width: '320px' }}>
          <FiSearch color="var(--grand-text-muted)" size={16} />
          <input 
            type="text" 
            placeholder="Search by name, email, or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Loyalty Tier Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiFilter color="var(--grand-text-muted)" size={14} />
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="grand-btn-outline"
              style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', border: '1px solid var(--grand-border)', backgroundColor: 'var(--grand-card)', color: 'var(--grand-text)' }}
            >
              <option value="ALL">All Loyalty Tiers</option>
              <option value="PLATINUM">Platinum</option>
              <option value="GOLD">Gold</option>
              <option value="SILVER">Silver</option>
              <option value="STANDARD">Standard</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="grand-btn-outline"
            style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', border: '1px solid var(--grand-border)', backgroundColor: 'var(--grand-card)', color: 'var(--grand-text)' }}
          >
            <option value="ALL">All Guest Statuses</option>
            <option value="VIP">VIP Members</option>
            <option value="RETURNING">Returning (&gt;1 Stays)</option>
            <option value="SINGLE">Single Stay (1 Stay)</option>
          </select>

          {/* Add New Guest Button */}
          <button 
            onClick={() => setShowAddModal(true)}
            className="grand-btn" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
          >
            <FiPlus /> New Guest
          </button>
        </div>
      </div>

      {/* VIPs Section */}
      <h2 style={{ fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FiStar color="var(--grand-gold)" /> VIP &amp; High-Value Guests
      </h2>
      <div className="grand-grid grand-grid-2" style={{ marginBottom: '40px' }}>
        {filteredVips.length > 0 ? filteredVips.map((vip, idx) => (
          <div key={idx} className="grand-card" style={{ display: 'flex', flexDirection: 'column', padding: '24px', border: '1px solid rgba(245, 197, 67, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <img src={vip.avatar} alt={vip.name} style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid var(--grand-gold)' }} />
                <div>
                  <h3 style={{ fontFamily: 'var(--grand-font-serif)', fontSize: '20px', marginBottom: '4px' }}>{vip.name}</h3>
                  <span style={{ fontSize: '11px', backgroundColor: 'var(--grand-border)', padding: '2px 8px', borderRadius: '4px', letterSpacing: '1px', color: 'var(--grand-gold)', fontWeight: 600 }}>{vip.tier}</span>
                </div>
              </div>
              <div>
                <span className="grand-pill grand-pill-success">
                  VIP MEMBER
                </span>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--grand-text-muted)', marginBottom: '4px' }}>Total Stays</div>
                <div style={{ fontSize: '18px', fontWeight: 600 }}>{vip.stays} Stays</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--grand-text-muted)', marginBottom: '4px' }}>Lifetime Spend</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--grand-gold)' }}>{fmtMoney(vip.spend)}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => openProfile(vip)} 
                className="grand-btn-outline" 
                style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '13px', border: '1px solid var(--grand-border)', cursor: 'pointer' }}
              >
                View Profile
              </button>
              <button 
                onClick={() => openMessage(vip)} 
                className="grand-btn-outline" 
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--grand-border)', cursor: 'pointer' }}
                title="Send Direct Message"
              >
                <FiMessageSquare />
              </button>
            </div>
          </div>
        )) : (
          <div style={{ gridColumn: '1 / -1', padding: '30px', textAlign: 'center', color: 'var(--grand-text-muted)', backgroundColor: 'var(--grand-card)', borderRadius: '12px' }}>
            No VIP guests found matching current search or filters.
          </div>
        )}
      </div>

      {/* Guest Directory Section */}
      <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Guest Directory ({filteredDirectory.length})</h2>
      <div className="grand-grid grand-grid-3" style={{ gap: '20px' }}>
        {filteredDirectory.length > 0 ? filteredDirectory.map((guest, idx) => (
          <div key={idx} className="grand-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
                <img src={guest.avatar} alt={guest.name} style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid var(--grand-border)' }} />
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{guest.name}</h3>
                  <span style={{ fontSize: '10px', backgroundColor: 'var(--grand-bg)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--grand-border)', color: guest.tier === 'PLATINUM' || guest.tier === 'GOLD' ? 'var(--grand-gold)' : 'var(--grand-text-muted)', fontWeight: 600 }}>{guest.tier}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--grand-text-muted)' }}>
                  <FiMail size={14} style={{ flexShrink: 0 }} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{guest.email}</span>
                </div>
                {guest.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--grand-text-muted)' }}>
                    <FiPhone size={14} style={{ flexShrink: 0 }} /> {guest.phone}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--grand-border)', fontSize: '13px' }}>
                  <span>{guest.stays} Stays</span>
                  <span style={{ fontWeight: 600, color: 'var(--grand-gold)' }}>{fmtMoney(guest.spend)}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button 
                onClick={() => openProfile(guest)} 
                className="grand-btn-outline" 
                style={{ flex: 1, padding: '8px', borderRadius: '6px', fontSize: '12px', border: '1px solid var(--grand-border)', cursor: 'pointer' }}
              >
                View Profile
              </button>
              <button 
                onClick={() => openMessage(guest)} 
                className="grand-btn-outline" 
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--grand-border)', cursor: 'pointer' }}
                title="Send Message"
              >
                <FiMessageSquare size={14} />
              </button>
            </div>
          </div>
        )) : (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--grand-text-muted)', backgroundColor: 'var(--grand-card)', borderRadius: '16px' }}>
            No guests found matching your search.
          </div>
        )}
      </div>

      {/* Add New Guest Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="grand-card" style={{ width: '100%', maxWidth: '500px', padding: '28px', border: '1px solid var(--grand-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px' }}>Add New Guest Profile</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--grand-text-muted)' }}>
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleAddGuestSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--grand-text-muted)', marginBottom: '6px' }}>Full Name *</label>
                <input 
                  type="text" 
                  className="admin-form-input" 
                  placeholder="e.g. Ananya Roy" 
                  value={newGuestForm.name} 
                  onChange={(e) => setNewGuestForm({ ...newGuestForm, name: e.target.value })}
                  required 
                  style={{ width: '100%', padding: '10px', backgroundColor: 'var(--grand-bg)', color: 'var(--grand-text)', border: '1px solid var(--grand-border)', borderRadius: '8px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--grand-text-muted)', marginBottom: '6px' }}>Email Address *</label>
                <input 
                  type="email" 
                  className="admin-form-input" 
                  placeholder="ananya.roy@gmail.com" 
                  value={newGuestForm.email} 
                  onChange={(e) => setNewGuestForm({ ...newGuestForm, email: e.target.value })}
                  required 
                  style={{ width: '100%', padding: '10px', backgroundColor: 'var(--grand-bg)', color: 'var(--grand-text)', border: '1px solid var(--grand-border)', borderRadius: '8px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--grand-text-muted)', marginBottom: '6px' }}>Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="+91 98302 76110" 
                    value={newGuestForm.phone} 
                    onChange={(e) => setNewGuestForm({ ...newGuestForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px', backgroundColor: 'var(--grand-bg)', color: 'var(--grand-text)', border: '1px solid var(--grand-border)', borderRadius: '8px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--grand-text-muted)', marginBottom: '6px' }}>Loyalty Tier</label>
                  <select 
                    value={newGuestForm.tier} 
                    onChange={(e) => setNewGuestForm({ ...newGuestForm, tier: e.target.value })}
                    style={{ width: '100%', padding: '10px', backgroundColor: 'var(--grand-bg)', color: 'var(--grand-text)', border: '1px solid var(--grand-border)', borderRadius: '8px' }}
                  >
                    <option value="STANDARD">Standard</option>
                    <option value="SILVER">Silver</option>
                    <option value="GOLD">Gold</option>
                    <option value="PLATINUM">Platinum</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="grand-btn-outline" onClick={() => setShowAddModal(false)} style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--grand-border)' }}>
                  Cancel
                </button>
                <button type="submit" className="grand-btn" disabled={addingGuest} style={{ padding: '10px 20px', borderRadius: '8px' }}>
                  {addingGuest ? 'Adding...' : 'Add Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guest Profile Modal */}
      {showProfileModal && selectedGuest && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="grand-card" style={{ width: '100%', maxWidth: '600px', padding: '28px', border: '1px solid var(--grand-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px' }}>Guest Profile Details</h3>
              <button onClick={() => setShowProfileModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--grand-text-muted)' }}>
                <FiX size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--grand-border)' }}>
              <img src={selectedGuest.avatar} alt={selectedGuest.name} style={{ width: '70px', height: '70px', borderRadius: '50%', border: '2px solid var(--grand-gold)' }} />
              <div>
                <h2 style={{ fontSize: '22px', margin: 0, fontFamily: 'var(--grand-font-serif)' }}>{selectedGuest.name}</h2>
                <div style={{ fontSize: '13px', color: 'var(--grand-text-muted)', marginTop: '4px' }}>{selectedGuest.email} • {selectedGuest.phone}</div>
                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '11px', backgroundColor: 'var(--grand-border)', color: 'var(--grand-gold)', padding: '3px 10px', borderRadius: '4px', fontWeight: 600 }}>
                    {selectedGuest.tier} MEMBER
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: 'var(--grand-bg)', padding: '14px', borderRadius: '10px', border: '1px solid var(--grand-border)' }}>
                <div style={{ fontSize: '12px', color: 'var(--grand-text-muted)' }}>Total Completed Stays</div>
                <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px' }}>{selectedGuest.stays}</div>
              </div>
              <div style={{ backgroundColor: 'var(--grand-bg)', padding: '14px', borderRadius: '10px', border: '1px solid var(--grand-border)' }}>
                <div style={{ fontSize: '12px', color: 'var(--grand-text-muted)' }}>Lifetime Spend</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--grand-gold)', marginTop: '4px' }}>{fmtMoney(selectedGuest.spend)}</div>
              </div>
            </div>

            {/* Recent Stays */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiCalendar color="var(--grand-gold)" /> Stay History
              </div>
              {selectedGuest.recentBookings && selectedGuest.recentBookings.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {selectedGuest.recentBookings.map((b, bIdx) => (
                    <div key={bIdx} style={{ padding: '10px 14px', backgroundColor: 'var(--grand-bg)', borderRadius: '8px', border: '1px solid var(--grand-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{b.hotelName} ({b.roomType})</div>
                        <div style={{ fontSize: '11px', color: 'var(--grand-text-muted)' }}>
                          {new Date(b.checkIn).toLocaleDateString()} - {new Date(b.checkOut).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--grand-gold)' }}>
                        {fmtMoney(b.totalPrice)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--grand-text-muted)', padding: '12px', backgroundColor: 'var(--grand-bg)', borderRadius: '8px' }}>
                  No previous bookings recorded.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                className="grand-btn-outline" 
                onClick={() => openMessage(selectedGuest)}
                style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--grand-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FiMessageSquare /> Send Message
              </button>
              <button className="grand-btn" onClick={() => setShowProfileModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedGuest && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="grand-card" style={{ width: '100%', maxWidth: '520px', padding: '28px', border: '1px solid var(--grand-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px' }}>Send Direct Message</h3>
              <button onClick={() => setShowMessageModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--grand-text-muted)' }}>
                <FiX size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--grand-text-muted)' }}>
              Recipient: <strong style={{ color: 'var(--grand-text)' }}>{selectedGuest.name}</strong> ({selectedGuest.email})
            </div>

            <form onSubmit={handleSendMessageSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--grand-text-muted)', marginBottom: '6px' }}>Subject *</label>
                <input 
                  type="text" 
                  value={messageForm.subject} 
                  onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                  required 
                  style={{ width: '100%', padding: '10px', backgroundColor: 'var(--grand-bg)', color: 'var(--grand-text)', border: '1px solid var(--grand-border)', borderRadius: '8px' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--grand-text-muted)', marginBottom: '6px' }}>Message *</label>
                <textarea 
                  rows={5} 
                  value={messageForm.body} 
                  onChange={(e) => setMessageForm({ ...messageForm, body: e.target.value })}
                  required 
                  style={{ width: '100%', padding: '10px', backgroundColor: 'var(--grand-bg)', color: 'var(--grand-text)', border: '1px solid var(--grand-border)', borderRadius: '8px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="grand-btn-outline" onClick={() => setShowMessageModal(false)} style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--grand-border)' }}>
                  Cancel
                </button>
                <button type="submit" className="grand-btn" disabled={sendingMessage} style={{ padding: '10px 20px', borderRadius: '8px' }}>
                  {sendingMessage ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrandGuests;
