import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../redux/slices/authSlice';
import { toggleTheme } from '../../redux/slices/uiSlice';
import {
  FiSun, FiMoon, FiMenu, FiX, FiUser, FiLogOut, FiHeart,
  FiCalendar, FiGrid, FiCompass, FiSearch, FiMapPin, FiUsers,
  FiArrowRight, FiBell
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import NotificationBell from '../common/NotificationBell';
import Logo from '../common/Logo';
import LanguageSelector from '../common/LanguageSelector';

const REGIONS = [
  {
    title: 'North India',
    cities: ['Delhi', 'Agra', 'Jaipur', 'Jodhpur']
  },
  {
    title: 'South India',
    cities: ['Goa', 'Coorg', 'Munnar', 'Ooty']
  },
  {
    title: 'East & West',
    cities: ['Darjeeling', 'Kolkata', 'Mumbai', 'Rann of Kutch']
  },
  {
    title: 'Hill & Adventure',
    cities: ['Shimla', 'Manali', 'Rishikesh', 'Leh', 'Spiti']
  }
];

const FEATURED_PROPERTIES = [
  {
    name: 'Haveli Amer Heritage',
    city: 'Jaipur',
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&q=80&w=300&h=200'
  },
  {
    name: 'Lake Pichola Palace Resort',
    city: 'Udaipur',
    image: 'https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&q=80&w=300&h=200'
  },
  {
    name: 'Calangute Shores Resort',
    city: 'Goa',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=300&h=200'
  }
];

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [destDropdownOpen, setDestDropdownOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  
  // Search parameters in header modal
  const [headerSearch, setHeaderSearch] = useState({ city: '', checkIn: '', checkOut: '', guests: 1 });

  const { isAuthenticated, user } = useSelector((s) => s.auth || {});
  const { theme } = useSelector((s) => s.ui || {});
  
  // Simple wishlist count from redux if available, else static default 0
  const wishlistItems = useSelector((s) => s.wishlist?.items || []);
  const wishlistCount = wishlistItems.length;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownTimerRef = useRef(null);

  // Cycle featured properties in mega menu
  useEffect(() => {
    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % FEATURED_PROPERTIES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = useCallback(() => {
    dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/');
    setProfileOpen(false);
  }, [dispatch, navigate]);

  const handleDestMouseEnter = () => {
    if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current);
    setDestDropdownOpen(true);
  };

  const handleDestMouseLeave = () => {
    dropdownTimerRef.current = setTimeout(() => {
      setDestDropdownOpen(false);
    }, 150);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();
    if (headerSearch.city) queryParams.append('city', headerSearch.city);
    if (headerSearch.checkIn) queryParams.append('checkIn', headerSearch.checkIn);
    if (headerSearch.checkOut) queryParams.append('checkOut', headerSearch.checkOut);
    if (headerSearch.guests) queryParams.append('guests', headerSearch.guests);
    
    navigate(`/hotels?${queryParams.toString()}`);
    setSearchModalOpen(false);
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const currentFeatured = FEATURED_PROPERTIES[featuredIndex];

  return (
    <>
      <header className={`premium-header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="premium-header-inner">
          
          {/* Left: Brand Logo */}
          <Link to="/" className="header-brand-link">
            <Logo size="md" variant="full" />
          </Link>

          {/* Center: Main Nav Links */}
          <nav className="header-nav-links" aria-label="Main Navigation">
            <Link to="/" className={`header-nav-item ${isActive('/') ? 'active' : ''}`}>Home</Link>
            <Link to="/hotels" className={`header-nav-item ${isActive('/hotels') ? 'active' : ''}`}>Explore</Link>
            <Link to="/why-us" className={`header-nav-item ${isActive('/why-us') ? 'active' : ''}`}>Why Us</Link>
            
            {/* Mega Dropdown Trigger */}
            <div
              className="mega-dropdown-trigger"
              onMouseEnter={handleDestMouseEnter}
              onMouseLeave={handleDestMouseLeave}
            >
              <span className={`header-nav-item cursor-pointer ${destDropdownOpen ? 'active' : ''}`}>
                Destinations
              </span>

              {destDropdownOpen && (
                <div className="mega-dropdown-panel" onMouseEnter={handleDestMouseEnter} onMouseLeave={handleDestMouseLeave}>
                  <div className="mega-regions-grid">
                    {REGIONS.map((region) => (
                      <div key={region.title} className="mega-region-col">
                        <div className="mega-region-title">{region.title}</div>
                        <div className="mega-region-cities">
                          {region.cities.map((city) => (
                            <Link
                              key={city}
                              to={`/hotels?city=${encodeURIComponent(city)}`}
                              className="mega-city-link"
                              onClick={() => setDestDropdownOpen(false)}
                            >
                              {city}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right side Featured Property */}
                  <div className="mega-featured-side">
                    <img
                      src={currentFeatured.image}
                      alt={currentFeatured.name}
                      className="mega-featured-img"
                    />
                    <div className="mega-featured-overlay" />
                    <div className="mega-featured-info">
                      <div className="mega-featured-tag">FEATURED STAY</div>
                      <div className="mega-featured-name">{currentFeatured.name}</div>
                      <div className="mega-featured-city">{currentFeatured.city}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link to="/contact" className={`header-nav-item ${isActive('/contact') ? 'active' : ''}`}>Contact</Link>
          </nav>

          {/* Search Trigger Pill (Desktop) */}
          <div className="header-search-trigger" onClick={() => setSearchModalOpen(true)}>
            <FiMapPin className="search-trigger-pin" />
            <span className="search-trigger-text">Where are you going?</span>
            <div className="search-trigger-icon-wrap">
              <FiSearch size={14} />
            </div>
          </div>

          {/* Right Action Menu */}
          <div className="header-right-actions">
            {/* Language Selector */}
            <LanguageSelector />

            {/* Theme Toggle */}
            <button
              onClick={() => dispatch(toggleTheme())}
              className="theme-toggle-btn"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>

            {/* Guest/Unauthenticated Right Section */}
            {!isAuthenticated ? (
              <>
                <Link to="/register?role=owner" className="header-btn-outline header-hide-mobile">
                  List Your Property
                </Link>
                <Link to="/login" className="header-btn-primary">
                  Sign In
                </Link>
              </>
            ) : (
              <>
                {/* Notification Bell */}
                <NotificationBell />

                {/* Owner Actions */}
                {user?.role === 'owner' && (
                  <Link to="/grand/overview" className="header-btn-outline header-hide-mobile" style={{ fontSize: '13px', padding: '6px 12px' }}>
                    Owner Panel
                  </Link>
                )}

                {/* Admin Actions */}
                {user?.role === 'admin' && (
                  <span className="admin-header-badge header-hide-mobile">Admin</span>
                )}

                {/* Avatar Menu */}
                <div className="header-avatar-container">
                  <button
                    className="header-avatar-btn"
                    onClick={() => setProfileOpen(!profileOpen)}
                    aria-expanded={profileOpen}
                  >
                    <img
                      src={user?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366f1&color=fff`}
                      alt={user?.name}
                    />
                  </button>

                  {profileOpen && (
                    <>
                      <div className="header-profile-scrim" onClick={() => setProfileOpen(false)} />
                      <div className="header-profile-dropdown">
                        <div className="header-profile-dropdown-user">
                          <div className="user-name">{user?.name}</div>
                          <div className="user-email">{user?.email}</div>
                          <div className="user-role">{user?.role}</div>
                        </div>

                        {/* Guest Links */}
                        {user?.role === 'user' && (
                          <>
                            <Link to="/me/bookings" onClick={() => setProfileOpen(false)} className="dropdown-link">My Bookings</Link>
                            <Link to="/me/messages" onClick={() => setProfileOpen(false)} className="dropdown-link">My Messages</Link>
                            <Link to="/me/wishlist" onClick={() => setProfileOpen(false)} className="dropdown-link">
                              Wishlist {wishlistCount > 0 && <span className="dropdown-badge">{wishlistCount}</span>}
                            </Link>
                            <Link to="/me" onClick={() => setProfileOpen(false)} className="dropdown-link">Profile</Link>
                          </>
                        )}

                        {/* Owner Links */}
                        {user?.role === 'owner' && (
                          <>
                            <Link to="/grand/hotels" onClick={() => setProfileOpen(false)} className="dropdown-link">My Properties</Link>
                            <Link to="/grand/settings" onClick={() => setProfileOpen(false)} className="dropdown-link">Profile</Link>
                            <Link to="/grand/overview" onClick={() => setProfileOpen(false)} className="dropdown-link">Owner Panel</Link>
                          </>
                        )}

                        {/* Admin Links */}
                        {user?.role === 'admin' && (
                          <>
                            <Link to="/admin/dashboard" onClick={() => setProfileOpen(false)} className="dropdown-link">Admin Panel</Link>
                            <Link to="/admin/settings" onClick={() => setProfileOpen(false)} className="dropdown-link">Profile</Link>
                          </>
                        )}

                        <button onClick={handleLogout} className="dropdown-link dropdown-link-danger">
                          <FiLogOut size={14} style={{ marginRight: '6px' }} /> Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Mobile Hamburger */}
            <button
              className="header-mobile-hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Full Screen Navigation Drawer */}
        {menuOpen && (
          <div className="mobile-drawer-overlay">
            <div className="mobile-drawer-body">
              <div className="mobile-drawer-header">
                <Logo size="md" variant="full" />
                <button className="mobile-drawer-close" onClick={() => setMenuOpen(false)}>
                  <FiX size={24} />
                </button>
              </div>

              <div className="mobile-drawer-nav">
                <Link to="/" onClick={() => setMenuOpen(false)} className="mobile-drawer-link">Home</Link>
                <Link to="/hotels" onClick={() => setMenuOpen(false)} className="mobile-drawer-link">Explore</Link>
                <Link to="/why-us" onClick={() => setMenuOpen(false)} className="mobile-drawer-link">Why Us</Link>
                <Link to="/contact" onClick={() => setMenuOpen(false)} className="mobile-drawer-link">Contact</Link>
                
                {user?.role === 'owner' && (
                  <Link to="/grand/overview" onClick={() => setMenuOpen(false)} className="mobile-drawer-link">Owner Panel</Link>
                )}
                {user?.role === 'admin' && (
                  <Link to="/admin/dashboard" onClick={() => setMenuOpen(false)} className="mobile-drawer-link">Admin Panel</Link>
                )}
              </div>

              <div className="mobile-drawer-footer">
                {!isAuthenticated ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                    <Link to="/login" onClick={() => setMenuOpen(false)} className="header-btn-primary" style={{ textAlign: 'center', justifyContent: 'center' }}>
                      Sign In
                    </Link>
                    <Link to="/register?role=owner" onClick={() => setMenuOpen(false)} className="header-btn-outline" style={{ textAlign: 'center', justifyContent: 'center' }}>
                      List Your Property
                    </Link>
                  </div>
                ) : (
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                      <img
                        src={user?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366f1&color=fff`}
                        alt={user?.name}
                        style={{ width: '48px', height: '48px', borderRadius: '50%' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600 }}>{user?.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user?.email}</div>
                      </div>
                    </div>
                    <button onClick={handleLogout} className="header-btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Global Search Overlay Modal */}
      {searchModalOpen && (
        <div className="search-modal-overlay" onClick={() => setSearchModalOpen(false)}>
          <div className="search-modal-body" onClick={(e) => e.stopPropagation()}>
            <div className="search-modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Search Stays</h2>
              <button className="search-modal-close" onClick={() => setSearchModalOpen(false)}>
                <FiX size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSearchSubmit} className="search-modal-form">
              <div className="search-modal-field">
                <label className="search-modal-label">Where are you going?</label>
                <div className="search-modal-input-wrap">
                  <FiMapPin className="search-modal-icon" />
                  <input
                    type="text"
                    placeholder="Enter city or location..."
                    value={headerSearch.city}
                    onChange={(e) => setHeaderSearch({ ...headerSearch, city: e.target.value })}
                  />
                </div>
              </div>

              <div className="search-modal-row">
                <div className="search-modal-field">
                  <label className="search-modal-label">Check In</label>
                  <div className="search-modal-input-wrap">
                    <FiCalendar className="search-modal-icon" />
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={headerSearch.checkIn}
                      onChange={(e) => setHeaderSearch({ ...headerSearch, checkIn: e.target.value })}
                    />
                  </div>
                </div>
                <div className="search-modal-field">
                  <label className="search-modal-label">Check Out</label>
                  <div className="search-modal-input-wrap">
                    <FiCalendar className="search-modal-icon" />
                    <input
                      type="date"
                      min={headerSearch.checkIn || new Date().toISOString().split('T')[0]}
                      value={headerSearch.checkOut}
                      onChange={(e) => setHeaderSearch({ ...headerSearch, checkOut: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="search-modal-field">
                <label className="search-modal-label">Number of Guests</label>
                <div className="search-modal-input-wrap">
                  <FiUsers className="search-modal-icon" />
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={headerSearch.guests}
                    onChange={(e) => setHeaderSearch({ ...headerSearch, guests: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <button type="submit" className="search-modal-submit-btn">
                <FiSearch size={16} style={{ marginRight: '6px' }} /> Search Properties
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
