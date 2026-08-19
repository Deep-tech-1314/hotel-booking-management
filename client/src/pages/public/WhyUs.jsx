import React from 'react';
import { Link } from 'react-router-dom';
import { useCountUp } from '../../hooks/useScrollAnimation';
import {
  FiSearch, FiShield, FiCheckCircle, FiStar, FiCreditCard,
  FiHome, FiMessageSquare, FiClock, FiHeadphones, FiAward,
  FiArrowRight, FiZap,
} from 'react-icons/fi';

/* ────────────────────────────────────────
   Static data — no API calls, no Redux
   ──────────────────────────────────────── */

const STEPS = [
  {
    icon: FiSearch,
    title: 'Search & Discover',
    desc: 'Browse hundreds of verified properties across India. Filter by location, budget, category, and amenities to find your perfect match.',
  },
  {
    icon: FiShield,
    title: 'Book Securely',
    desc: 'Pay confidently with Stripe or Razorpay. Your booking is confirmed instantly — no waiting, no hidden charges.',
  },
  {
    icon: FiCheckCircle,
    title: 'Check In & Enjoy',
    desc: 'Arrive at a property that matches its listing. Our concierge team is just a message away if you need anything.',
  },
];

const FEATURES = [
  { icon: FiCreditCard, title: 'Dual Payment Options', desc: 'Pay your way — Stripe for international cards or Razorpay for UPI, netbanking, and wallets.' },
  { icon: FiShield, title: 'Verified Properties Only', desc: 'Every listing is inspected and approved by our team before it goes live on the platform.' },
  { icon: FiMessageSquare, title: 'Real Guest Reviews', desc: 'Authentic, unedited reviews from travellers who actually stayed at the property.' },
  { icon: FiZap, title: 'Instant Booking Confirmation', desc: 'No waiting for host approval — your reservation is confirmed the moment you complete payment.' },
  { icon: FiHeadphones, title: '24/7 Support', desc: 'Our concierge desk is available around the clock via chat, email, and phone for any concern.' },
  { icon: FiAward, title: 'Best Price Guarantee', desc: 'Found it cheaper elsewhere? We\'ll match the price — no questions asked.' },
];

