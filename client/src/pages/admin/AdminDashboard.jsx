import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api, { createAdminEventSource } from '../../utils/api';
import {
  FiUsers, FiHome, FiCheckCircle, FiActivity, FiDollarSign,
  FiStar, FiTrendingUp, FiCalendar, FiClock,
  FiBriefcase, FiBox, FiXCircle, FiPercent, FiPieChart,
} from 'react-icons/fi';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import {
  fetchAdminStats, fetchAdminAnalytics, fetchPendingHotels, clearError,
} from '../../redux/slices/adminSlice';
import { DashboardSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';

const fmtMoney = (v) => `₹${(v || 0).toLocaleString('en-IN')}`;
const fmtCompact = (v) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : fmtMoney(v));

const dotColor = (type) => {
  switch (type) {
    case 'booking': return '#10b981';
    case 'checkin': return '#3b82f6';
    case 'cancelled': return '#ef4444';
    case 'approval': return '#3b82f6';
    case 'registration': return '#f59e0b';
    default: return '#71717a';
  }
};

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const ChartTooltip = ({ active, payload, label, money }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--admin-surface)',
        border: '1px solid var(--admin-border)',
        borderRadius: '8px',
        padding: '10px 14px',
        boxShadow: 'var(--admin-shadow-lg)'
      }}>
        <p style={{ fontWeight: 600, marginBottom: 4, color: 'var(--admin-text)', fontSize: '13px' }}>{label}</p>
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--admin-primary)', margin: 0 }}>
          {money ? fmtMoney(payload[0].value) : payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

// Pure SVG Sparkline Component
const Sparkline = ({ data, color = 'var(--admin-primary)' }) => {
  if (!data || data.length < 2) return null;
  const values = data.map((d) => d.value);
  const max = Math.max(...values) || 1;
  const min = Math.min(...values);
  const range = max - min || 1;
  
  const width = 120;
  const height = 40;
  const points = values
    .map((val, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

const KPIBlock = ({ icon: Icon, label, value, colorClass = '', sparklineData, color }) => (
  <div className="admin-kpi">
    <div>
      <div className="admin-kpi-label">{label}</div>
      <div className="admin-kpi-value">{value}</div>
      {sparklineData && (
        <div style={{ marginTop: '8px' }}>
          <Sparkline data={sparklineData} color={color} />
        </div>
      )}
    </div>
    <div className={`admin-kpi-icon ${colorClass}`} style={{ background: 'var(--admin-primary-light)', color: color || 'var(--admin-primary)' }}>
      <Icon size={22} />
    </div>
  </div>
);

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { stats, analytics, pendingHotels, loading, error } = useSelector((s) => s.admin);
  const { isAuthenticated, user, loading: authLoading } = useSelector((s) => s.auth);
  const [recentUsers, setRecentUsers] = useState([]);
  const [chartPeriod, setChartPeriod] = useState('monthly'); // 'monthly' or 'daily'

  const loadAll = useCallback(() => {
    dispatch(fetchAdminStats());
    dispatch(fetchAdminAnalytics());
    dispatch(fetchPendingHotels());
    api.get('/admin/users?limit=5').then(({ data }) => setRecentUsers(data.users || [])).catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || user?.role !== 'admin') return undefined;
    loadAll();

    const es = createAdminEventSource();
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'connected') return;
        dispatch(fetchAdminStats());
        dispatch(fetchAdminAnalytics());
      } catch (e) { /* ignore */ }
    };
    es.onerror = () => es?.close();
    return () => es?.close();
  }, [authLoading, isAuthenticated, user, dispatch, loadAll]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/hotels/${id}/approve`);
      toast.success('Hotel approved successfully');
      dispatch(fetchPendingHotels());
      dispatch(fetchAdminStats());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Please enter a rejection reason:', 'Did not meet platform requirements');
    if (reason === null) return; // user cancelled prompt
    try {
      await api.put(`/admin/hotels/${id}/reject`, { reason });
      toast.success('Hotel rejected');
      dispatch(fetchPendingHotels());
      dispatch(fetchAdminStats());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    }
  };

  if (authLoading || (loading && !stats)) return <div style={{ padding: '8px' }}><DashboardSkeleton cards={4} /></div>;
  if (error && !stats) return <ErrorState message={error} onRetry={loadAll} />;
  if (!stats) return <div style={{ padding: '8px' }}><DashboardSkeleton cards={4} /></div>;

  const activities = analytics?.recentActivities || [];

  return (
    <div>
      {/* Welcome Row */}
      <div className="admin-flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="admin-page-heading">Welcome, {user?.name || 'Administrator'}</h1>
          <p style={{ color: 'var(--admin-text-secondary)', margin: 0, fontSize: '14px' }}>
            Here is what is happening on your platform today.
          </p>
        </div>
        <div className="admin-badge admin-badge-confirmed" style={{ fontSize: '13px', padding: '6px 12px' }}>
          <FiCalendar style={{ marginRight: '6px' }} />
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>

      {/* KPI Grid (Top Level Stats) */}
      <div className="admin-kpi-grid">
        <KPIBlock
          icon={FiDollarSign}
          label="Total Collected"
          value={fmtMoney(stats.revenue.total)}
          sparklineData={stats.sparklines?.revenue}
          color="#10b981"
        />
        <KPIBlock
          icon={FiActivity}
          label="Total Bookings"
          value={stats.bookings.total.toLocaleString()}
          sparklineData={stats.sparklines?.bookings}
          color="var(--admin-primary)"
        />
        <KPIBlock
          icon={FiUsers}
          label="Total Users"
          value={stats.users.total.toLocaleString()}
          sparklineData={stats.sparklines?.users}
          color="#f59e0b"
        />
      </div>

      {/* Secondary KPI Row */}
      <div className="admin-grid-4" style={{ marginBottom: '24px' }}>
        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px' }}>
          <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '8px' }}><FiHome size={20} /></div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>Approved Hotels</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{stats.hotels.approved} / {stats.hotels.total}</div>
          </div>
        </div>
        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px' }}>
          <div style={{ padding: '10px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', borderRadius: '8px' }}><FiBox size={20} /></div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>Total Rooms</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{stats.rooms.total}</div>
          </div>
        </div>
        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px' }}>
          <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '8px' }}><FiPercent size={20} /></div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>Commission Earned</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{fmtCompact(stats.revenue.commission)}</div>
          </div>
        </div>
        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px' }}>
          <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px' }}><FiPieChart size={20} /></div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>Occupancy Rate</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{stats.occupancyRate}%</div>
          </div>
        </div>
      </div>

      {/* Main Trends and Charts */}
      <div className="admin-grid-2" style={{ marginBottom: '24px' }}>
        {/* Revenue Trend */}
        <div className="admin-card">
          <div className="admin-flex-between" style={{ marginBottom: '16px' }}>
            <h3 className="admin-card-title" style={{ margin: 0 }}>Revenue Overview</h3>
            <div className="admin-tabs">
              <button
                className={`admin-tab ${chartPeriod === 'monthly' ? 'active' : ''}`}
                onClick={() => setChartPeriod('monthly')}
              >
                Monthly
              </button>
              <button
                className={`admin-tab ${chartPeriod === 'daily' ? 'active' : ''}`}
                onClick={() => setChartPeriod('daily')}
              >
                Last 30 Days
              </button>
            </div>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <AreaChart
                data={chartPeriod === 'monthly' ? (analytics?.revenueTrend || []) : (analytics?.dailyRevenueTrend || [])}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--admin-primary)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--admin-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--admin-text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--admin-text-secondary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip money />} />
                <Area type="monotone" dataKey="value" stroke="var(--admin-primary)" strokeWidth={2.5} fill="url(#revGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bookings / Growth Trends */}
        <div className="admin-card">
          <div className="admin-flex-between" style={{ marginBottom: '16px' }}>
            <h3 className="admin-card-title" style={{ margin: 0 }}>Booking Volumes</h3>
            <span style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>Volume of created bookings</span>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart
                data={chartPeriod === 'monthly' ? (analytics?.bookingTrend || []) : (analytics?.dailyBookingTrend || [])}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--admin-text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--admin-text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--admin-surface-alt)' }} />
                <Bar dataKey="value" fill="var(--admin-primary)" radius={[4, 4, 0, 0]} barSize={chartPeriod === 'monthly' ? 24 : 8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Third Row: Pending approvals, Recent Users, Recent Activity */}
      <div className="admin-grid-3">
        {/* Pending Approvals */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="admin-card-title" style={{ marginBottom: '16px' }}>Pending Approvals</h3>
          {pendingHotels && pendingHotels.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              {pendingHotels.map((h) => (
                <div key={h._id} style={{ padding: '12px', border: '1px solid var(--admin-border)', borderRadius: '8px', background: 'var(--admin-surface-alt)' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{h.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', textTransform: 'capitalize', marginTop: '2px' }}>
                    {h.category} · {h.address?.city}, {h.address?.state}
                  </div>
                  {h.owner && (
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
                      Owner: {h.owner.name} ({h.owner.email})
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      onClick={() => handleApprove(h._id)}
                      className="admin-btn admin-btn-success admin-btn-sm"
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(h._id)}
                      className="admin-btn admin-btn-danger admin-btn-sm"
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<FiCheckCircle />} title="All caught up" message="No hotels are awaiting approval." />
          )}
        </div>

        {/* Recent Users */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="admin-card-title" style={{ marginBottom: '16px' }}>Recent Users</h3>
          {recentUsers && recentUsers.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
              {recentUsers.map((u) => (
                <div key={u._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--admin-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="admin-initials" style={{ background: 'var(--admin-primary-light)', color: 'var(--admin-primary)' }}>
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{u.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--admin-text-secondary)' }}>{u.email}</div>
                    </div>
                  </div>
                  <span className={`admin-badge admin-badge-${u.role}`}>{u.role}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No users yet" />
          )}
        </div>

        {/* Live Activity Feed */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="admin-card-title" style={{ marginBottom: '16px' }}>Recent Activity</h3>
          {activities && activities.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, maxHeight: '340px', overflowY: 'auto' }}>
              {activities.map((a, i) => (
                <div key={i} className="admin-feed-item">
                  <div className="admin-feed-dot" style={{ background: dotColor(a.type) }} />
                  <div style={{ flex: 1 }}>
                    <div className="admin-feed-title">{a.title}</div>
                    <div className="admin-feed-subtitle">{a.subtitle}</div>
                  </div>
                  <div className="admin-feed-time">{timeAgo(a.at)}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No recent activity" />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
