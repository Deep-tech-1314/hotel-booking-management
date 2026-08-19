import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FiGrid, FiCalendar, FiBox, FiUsers, FiBarChart2, FiSearch, FiChevronDown, FiHome, FiSun, FiMoon, FiCreditCard, FiSettings, FiX, FiMessageSquare } from 'react-icons/fi';
import NotificationBell from '../common/NotificationBell';
import Logo from '../common/Logo';
import LanguageSelector from '../common/LanguageSelector';
import { toggleTheme } from '../../redux/slices/uiSlice';
import { logoutUser } from '../../redux/slices/authSlice';
import toast from 'react-hot-toast';
import '../../styles/grand-theme.css';

const GrandLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const { theme } = useSelector((state) => state.ui);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <div className="grand-theme grand-layout">
      {/* Sidebar */}
      <div className="grand-sidebar-container">
        <Link to="/" className="grand-logo-area" title="Go to home page" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <Logo size="sm" color="gold" />
          <div>
            <div className="grand-logo-text" style={{ fontSize: '18px', textTransform: 'none', letterSpacing: 'normal', fontWeight: 600, color: 'var(--grand-gold)' }}>BookMyStay</div>
            <div className="grand-logo-subtext" style={{ letterSpacing: '1px' }}>OWNER DASHBOARD</div>
          </div>
        </Link>
        
        <div className="grand-nav">
          <NavLink to="/grand/overview" end className={({isActive}) => `grand-nav-item ${isActive ? 'active' : ''}`}>
            <FiGrid size={18} /> Overview
          </NavLink>
          <NavLink to="/grand/hotels" className={({isActive}) => `grand-nav-item ${isActive ? 'active' : ''}`}>
            <FiHome size={18} /> Properties
          </NavLink>
          <NavLink to="/grand/bookings" className={({isActive}) => `grand-nav-item ${isActive ? 'active' : ''}`}>
            <FiCalendar size={18} /> Bookings
          </NavLink>
          <NavLink to="/grand/rooms" className={({isActive}) => `grand-nav-item ${isActive ? 'active' : ''}`}>
            <FiBox size={18} /> Rooms
          </NavLink>
          <NavLink to="/grand/guests" className={({isActive}) => `grand-nav-item ${isActive ? 'active' : ''}`}>
            <FiUsers size={18} /> Guests
          </NavLink>
          <NavLink to="/grand/messages" className={({isActive}) => `grand-nav-item ${isActive ? 'active' : ''}`}>
            <FiMessageSquare size={18} /> Messages
          </NavLink>
          <NavLink to="/grand/reports" className={({isActive}) => `grand-nav-item ${isActive ? 'active' : ''}`}>
            <FiBarChart2 size={18} /> Reports
          </NavLink>
          <NavLink to="/grand/payouts" className={({isActive}) => `grand-nav-item ${isActive ? 'active' : ''}`}>
            <FiCreditCard size={18} /> Payouts
          </NavLink>
          <NavLink to="/grand/settings" className={({isActive}) => `grand-nav-item ${isActive ? 'active' : ''}`}>
            <FiSettings size={18} /> Settings
          </NavLink>
        </div>
      </div>


      {/* Main Content Area */}
      <div className="grand-main">
        {/* Header */}
        <header className="grand-header">
          {mobileSearchOpen ? (
            <div className="grand-mobile-search-active" style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '12px' }}>
              <FiSearch color="var(--grand-text-muted)" />
              <input 
                type="text" 
                placeholder="Search guests, rooms, bookings..." 
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--grand-text)',
                  fontSize: '14px',
                  outline: 'none'
                }}
                autoFocus
              />
              <button 
                onClick={() => setMobileSearchOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--grand-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px'
                }}
              >
                <FiX size={20} />
              </button>
            </div>
          ) : (
            <>
              <div className="grand-header-left">
                <div className="flex gap-4">
                  {/* Optional page tabs like Overview, Front Desk from Screenshot 1 */}
                </div>
              </div>
              <div className="grand-header-center">
                <div className="grand-search">
                  <FiSearch color="var(--grand-text-muted)" />
                  <input type="text" placeholder="Search guests, rooms, bookings..." />
                </div>
              </div>
              <div className="grand-header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  className="grand-mobile-search-trigger"
                  onClick={() => setMobileSearchOpen(true)}
                  style={{
                    display: 'none',
                    background: 'none',
                    border: 'none',
                    color: 'var(--grand-text-muted)',
                    cursor: 'pointer',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px'
                  }}
                >
                  <FiSearch size={18} />
                </button>
                <LanguageSelector variant="grand" />
                <button
                  type="button"
                  className="grand-theme-toggle"
                  onClick={() => dispatch(toggleTheme())}
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
                </button>
                <NotificationBell />
            <div className="grand-profile-container" style={{ position: 'relative' }}>
              <div 
                className="grand-profile" 
                onClick={() => setProfileOpen(!profileOpen)} 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
              >
                <img 
                  src={user?.avatar?.url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || 'Guest') + '&background=c5a880&color=fff'} 
                  alt={user?.name || 'Guest'} 
                  className="grand-profile-img" 
                />
                {user && (user.role === 'owner' || user.role === 'admin') && (
                  <div className="grand-profile-info">
                    <span className="grand-profile-name">{user.name}</span>
                    <span className="grand-profile-role">{user.role === 'admin' ? 'Administrator' : 'Operations Director'}</span>
                  </div>
                )}
                <FiChevronDown 
                  color="var(--grand-text-muted)" 
                  style={{ transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} 
                />
              </div>

              {profileOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setProfileOpen(false)} />
                  <div className="grand-profile-dropdown" style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    width: '200px',
                    backgroundColor: 'var(--grand-card)',
                    border: '1px solid var(--grand-border)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    padding: '8px 0',
                    zIndex: 100,
                  }}>
                    <Link to="/grand/settings" onClick={() => setProfileOpen(false)} className="grand-dropdown-link" style={{ display: 'block', padding: '10px 16px', fontSize: '13px', color: 'var(--grand-text)', transition: 'background-color 0.2s' }}>
                      Profile & Settings
                    </Link>
                    <Link to="/" onClick={() => setProfileOpen(false)} className="grand-dropdown-link" style={{ display: 'block', padding: '10px 16px', fontSize: '13px', color: 'var(--grand-text)', transition: 'background-color 0.2s' }}>
                      Back to Home
                    </Link>
                    <div style={{ height: '1px', backgroundColor: 'var(--grand-border)', margin: '4px 0' }} />
                    <button 
                      onClick={handleLogout} 
                      className="grand-dropdown-link grand-logout-btn" 
                      style={{ 
                        width: '100%', 
                        textAlign: 'left', 
                        border: 'none', 
                        background: 'none', 
                        display: 'block', 
                        padding: '10px 16px', 
                        fontSize: '13px', 
                        color: 'var(--grand-danger)', 
                        cursor: 'pointer',
                        fontFamily: 'inherit'
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </header>

        {/* Dynamic Page Content */}
        <div className="grand-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default GrandLayout;
