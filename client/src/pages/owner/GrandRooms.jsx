import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOwnerRooms } from '../../redux/slices/ownerSlice';
import { createBookingEventSource } from '../../utils/api';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiAlertTriangle, FiCheckCircle, FiUser, FiMoreHorizontal, FiWifi, FiTv, FiCoffee, FiWind, FiBox, FiX } from 'react-icons/fi';
import { DashboardSkeleton } from '../../components/common/Skeleton';

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available', color: 'var(--grand-success)', bg: 'rgba(16,185,129,0.15)' },
  { value: 'occupied', label: 'Occupied', color: 'var(--grand-danger)', bg: 'rgba(239,68,68,0.15)' },
  { value: 'cleaning', label: 'Cleaning', color: 'var(--grand-gold)', bg: 'rgba(245,197,67,0.15)' },
  { value: 'maintenance', label: 'Maintenance', color: 'var(--grand-text-muted)', bg: 'rgba(148,163,184,0.15)' },
];

const GrandRooms = () => {
  const dispatch = useDispatch();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Assign Guest Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [assignForm, setAssignForm] = useState({
    guestType: 'walkin',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    numberOfGuests: 1,
    totalPrice: '',
    specialRequests: '',
    userId: '',
  });

  const { user, isAuthenticated, loading: authLoading } = useSelector((state) => state.auth);
  const { rooms: roomsData, loading, error } = useSelector((s) => s.owner);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return undefined;

    dispatch(fetchOwnerRooms());

    let es;
    if (user?.role === 'owner' || user?.role === 'admin') {
      es = createBookingEventSource();
      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'connected') return;
          if (['new_booking', 'check_in', 'cancellation'].includes(payload.type)) {
            dispatch(fetchOwnerRooms());
          }
        } catch (e) { /* ignore malformed event */ }
      };
      es.onerror = () => es?.close();
    }
    return () => { if (es) es.close(); };
  }, [dispatch, authLoading, isAuthenticated, user]);

  useEffect(() => {
    if (roomsData?.rooms?.length > 0 && !selectedRoom) {
      setSelectedRoom(roomsData.rooms[0]);
    }
  }, [roomsData, selectedRoom]);

  const handleRoomStatusUpdate = async (newStatus) => {
    if (!selectedRoom) return;
    setUpdatingStatus(true);
    setShowStatusMenu(false);
    try {
      await api.patch(`/grand/rooms/${selectedRoom.id}/status`, { status: newStatus.toLowerCase() });
      toast.success(`Room ${selectedRoom.num} status → ${newStatus}`);
      dispatch(fetchOwnerRooms());
      setSelectedRoom((prev) => prev ? { ...prev, status: newStatus.toUpperCase() } : null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update room status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openAssignModal = async () => {
    if (!selectedRoom) return;
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    setAssignForm({
      guestType: 'walkin',
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      checkIn: today,
      checkOut: tomorrow,
      numberOfGuests: 1,
      totalPrice: selectedRoom.price ? selectedRoom.price : '',
      specialRequests: '',
      userId: '',
    });
    setShowAssignModal(true);

    try {
      const res = await api.get('/admin/users?limit=50');
      if (res.data?.data?.users) {
        setRegisteredUsers(res.data.data.users);
      }
    } catch (err) {
      // Ignore if user listing unavailable
    }
  };

  const handleUserSelect = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      setAssignForm((prev) => ({ ...prev, userId: '', guestName: '', guestEmail: '', guestPhone: '' }));
      return;
    }
    const foundUser = registeredUsers.find((u) => u.id === selectedId || u._id === selectedId);
    if (foundUser) {
      setAssignForm((prev) => ({
        ...prev,
        userId: foundUser.id || foundUser._id,
        guestName: foundUser.name || '',
        guestEmail: foundUser.email || '',
        guestPhone: foundUser.phone || '',
      }));
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoom) return;
    if (!assignForm.guestName || !assignForm.guestEmail) {
      toast.error('Guest name and email are required');
      return;
    }
    setAssigning(true);
    try {
      const res = await api.post(`/grand/rooms/${selectedRoom.id}/assign-guest`, assignForm);
      if (res.data?.success) {
        toast.success(`Guest ${assignForm.guestName} assigned to room ${selectedRoom.num}!`);
        setShowAssignModal(false);
        dispatch(fetchOwnerRooms());
        setSelectedRoom((prev) => prev ? {
          ...prev,
          status: 'OCCUPIED',
          guest: assignForm.guestName,
          timeInfo: `Out ${new Date(assignForm.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        } : null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign guest to room');
    } finally {
      setAssigning(false);
    }
  };

  if (loading && !roomsData?.stats) return <DashboardSkeleton cards={4} />;
  if (error && !roomsData?.stats) return <div style={{ color: 'var(--grand-text-muted)' }}>Error loading rooms: {error}</div>;
  if (!roomsData || !roomsData.stats) return <DashboardSkeleton cards={4} />;

  const { stats, rooms } = roomsData;

  const getRoomCardStyle = (status) => {
    switch (status) {
      case 'OCCUPIED': return { border: '1px solid rgba(239, 68, 68, 0.3)', background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.05) 0%, transparent 100%)' };
      case 'AVAILABLE': return { border: '1px solid rgba(16, 185, 129, 0.3)', background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%)' };
      case 'CLEANING': return { border: '1px solid rgba(245, 197, 67, 0.3)', background: 'linear-gradient(180deg, rgba(245, 197, 67, 0.05) 0%, transparent 100%)' };
      case 'MAINTENANCE': return { border: '1px solid rgba(148, 163, 184, 0.3)', background: 'linear-gradient(180deg, rgba(148, 163, 184, 0.05) 0%, transparent 100%)' };
      default: return {};
    }
  };

  const getRoomColor = (status) => {
    switch (status) {
      case 'OCCUPIED': return 'var(--grand-danger)';
      case 'AVAILABLE': return 'var(--grand-success)';
      case 'CLEANING': return 'var(--grand-gold)';
      case 'MAINTENANCE': return 'var(--grand-text-muted)';
      default: return 'var(--grand-text)';
    }
  };

  return (
    <div>
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Rooms & Availability</h1>
          <div style={{ color: 'var(--grand-text-muted)', fontSize: '14px' }}>Real-time inventory and status management</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px' }}>
        {/* Main Section */}
        <div>
          {/* Stats Grid */}
          <div className="grand-grid grand-grid-4" style={{ marginBottom: '24px' }}>
            <div className="grand-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
              <div>
                <div style={{ color: 'var(--grand-text-muted)', fontSize: '12px', marginBottom: '8px' }}>Total Rooms</div>
                <div style={{ fontFamily: 'var(--grand-font-serif)', fontSize: '24px' }}>{stats.totalRooms}</div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--grand-gold-transparent)', color: 'var(--grand-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiBox size={20} />
              </div>
            </div>
            
            <div className="grand-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
              <div>
                <div style={{ color: 'var(--grand-text-muted)', fontSize: '12px', marginBottom: '8px' }}>Available</div>
                <div style={{ fontFamily: 'var(--grand-font-serif)', fontSize: '24px', color: 'var(--grand-success)' }}>{stats.available}</div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--grand-success-transparent)', color: 'var(--grand-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiCheckCircle size={20} />
              </div>
            </div>

            <div className="grand-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
              <div>
                <div style={{ color: 'var(--grand-text-muted)', fontSize: '12px', marginBottom: '8px' }}>Occupied</div>
                <div style={{ fontFamily: 'var(--grand-font-serif)', fontSize: '24px', color: 'var(--grand-danger)' }}>{stats.occupied}</div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--grand-danger-transparent)', color: 'var(--grand-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiUser size={20} />
              </div>
            </div>

            <div className="grand-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
              <div>
                <div style={{ color: 'var(--grand-text-muted)', fontSize: '12px', marginBottom: '8px' }}>Needs Attention</div>
                <div style={{ fontFamily: 'var(--grand-font-serif)', fontSize: '24px', color: 'var(--grand-gold)' }}>{stats.needsAttention}</div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--grand-gold-transparent)', color: 'var(--grand-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiAlertTriangle size={20} />
              </div>
            </div>
          </div>

          {/* Floor Tabs */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
            <div style={{ backgroundColor: 'var(--grand-gold)', color: 'var(--grand-bg)', padding: '8px 16px', borderRadius: '24px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
              All Floors <span style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '12px', fontSize: '11px' }}>{stats.totalRooms}</span>
            </div>
          </div>

          {/* Room Grid */}
          <div className="grand-grid grand-grid-4">
            {rooms.map((room, idx) => (
              <div key={room.id || idx} className="grand-card" style={{
                ...getRoomCardStyle(room.status),
                position: 'relative',
                cursor: 'pointer',
                padding: '20px',
                boxShadow: selectedRoom?.id === room.id ? '0 0 0 2px var(--grand-gold)' : 'none',
                transition: 'box-shadow 0.2s',
              }} onClick={() => setSelectedRoom(room)}>
                <div style={{ position: 'absolute', top: '16px', right: '16px', color: getRoomColor(room.status) }}>
                  {room.status === 'OCCUPIED' && <FiUser />}
                  {room.status === 'AVAILABLE' && <FiCheckCircle />}
                  {room.status === 'CLEANING' && '✨'}
                  {room.status === 'MAINTENANCE' && '⚙️'}
                </div>
                
                <h3 style={{ fontFamily: 'var(--grand-font-serif)', fontSize: '28px', color: getRoomColor(room.status), marginBottom: '4px' }}>
                  {room.num}
                </h3>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: getRoomColor(room.status), marginBottom: '16px', textTransform: 'uppercase' }}>
                  {room.type}
                </div>
                
                {room.guest ? (
                  <div style={{ borderTop: '1px solid var(--grand-border)', paddingTop: '12px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--grand-text)' }}>{room.guest}</div>
                    <div style={{ fontSize: '12px', color: 'var(--grand-text-muted)' }}>{room.timeInfo}</div>
                  </div>
                ) : (
                  <div style={{ borderTop: '1px solid var(--grand-border)', paddingTop: '12px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--grand-text-muted)', textTransform: 'capitalize' }}>{room.status.toLowerCase()}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar Inspection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {selectedRoom ? (
            <div className="grand-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ position: 'relative', height: '180px' }}>
                <img src={
                  selectedRoom.type.toUpperCase() === 'SUITE' 
                    ? "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=600" 
                    : selectedRoom.type.toUpperCase() === 'DELUXE'
                    ? "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=600"
                    : "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&q=80&w=600"
                } alt={selectedRoom.num} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.9))' }}></div>
                <div style={{ position: 'absolute', bottom: '16px', left: '16px' }}>
                  <h3 style={{ fontFamily: 'var(--grand-font-serif)', fontSize: '24px', color: 'white', marginBottom: '4px' }}>{selectedRoom.num}</h3>
                  <div style={{ fontSize: '13px', color: '#cbd5e1', textTransform: 'capitalize' }}>{selectedRoom.type.toLowerCase()} Room</div>
                </div>
                <div style={{ position: 'absolute', bottom: '16px', right: '16px' }}>
                  <span className="grand-pill" style={{
                    backgroundColor: selectedRoom.status === 'OCCUPIED' ? 'rgba(239, 68, 68, 0.2)' : selectedRoom.status === 'AVAILABLE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 197, 67, 0.2)',
                    color: selectedRoom.status === 'OCCUPIED' ? '#f87171' : selectedRoom.status === 'AVAILABLE' ? '#34d399' : '#fbbf24',
                    border: `1px solid ${selectedRoom.status === 'OCCUPIED' ? 'rgba(239, 68, 68, 0.4)' : selectedRoom.status === 'AVAILABLE' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 197, 67, 0.4)'}`
                  }}>{selectedRoom.status}</span>
                </div>
              </div>
              
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                  <span style={{ fontSize: '11px', border: '1px solid var(--grand-border)', padding: '4px 8px', borderRadius: '4px', color: 'var(--grand-text-muted)' }}>
                    {selectedRoom.type.toUpperCase() === 'SUITE' ? 'VIP Tier' : 'Standard Tier'}
                  </span>
                  <span style={{ fontSize: '11px', border: '1px solid var(--grand-border)', padding: '4px 8px', borderRadius: '4px', color: 'var(--grand-text-muted)' }}>
                    {selectedRoom.type.toUpperCase() === 'SUITE' ? 'Sea View' : 'Garden View'}
                  </span>
                </div>
 
                {selectedRoom.guest ? (
                  <div className="grand-card" style={{ padding: '16px', backgroundColor: 'var(--grand-bg)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                     <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--grand-card)', border: '1px solid var(--grand-border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: 'var(--grand-text-muted)', fontWeight: 'bold' }}>
                        {selectedRoom.guest.split(' ').map(n => n[0]).join('').toUpperCase()}
                     </div>
                     <div style={{ flex: 1 }}>
                       <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--grand-text)' }}>{selectedRoom.guest}</div>
                       <div style={{ fontSize: '12px', color: 'var(--grand-text-muted)' }}>{selectedRoom.timeInfo}</div>
                     </div>
                     <FiMoreHorizontal color="var(--grand-text-muted)" />
                  </div>
                ) : (
                  <div className="grand-card" style={{ padding: '16px', backgroundColor: 'var(--grand-bg)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center', color: 'var(--grand-text-muted)' }}>
                     <span style={{ fontSize: '13px' }}>
                       {selectedRoom.status === 'CLEANING' ? '🧹 Housekeeping in Progress' : selectedRoom.status === 'MAINTENANCE' ? '🛠️ Under Maintenance' : '✨ Room is Ready for Check-in'}
                     </span>
                  </div>
                )}

                {selectedRoom.status === 'OCCUPIED' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--grand-border)' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--grand-text-muted)', letterSpacing: '1px', marginBottom: '4px' }}>CHECK IN</div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>Active Stay</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--grand-text-muted)', letterSpacing: '1px', marginBottom: '4px' }}>CHECK OUT</div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{selectedRoom.timeInfo.replace('Out ', '')}</div>
                    </div>
                  </div>
                )}
 
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--grand-text-muted)', letterSpacing: '1px', marginBottom: '16px' }}>AMENITIES</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--grand-text-muted)' }}><FiWifi /> High-Speed Wifi</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--grand-text-muted)' }}><FiTv /> Smart TV</div>
                    {selectedRoom.type.toUpperCase() === 'SUITE' ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--grand-text-muted)' }}><FiWind /> Climate Control</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--grand-text-muted)' }}><FiCoffee /> Espresso Machine</div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--grand-text-muted)' }}><FiWind /> AC</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--grand-text-muted)' }}><FiCoffee /> Mini Bar</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Status Update Dropdown */}
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <button
                    className="grand-btn-outline"
                    disabled={updatingStatus}
                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                    style={{ width: '100%', justifyContent: 'space-between', display: 'flex', alignItems: 'center', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', border: '1px solid var(--grand-border)', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <span>{updatingStatus ? 'Updating...' : 'Update Status'}</span>
                    <span style={{ fontSize: '10px' }}>▼</span>
                  </button>
                  {showStatusMenu && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowStatusMenu(false)} />
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', backgroundColor: 'var(--grand-card)', border: '1px solid var(--grand-border)', borderRadius: '8px', overflow: 'hidden', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => handleRoomStatusUpdate(opt.value)}
                            style={{
                              width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '13px',
                              backgroundColor: selectedRoom.status.toLowerCase() === opt.value ? opt.bg : 'transparent',
                              color: selectedRoom.status.toLowerCase() === opt.value ? opt.color : 'var(--grand-text)',
                              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                              fontFamily: 'inherit', transition: 'background-color 0.15s',
                            }}
                          >
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: opt.color, flexShrink: 0 }} />
                            {opt.label}
                            {selectedRoom.status.toLowerCase() === opt.value && <span style={{ marginLeft: 'auto', fontSize: '11px' }}>✓ Current</span>}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {selectedRoom.status === 'OCCUPIED' ? (
                  <button
                    className="grand-btn"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleRoomStatusUpdate('available')}
                    disabled={updatingStatus}
                  >
                    Process Check-out
                  </button>
                ) : selectedRoom.status === 'AVAILABLE' ? (
                  <button
                    className="grand-btn"
                    style={{ width: '100%', justifyContent: 'center', backgroundColor: 'var(--grand-success)', color: 'var(--grand-bg)' }}
                    onClick={openAssignModal}
                  >
                    Assign Guest
                  </button>
                ) : (
                  <button
                    className="grand-btn"
                    style={{ width: '100%', justifyContent: 'center', backgroundColor: 'var(--grand-success)', color: 'var(--grand-bg)' }}
                    onClick={() => handleRoomStatusUpdate('available')}
                    disabled={updatingStatus}
                  >
                    Mark as Available
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grand-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--grand-text-muted)' }}>
              Select a room to inspect
            </div>
          )}
        </div>
      </div>

      {/* Assign Guest Modal */}
      {showAssignModal && selectedRoom && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="grand-card" style={{
            width: '100%', maxWidth: '520px', borderRadius: '16px', overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid var(--grand-border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--grand-border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--grand-success-transparent)', color: 'var(--grand-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiUser size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', margin: 0, fontFamily: 'var(--grand-font-serif)' }}>Assign Guest to {selectedRoom.num}</h3>
                  <div style={{ fontSize: '12px', color: 'var(--grand-text-muted)' }}>{selectedRoom.type} Room • Check-in Registration</div>
                </div>
              </div>
              <button onClick={() => setShowAssignModal(false)} style={{ background: 'none', border: 'none', color: 'var(--grand-text-muted)', cursor: 'pointer' }}>
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Guest mode selector */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', backgroundColor: 'var(--grand-bg)', padding: '4px', borderRadius: '8px' }}>
                <button
                  type="button"
                  onClick={() => setAssignForm((p) => ({ ...p, guestType: 'walkin', userId: '' }))}
                  style={{
                    padding: '8px', borderRadius: '6px', fontSize: '13px', border: 'none', cursor: 'pointer',
                    backgroundColor: assignForm.guestType === 'walkin' ? 'var(--grand-gold)' : 'transparent',
                    color: assignForm.guestType === 'walkin' ? 'var(--grand-bg)' : 'var(--grand-text-muted)',
                    fontWeight: 600, transition: 'all 0.2s'
                  }}
                >
                  Walk-in Guest
                </button>
                <button
                  type="button"
                  onClick={() => setAssignForm((p) => ({ ...p, guestType: 'registered' }))}
                  style={{
                    padding: '8px', borderRadius: '6px', fontSize: '13px', border: 'none', cursor: 'pointer',
                    backgroundColor: assignForm.guestType === 'registered' ? 'var(--grand-gold)' : 'transparent',
                    color: assignForm.guestType === 'registered' ? 'var(--grand-bg)' : 'var(--grand-text-muted)',
                    fontWeight: 600, transition: 'all 0.2s'
                  }}
                >
                  Registered User
                </button>
              </div>

              {assignForm.guestType === 'registered' && registeredUsers.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--grand-text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                    Select Registered User
                  </label>
                  <select
                    value={assignForm.userId}
                    onChange={handleUserSelect}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--grand-border)',
                      backgroundColor: 'var(--grand-bg)', color: 'var(--grand-text)', fontSize: '13px', outline: 'none'
                    }}
                  >
                    <option value="">-- Choose Existing User --</option>
                    {registeredUsers.map((u) => (
                      <option key={u.id || u._id} value={u.id || u._id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--grand-text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                    Guest Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={assignForm.guestName}
                    onChange={(e) => setAssignForm((p) => ({ ...p, guestName: e.target.value }))}
                    placeholder="e.g. John Doe"
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--grand-border)',
                      backgroundColor: 'var(--grand-bg)', color: 'var(--grand-text)', fontSize: '13px', outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--grand-text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                    Guest Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={assignForm.guestEmail}
                    onChange={(e) => setAssignForm((p) => ({ ...p, guestEmail: e.target.value }))}
                    placeholder="e.g. john@example.com"
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--grand-border)',
                      backgroundColor: 'var(--grand-bg)', color: 'var(--grand-text)', fontSize: '13px', outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--grand-text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={assignForm.guestPhone}
                    onChange={(e) => setAssignForm((p) => ({ ...p, guestPhone: e.target.value }))}
                    placeholder="+1 234 567 890"
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--grand-border)',
                      backgroundColor: 'var(--grand-bg)', color: 'var(--grand-text)', fontSize: '13px', outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--grand-text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                    Guests Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={assignForm.numberOfGuests}
                    onChange={(e) => setAssignForm((p) => ({ ...p, numberOfGuests: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--grand-border)',
                      backgroundColor: 'var(--grand-bg)', color: 'var(--grand-text)', fontSize: '13px', outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--grand-text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                    Check-in Date
                  </label>
                  <input
                    type="date"
                    required
                    value={assignForm.checkIn}
                    onChange={(e) => setAssignForm((p) => ({ ...p, checkIn: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--grand-border)',
                      backgroundColor: 'var(--grand-bg)', color: 'var(--grand-text)', fontSize: '13px', outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--grand-text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                    Check-out Date
                  </label>
                  <input
                    type="date"
                    required
                    value={assignForm.checkOut}
                    onChange={(e) => setAssignForm((p) => ({ ...p, checkOut: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--grand-border)',
                      backgroundColor: 'var(--grand-bg)', color: 'var(--grand-text)', fontSize: '13px', outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--grand-text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                  Total Amount ($)
                </label>
                <input
                  type="number"
                  placeholder="Total stay price"
                  value={assignForm.totalPrice}
                  onChange={(e) => setAssignForm((p) => ({ ...p, totalPrice: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--grand-border)',
                    backgroundColor: 'var(--grand-bg)', color: 'var(--grand-text)', fontSize: '13px', outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  style={{
                    padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--grand-border)',
                    backgroundColor: 'transparent', color: 'var(--grand-text)', fontSize: '13px', cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  style={{
                    padding: '10px 24px', borderRadius: '8px', border: 'none',
                    backgroundColor: 'var(--grand-success)', color: 'var(--grand-bg)', fontSize: '13px',
                    fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  {assigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrandRooms;

