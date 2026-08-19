import React, { useState, useCallback } from 'react';
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiGrid, FiUsers, FiHome, FiCalendar, FiDollarSign,
  FiSettings, FiMenu, FiX, FiLogOut, FiSun, FiMoon, FiShield, FiMessageSquare,
} from 'react-icons/fi';
import NotificationBell from '../common/NotificationBell';
import { toggleTheme } from '../../redux/slices/uiSlice';
import { logoutUser } from '../../redux/slices/authSlice';
import Logo from '../common/Logo';
import '../../styles/admin.css';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/admin/dashboard', icon: FiGrid, label: 'Dashboard', end: true },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/admin/hotels', icon: FiHome, label: 'Hotels' },
      { to: '/admin/owners', icon: FiShield, label: 'Owners' },
      { to: '/admin/users', icon: FiUsers, label: 'Users' },
      { to: '/admin/bookings', icon: FiCalendar, label: 'Bookings' },
      { to: '/admin/payments', icon: FiDollarSign, label: 'Payments' },
      { to: '/admin/messages', icon: FiMessageSquare, label: 'Messages' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/settings', icon: FiSettings, label: 'Settings' },
    ],
  },
];

const PAGE_TITLES = {
  '/admin/dashboard': 'Dashboard',
  '/admin/hotels': 'Hotels',
  '/admin/owners': 'Owners Management',
  '/admin/users': 'Users',
  '/admin/bookings': 'Bookings',
  '/admin/payments': 'Payments',
  '/admin/messages': 'Platform Messages',
  '/admin/settings': 'Settings',
};


const AdminLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const { theme } = useSelector((state) => state.ui);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageTitle = PAGE_TITLES[location.pathname] || 'Admin';

  const handleLogout = useCallback(() => {
    dispatch(logoutUser());
    navigate('/login');
  }, [dispatch, navigate]);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-layout">
      {/* Mobile Overlay */}
      <div
        className={`admin-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Link to="/" className="admin-sidebar-logo" onClick={closeSidebar} title="Go to home page">
          <Logo size="sm" variant="full" color="white" />
        </Link>

        <div className="admin-nav-group">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="admin-nav-label">{section.label}</div>
              {section.items.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={closeSidebar}
                  className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} /> {label}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-profile">
            <div className="admin-sidebar-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div>
              <div className="admin-sidebar-name">{user?.name || 'Admin'}</div>
              <div className="admin-sidebar-email">{user?.email || 'admin@bookmystay.com'}</div>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <FiLogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button className="admin-hamburger" onClick={() => setSidebarOpen(true)}>
              <FiMenu size={22} />
            </button>
            <span className="admin-page-title">{pageTitle}</span>
          </div>
          <div className="admin-topbar-right">
            <button
              className="admin-theme-toggle"
              onClick={() => dispatch(toggleTheme())}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
            </button>
            <NotificationBell />
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
