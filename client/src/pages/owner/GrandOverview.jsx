import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { createBookingEventSource } from '../../utils/api';
import {
  FiPlus, FiCalendar, FiTrendingUp, FiTrendingDown,
  FiKey, FiLogOut, FiCreditCard, FiBox, FiStar,
} from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchOwnerOverview, fetchOwnerBookings } from '../../redux/slices/ownerSlice';
import { DashboardSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

const fmtMoney = (v) => `₹${(v || 0).toLocaleString('en-IN')}`;

const Trend = ({ value }) => {
  if (value === undefined || value === null) return null;
  const up = value >= 0;
  return (
    <span className={`grand-pill ${up ? 'grand-pill-success' : 'grand-pill-danger'}`}>
      {up ? '+' : ''}{value}%
    </span>
  );
};

const statusStyle = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'confirmed': return { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' };
    case 'checked-in': return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
    case 'checked-out': return { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' };
    case 'cancelled': return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' };
    default: return { bg: 'rgba(245, 197, 67, 0.15)', color: '#f5c543' };
  }
};

const ChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--grand-card)', border: '1px solid var(--grand-border)', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
        <p style={{ fontWeight: 700, marginBottom: 4, color: '#fff', fontSize: '13px' }}>{label}</p>
        <p style={{ fontSize: '12px', color: '#f5c543' }}>{fmtMoney(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

const GrandOverview = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useSelector((s) => s.auth);
  const { overview, bookings, loading, error } = useSelector((s) => s.owner);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return undefined;

    dispatch(fetchOwnerOverview());
    dispatch(fetchOwnerBookings({ limit: 5 }));

    let es;
    if (user?.role === 'owner' || user?.role === 'admin') {
      es = createBookingEventSource();
      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'connected') return;
          if (['new_booking', 'check_in', 'cancellation'].includes(payload.type)) {
            dispatch(fetchOwnerOverview());
            dispatch(fetchOwnerBookings({ limit: 5 }));
          }
        } catch (e) { /* ignore malformed event */ }
      };
      es.onerror = () => es?.close();
    }
    return () => { if (es) es.close(); };
  }, [dispatch, authLoading, isAuthenticated, user]);

  const todayLong = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const todayShort = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  if (loading && !overview) return <DashboardSkeleton cards={4} />;
  if (error && !overview) return <ErrorState message={error} onRetry={() => dispatch(fetchOwnerOverview())} />;
  if (!overview) return <DashboardSkeleton cards={4} />;

  const { stats, rooms, weeklyRevenue = [], gallery = [], satisfaction } = overview;
  const recent = bookings?.table || [];

  return (
    <div>
      {/* Hero */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <div style={{ color: 'var(--grand-gold)', fontSize: '12px', letterSpacing: '2px', fontWeight: 700, marginBottom: '8px' }}>WELCOME BACK</div>
          <h1 className="grand-h1" style={{ fontSize: '36px', marginBottom: '8px', lineHeight: 1.1 }}>Hello{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.</h1>
          <p className="grand-subtext">Here&apos;s what&apos;s happening across your properties today — {todayShort}.</p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
            <button className="grand-btn grand-btn-outline" onClick={() => navigate('/grand/bookings')}><FiPlus /> Bookings</button>
            <button className="grand-btn grand-btn-outline" onClick={() => navigate('/grand/hotels')}><FiBox /> Properties</button>
          </div>
        </div>
        <button className="grand-btn grand-btn-outline" style={{ border: '1px solid var(--grand-border)', borderRadius: '24px' }}>
          <FiCalendar /> {todayLong}
        </button>
      </div>

      {/* Stats */}
      <div className="grand-grid grand-grid-4" style={{ marginBottom: '32px' }}>
        <div className="grand-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ color: 'var(--grand-gold)' }}><FiCalendar size={20} /></div>
          </div>
          <div className="grand-label" style={{ marginBottom: '8px' }}>Occupancy Rate</div>
          <div className="grand-stat-value">{stats.occupancyRate}%</div>
        </div>
        <div className="grand-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ color: 'var(--grand-gold)' }}><FiKey size={20} /></div>
          </div>
          <div className="grand-label" style={{ marginBottom: '8px' }}>Check-ins Today</div>
          <div className="grand-stat-value">{stats.checkInsToday}</div>
        </div>
        <div className="grand-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ color: 'var(--grand-gold)' }}><FiLogOut size={20} /></div>
          </div>
          <div className="grand-label" style={{ marginBottom: '8px' }}>Check-outs Today</div>
          <div className="grand-stat-value">{stats.checkOutsToday}</div>
        </div>
        <div className="grand-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ color: 'var(--grand-gold)' }}>{stats.revenueTrend >= 0 ? <FiTrendingUp size={20} /> : <FiTrendingDown size={20} />}</div>
            <Trend value={stats.revenueTrend} />
          </div>
          <div className="grand-label" style={{ marginBottom: '8px' }}>Revenue (This Month)</div>
          <div className="grand-stat-value">{fmtMoney(stats.totalRevenue)}</div>
        </div>
      </div>

      {/* Chart + Room status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div className="grand-chart-wrapper">
          <div className="grand-chart-header">
            <h3 style={{ marginBottom: 0 }}>Last 7 Days Revenue</h3>
          </div>
          {weeklyRevenue.some((d) => d.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyRevenue} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grand-border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="revenue" fill="#f5c543" radius={[4, 4, 0, 0]} barSize={22} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No revenue yet" message="Paid bookings from the last 7 days will appear here." />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="grand-card" style={{ padding: '20px 24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Room Status</h3>
            <div className="grand-room-status-grid">
              <div className="grand-room-status-item">
                <div className="grand-room-dot occupied" />
                <div className="grand-room-status-label">Occupied</div>
                <div className="grand-room-status-count">{rooms?.occupied || 0}</div>
              </div>
              <div className="grand-room-status-item">
                <div className="grand-room-dot available" />
                <div className="grand-room-status-label">Available</div>
                <div className="grand-room-status-count">{rooms?.available || 0}</div>
              </div>
              <div className="grand-room-status-item">
                <div className="grand-room-dot cleaning" />
                <div className="grand-room-status-label">Cleaning</div>
                <div className="grand-room-status-count">{rooms?.cleaning || 0}</div>
              </div>
              <div className="grand-room-status-item">
                <div className="grand-room-dot maintenance" />
                <div className="grand-room-status-label">Service</div>
                <div className="grand-room-status-count">{rooms?.maintenance || 0}</div>
              </div>
            </div>
          </div>

          <div className="grand-satisfaction">
            <div className="grand-satisfaction-score">{satisfaction?.rating || 0}</div>
            <div>
              <div className="grand-satisfaction-stars">
                {[1, 2, 3, 4, 5].map((i) => (
                  <FiStar key={i} size={16} fill={i <= Math.round(satisfaction?.rating || 0) ? '#f5c543' : 'none'} stroke={i <= Math.round(satisfaction?.rating || 0) ? '#f5c543' : '#94a3b8'} />
                ))}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--grand-text)' }}>Guest Satisfaction</div>
              <div className="grand-satisfaction-label">Based on {satisfaction?.reviews || 0} reviews</div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery + Recent Bookings */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '24px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '4px' }}>Property Gallery</h2>
            <Link to="/grand/hotels" style={{ color: 'var(--grand-gold)', fontSize: '14px', fontWeight: 600 }}>↗ Manage</Link>
          </div>
          {gallery.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '32px' }}>
              <div style={{ position: 'relative', height: '260px' }}>
                <img src={gallery[0]} alt="Featured" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
                <div style={{ position: 'absolute', top: '16px', left: '16px', backgroundColor: 'var(--grand-gold)', color: 'var(--grand-bg)', padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', borderRadius: '4px' }}>FEATURED</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {gallery.slice(1, 3).map((url, i) => (
                  <img key={i} src={url} alt="Property" style={{ width: '100%', height: '122px', objectFit: 'cover', borderRadius: '16px' }} />
                ))}
              </div>
            </div>
          ) : (
            <div className="grand-card" style={{ marginBottom: '32px' }}>
              <EmptyState title="No images yet" message="Upload images to your hotels to populate this gallery." />
            </div>
          )}

          <div className="grand-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', margin: 0 }}>Recent Bookings</h3>
              <Link to="/grand/bookings" style={{ color: 'var(--grand-gold)', fontSize: '13px', fontWeight: 600 }}>View All →</Link>
            </div>
            {recent.length > 0 ? (
              <div className="grand-activity-feed">
                {recent.map((b) => {
                  const ss = statusStyle(b.status);
                  return (
                    <div key={b.id} className="grand-activity-item">
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(b.initials || b.guest)}&background=f5c543&color=fff&size=36`} alt={b.guest} className="grand-activity-avatar" />
                      <div className="grand-activity-content">
                        <div className="grand-activity-name">{b.guest}</div>
                        <div className="grand-activity-desc">{b.roomTitle} · {b.dates}</div>
                      </div>
                      <div className="grand-activity-meta" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <div className="grand-activity-amount">{fmtMoney(b.amount)}</div>
                        <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', background: ss.bg, color: ss.color }}>{b.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="No bookings yet" message="New bookings for your properties will show up here." />
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: 0 }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <button onClick={() => navigate('/grand/bookings')} className="grand-card" style={{ padding: '20px 12px', textAlign: 'center', cursor: 'pointer', border: '1px solid transparent', color: 'inherit', font: 'inherit' }}>
              <FiKey size={24} style={{ color: 'var(--grand-text-muted)', marginBottom: '8px' }} />
              <div style={{ fontSize: '13px', color: 'var(--grand-text-muted)' }}>Manage<br />Check-ins</div>
            </button>
            <button onClick={() => navigate('/grand/bookings')} className="grand-card" style={{ padding: '20px 12px', textAlign: 'center', cursor: 'pointer', border: '1px solid transparent', color: 'inherit', font: 'inherit' }}>
              <FiCreditCard size={24} style={{ color: 'var(--grand-text-muted)', marginBottom: '8px' }} />
              <div style={{ fontSize: '13px', color: 'var(--grand-text-muted)' }}>View<br />Payments</div>
            </button>
            <button onClick={() => navigate('/grand/rooms')} className="grand-card" style={{ padding: '20px 12px', textAlign: 'center', cursor: 'pointer', border: '1px solid transparent', color: 'inherit', font: 'inherit' }}>
              <FiBox size={24} style={{ color: 'var(--grand-text-muted)', marginBottom: '8px' }} />
              <div style={{ fontSize: '13px', color: 'var(--grand-text-muted)' }}>Manage<br />Rooms</div>
            </button>
            <button onClick={() => navigate('/grand/reports')} className="grand-card" style={{ padding: '20px 12px', textAlign: 'center', cursor: 'pointer', border: '1px solid transparent', color: 'inherit', font: 'inherit' }}>
              <FiTrendingUp size={24} style={{ color: 'var(--grand-text-muted)', marginBottom: '8px' }} />
              <div style={{ fontSize: '13px', color: 'var(--grand-text-muted)' }}>View<br />Reports</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrandOverview;