const CATEGORIES = [
  { label: 'Hotels', slug: 'hotel', count: 6, bg: 'https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=600&q=80' },
  { label: 'Resorts', slug: 'resort', count: 3, bg: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80' },
  { label: 'Villas', slug: 'villa', count: 3, bg: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80' },
  { label: 'Apartments', slug: 'apartment', count: 1, bg: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80' },
  { label: 'Hostels', slug: 'hostel', count: 1, bg: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80' },
  { label: 'Guesthouses', slug: 'guesthouse', count: 2, bg: 'https://images.unsplash.com/photo-1561501900-3701fa6a0864?auto=format&fit=crop&w=600&q=80' },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma', city: 'Mumbai', rating: 5, quote: 'BookMyStay made finding a heritage property in Udaipur effortless. The verified-badge system gave me confidence, and the Razorpay integration was seamless for my UPI payment.' },
  { name: 'Arjun Reddy', city: 'Bangalore', rating: 5, quote: 'I booked a villa in Goa for a family reunion. Every photo matched reality, and the 24/7 support helped us arrange an early check-in without any fuss.' },
  { name: 'Meera Iyer', city: 'Chennai', rating: 4, quote: 'As a solo traveller, I rely on honest reviews. BookMyStay\'s review system is refreshingly transparent — no fake ratings, just real experiences from real guests.' },
];

/* ────────────────────────────────────────
   Component
   ──────────────────────────────────────── */

const WhyUs = () => {
  const stat1 = useCountUp(500, 2000);
  const stat2 = useCountUp(50000, 2500);
  const stat3 = useCountUp(25, 1800);
  const stat4 = useCountUp(4.8, 2000);

  return (
    <div className="whyus-page">
      {/* ═══ 1. Hero Banner ═══ */}
      <section className="whyus-hero">
        <img 
          src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=2000&q=80" 
          alt="Luxury Resort Background" 
          className="whyus-hero-bg" 
        />
        <div className="whyus-hero-overlay" />
        <div className="whyus-hero-content container">
          <div className="cine-eyebrow cine-hero-eyebrow animate-fadeIn">Why BookMyStay</div>
          <h1 className="whyus-hero-title animate-fadeIn" style={{ animationDelay: '0.15s' }}>
            Book Smarter. <em>Stay Better.</em>
          </h1>
          <p className="whyus-hero-sub animate-fadeIn" style={{ animationDelay: '0.35s', animationFillMode: 'both' }}>
            India's curated hotel booking platform — verified properties, transparent pricing, and a concierge that actually picks up.
          </p>
          <Link to="/hotels" className="whyus-hero-cta animate-fadeIn" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
            Explore Hotels <FiArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ═══ 2. Platform Stats Strip ═══ */}
      <section className="whyus-stats">
        <div className="container">
          <div className="whyus-stats-grid">
            <div className="whyus-stat-card">
              <div ref={stat1.ref} className="whyus-stat-number">{stat1.count.toLocaleString()}+</div>
              <div className="whyus-stat-label">Properties</div>
            </div>
            <div className="whyus-stat-card">
              <div ref={stat2.ref} className="whyus-stat-number">{stat2.count.toLocaleString()}+</div>
              <div className="whyus-stat-label">Happy Guests</div>
            </div>
            <div className="whyus-stat-card">
              <div ref={stat3.ref} className="whyus-stat-number">{stat3.count}+</div>
              <div className="whyus-stat-label">Cities</div>
            </div>
            <div className="whyus-stat-card">
              <div ref={stat4.ref} className="whyus-stat-number">{stat4.count}★</div>
              <div className="whyus-stat-label">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 3. How It Works ═══ */}
      <section className="whyus-how section">
        <div className="container">
          <header className="cine-section-header">
            <div>
              <div className="cine-eyebrow">Simple & transparent</div>
              <h2 className="cine-section-title">How it <em>works.</em></h2>
            </div>
            <p className="cine-section-lede">
              Three steps from searching to settling in — no phone calls, no middlemen, no surprises.
            </p>
          </header>

          <div className="whyus-steps">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={i}>
                  <div className="whyus-step">
                    <div className="whyus-step-icon">
                      <Icon size={28} />
                      <span className="whyus-step-num">{i + 1}</span>
                    </div>
                    <h3 className="whyus-step-title">{step.title}</h3>
                    <p className="whyus-step-desc">{step.desc}</p>
                  </div>
                  {i < STEPS.length - 1 && <div className="whyus-step-connector" aria-hidden="true" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ 4. Why Choose Us ═══ */}
      <section className="whyus-features section bg-secondary">
        <div className="container">
          <header className="cine-section-header">
            <div>
              <div className="cine-eyebrow">The BookMyStay difference</div>
              <h2 className="cine-section-title">Why choose <em>us.</em></h2>
            </div>
            <p className="cine-section-lede">
              Six reasons travellers keep coming back — and hosts keep listing.
            </p>
          </header>

          <div className="whyus-features-grid">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="whyus-feature-card hover-lift">
                  <div className="whyus-feature-icon"><Icon size={24} /></div>
                  <h3 className="whyus-feature-title">{feat.title}</h3>
                  <p className="whyus-feature-desc">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ 5. Property Categories Showcase ═══ */}
      <section className="whyus-categories section">
        <div className="container">
          <header className="cine-section-header">
            <div>
              <div className="cine-eyebrow">Browse by type</div>
              <h2 className="cine-section-title">Every kind of <em>stay.</em></h2>
            </div>
            <p className="cine-section-lede">
              From backpacker hostels to heritage palaces — pick the category that matches your travel style.
            </p>
          </header>

          <div className="whyus-cats-grid">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                to={`/hotels?category=${cat.slug}`}
                className="whyus-cat-card"
              >
                <img src={cat.bg} alt={cat.label} className="whyus-cat-bg" loading="lazy" />
                <div className="whyus-cat-overlay" />
                <div className="whyus-cat-content">
                  <h3 className="whyus-cat-label">{cat.label}</h3>
                  <span className="whyus-cat-count">{cat.count} listing{cat.count !== 1 ? 's' : ''}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 6. Guest Testimonials ═══ */}
      <section className="whyus-testimonials section bg-secondary">
        <div className="container">
          <header className="cine-section-header">
            <div>
              <div className="cine-eyebrow">Guest voices</div>
              <h2 className="cine-section-title">What our guests <em>say.</em></h2>
            </div>
          </header>

          <div className="whyus-test-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="whyus-test-card hover-lift">
                <div className="whyus-test-quote" aria-hidden="true">"</div>
                <div className="whyus-test-stars">
                  {[...Array(t.rating)].map((_, j) => (
                    <FiStar key={j} size={14} fill="currentColor" />
                  ))}
                  {t.rating < 5 && [...Array(5 - t.rating)].map((_, j) => (
                    <FiStar key={`e${j}`} size={14} />
                  ))}
                </div>
                <p className="whyus-test-text">{t.quote}</p>
                <div className="whyus-test-author">
                  <div className="whyus-test-avatar">
                    {t.name.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div>
                    <div className="whyus-test-name">{t.name}</div>
                    <div className="whyus-test-city">{t.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 7. CTA Footer Section ═══ */}
      <section className="whyus-cta-section">
        <div className="container">
          <div className="whyus-cta-inner">
            <h2 className="whyus-cta-title">Ready to find your perfect stay?</h2>
            <p className="whyus-cta-sub">
              Join thousands of travellers who book smarter with BookMyStay.
            </p>
            <div className="whyus-cta-buttons">
              <Link to="/hotels" className="whyus-cta-btn whyus-cta-btn--primary">
                Explore Hotels <FiArrowRight size={16} />
              </Link>
              <Link to="/register" className="whyus-cta-btn whyus-cta-btn--secondary">
                <FiHome size={16} /> List Your Property
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WhyUs;
