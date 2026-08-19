import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { FiHome, FiDollarSign, FiUsers, FiTrendingUp, FiPlus, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';

const OwnerDashboard = () => {
  const [stats, setStats] = useState({
    totalHotels: 0,
    totalBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    occupancyRate: null,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // Fire both calls in parallel; either may fail independently.
      const hotelsP = api.get('/hotels/owner/my-hotels').catch(() => null);
      const overviewP = api.get('/grand/overview').catch(() => null);
      const bookingsP = api.get('/grand/bookings').catch(() => null);

      const [hotelsRes, overviewRes, bookingsRes] = await Promise.all([
        hotelsP, overviewP, bookingsP,
      ]);

      const hotels = hotelsRes?.data?.hotels || [];
      const overview = overviewRes?.data?.data?.stats || null;
      const bookings = bookingsRes?.data?.data?.bookings || bookingsRes?.data?.bookings || [];

      setStats({
        totalHotels: hotels.length,
        totalBookings: bookings.length,
        totalRevenue: overview?.totalRevenue ?? bookings.reduce(
          (sum, b) => sum + (b.totalPrice || 0), 0
        ),
        averageRating: hotels.length
          ? hotels.reduce((acc, h) => acc + (h.rating || 0), 0) / hotels.length
          : 0,
        occupancyRate: overview?.occupancyRate ?? null,
      });
      setRecentBookings(bookings.slice(0, 5));

      if (!hotelsRes && !overviewRes) {
        toast.error('Could not reach the server — showing empty stats');
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  const getStatusBorderColor = (status) => {
    switch (status) {
      case 'confirmed': return '#3b82f6';
      case 'checked-in': return '#10b981';
      case 'cancelled': return '#ef4444';
      case 'checked-out': return '#94a3b8';
      default: return '#c5a880';
    }
  };

  if (loading) {
    return <div className="page-loader"><div className="loader"></div></div>;
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ marginBottom: '4px' }}>Owner Dashboard</h1>
          <p className="text-secondary text-sm">Manage your properties and track performance</p>
        </div>
        <Link to="/owner/hotels/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiPlus /> Add New Property
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-4 mb-8">
        <div className="stat-card animate-fadeInUp">
          <div className="stat-icon blue"><FiHome /></div>
          <div>
            <div className="stat-label">Total Properties</div>
            <div className="stat-value">{stats.totalHotels}</div>
          </div>
        </div>
        <div className="stat-card animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <div className="stat-icon green"><FiTrendingUp /></div>
          <div>
            <div className="stat-label">Total Bookings</div>
            <div className="stat-value">{stats.totalBookings}</div>
          </div>
        </div>
        <div className="stat-card animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <div className="stat-icon amber"><FiDollarSign /></div>
          <div>
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div className="stat-card animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          <div className="stat-icon purple"><FiUsers /></div>
          <div>
            <div className="stat-label">{stats.occupancyRate ? 'Occupancy' : 'Average Rating'}</div>
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              {stats.occupancyRate || stats.averageRating.toFixed(1)}
              {!stats.occupancyRate && <FiStar size={20} style={{ color: 'var(--primary)', marginBottom: '2px' }} />}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Recent Bookings</h2>
          <Link to="/owner/bookings" className="text-sm" style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>View All →</Link>
        </div>
        {recentBookings.length === 0 ? (
          <div className="text-center py-12">
            <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)', opacity: 0.3 }}>📋</div>
            <p className="text-secondary" style={{ marginBottom: 'var(--space-4)' }}>
              Recent bookings will appear here once guests book your properties.
            </p>
            <Link to="/owner/hotels/new" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <FiPlus /> Add Your First Property
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recentBookings.map((b) => (
              <div
                key={b._id}
                className="flex justify-between items-center py-3"
                style={{
                  borderBottom: '1px solid var(--border)',
                  borderLeft: `3px solid ${getStatusBorderColor(b.bookingStatus)}`,
                  paddingLeft: 'var(--space-4)',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                  transition: 'background-color var(--transition-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div className="flex items-center gap-3">
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    background: 'var(--primary-glow)', color: 'var(--primary-dark)',
                    fontSize: '13px', fontWeight: 700, minWidth: 36,
                  }}>
                    {(b.user?.name || b.contact?.name || 'G').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm">
                      {b.user?.name || b.contact?.name || 'Guest'}
                    </div>
                    <div className="text-xs text-secondary">
                      {b.hotel?.name || '—'} · {b.checkIn ? new Date(b.checkIn).toLocaleDateString() : ''} → {b.checkOut ? new Date(b.checkOut).toLocaleDateString() : ''}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 600 }}>
                    ₹{(b.totalPrice || 0).toLocaleString('en-IN')}
                  </span>
                  <span
                    className="badge"
                    style={{
                      textTransform: 'capitalize',
                      fontSize: 10,
                      padding: '3px 10px',
                      borderRadius: 999,
                      background: b.bookingStatus === 'cancelled'
                        ? 'rgba(239,68,68,0.1)'
                        : b.bookingStatus === 'checked-in'
                        ? 'rgba(16,185,129,0.12)'
                        : b.bookingStatus === 'confirmed'
                        ? 'rgba(59,130,246,0.12)'
                        : 'rgba(197,168,128,0.18)',
                      color: b.bookingStatus === 'cancelled'
                        ? '#ef4444'
                        : b.bookingStatus === 'checked-in'
                        ? '#10b981'
                        : b.bookingStatus === 'confirmed'
                        ? '#3b82f6'
                        : 'var(--primary-dark)',
                    }}
                  >
                    {b.bookingStatus || 'pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;
