import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { subscribeNewsletter } from '../../redux/slices/contentSlice';
import { FiInstagram, FiTwitter, FiLinkedin, FiMail } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Logo from '../common/Logo';
import api from '../../utils/api';

const EXPLORE_LINKS = [
  { to: '/hotels?category=hotel', label: 'Hotels' },
  { to: '/hotels?category=resort', label: 'Resorts' },
  { to: '/hotels?category=villa', label: 'Villas' },
  { to: '/hotels?category=heritage', label: 'Heritage Properties' },
  { to: '/hotels?category=boutique', label: 'Boutique Hotels' },
  { to: '/hotels?category=campsite', label: 'Campsites' },
];

const DESTINATION_LINKS = [
  { to: '/hotels?city=Goa', label: 'Goa' },
  { to: '/hotels?city=Jaipur', label: 'Jaipur' },
  { to: '/hotels?city=Udaipur', label: 'Udaipur' },
  { to: '/hotels?city=Manali', label: 'Manali' },
  { to: '/hotels?city=Kerala', label: 'Kerala' },
  { to: '/hotels?city=Shimla', label: 'Shimla' },
  { to: '/hotels?city=Rishikesh', label: 'Rishikesh' },
  { to: '/hotels?city=Andaman', label: 'Andaman' },
];

const COMPANY_LINKS = [
  { to: '/about', label: 'About Us' },
  { to: '/why-us', label: 'Why BookMyStay' },
  { to: '/register?role=owner', label: 'List Your Property' },
  { to: '/contact', label: 'Contact Us' },
  { to: '#', label: 'Privacy Policy' },
  { to: '#', label: 'Terms of Service' },
];

const Footer = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await api.post('/newsletter/subscribe', { email });
      setSubscribed(true);
      toast.success('Thanks for subscribing!');
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Subscription failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="premium-footer">
      <div className="premium-footer-inner">
        <div className="footer-grid">
          
          {/* Column 1: Brand details */}
          <div className="footer-col footer-col-brand">
            <Link to="/" className="footer-logo-wrap">
              <Logo size="md" variant="full" color="white" />
            </Link>
            <p className="footer-tagline">
              India's most trusted hotel booking platform.
            </p>
            <div className="footer-social-row">
              <a href="#" className="footer-social-btn" aria-label="Instagram">
                <FiInstagram size={16} />
              </a>
              <a href="#" className="footer-social-btn" aria-label="Twitter">
                <FiTwitter size={16} />
              </a>
              <a href="#" className="footer-social-btn" aria-label="LinkedIn">
                <FiLinkedin size={16} />
              </a>
            </div>
            <div className="footer-badges">
              <div className="footer-badge">🔒 SSL Secured</div>
              <div className="footer-badge">✅ Verified Properties</div>
              <div className="footer-badge">💳 Secure Payments</div>
            </div>
          </div>

          {/* Column 2: Explore links */}
          <div className="footer-col">
            <h4 className="footer-col-heading">Explore</h4>
            <ul className="footer-links-list">
              {EXPLORE_LINKS.map((l, i) => (
                <li key={i}>
                  <Link to={l.to}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Destination links */}
          <div className="footer-col">
            <h4 className="footer-col-heading">Top Destinations</h4>
            <ul className="footer-links-list">
              {DESTINATION_LINKS.map((l, i) => (
                <li key={i}>
                  <Link to={l.to}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Company & Newsletter */}
          <div className="footer-col">
            <h4 className="footer-col-heading">Company</h4>
            <ul className="footer-links-list" style={{ marginBottom: '24px' }}>
              {COMPANY_LINKS.map((l, i) => (
                <li key={i}>
                  {l.to.startsWith('#') ? <a href={l.to}>{l.label}</a> : <Link to={l.to}>{l.label}</Link>}
                </li>
              ))}
            </ul>

            <h5 className="footer-col-heading" style={{ fontSize: '11px', marginTop: '16px' }}>Get travel deals</h5>
            {subscribed ? (
              <div className="footer-sub-success">Thanks for subscribing! 🎉</div>
            ) : (
              <form onSubmit={handleSubscribe} className="footer-sub-form">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
                <button type="submit" disabled={loading}>
                  {loading ? '...' : 'Subscribe'}
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Bottom bar */}
        <div className="footer-bottom-bar">
          <div className="footer-bottom-left">
            © 2025 BookMyStay. All rights reserved.
          </div>
          <div className="footer-bottom-center">
            Made with ❤️ for travelers across India
          </div>
          <div className="footer-bottom-right">
            {/* SVG Payment icons in grayscale */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="payment-icon-svg" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            <span style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' }}>Visa · MC · Stripe · Razorpay</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
