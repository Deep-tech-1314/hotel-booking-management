import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHomeContent, subscribeNewsletter } from '../../redux/slices/contentSlice';
import { fetchRecentViews, fetchRecommendations } from '../../redux/slices/analyticsSlice';
import { useScrollAnimation, useMouseParallax, useCountUp } from '../../hooks/useScrollAnimation';
import { FiMapPin, FiCalendar, FiUsers, FiSearch, FiStar, FiHeart, FiArrowRight, FiShield, FiHeadphones, FiCheckCircle, FiPlay, FiVolumeX, FiVolume2 } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Button from '../../components/common/Button';
import ImageLazy from '../../components/common/ImageLazy';
import InteractiveShowcase from '../../components/common/InteractiveShowcase';
import HomeCarousel from '../../components/common/HomeCarousel';
import KenBurnsHero from '../../components/common/KenBurnsHero';
import { HotelCardSkeleton, HeroSkeleton } from '../../components/common/Skeleton';
import HotelCard from '../../components/common/HotelCard';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=2000&q=80',
];
import toast from 'react-hot-toast';

const HERO_VIDEO_MP4 = '';


const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { homeContent, loading: contentLoading } = useSelector((state) => state.content);
  const { recentViews, recommendations } = useSelector((state) => state.analytics);

  const [searchParams, setSearchParams] = useState({
    city: '',
    checkIn: null,
    checkOut: null,
    guests: 1,
  });
  const [email, setEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [sessionId] = useState(() => {
    let sid = localStorage.getItem('bms_session');
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('bms_session', sid);
    }
    return sid;
  });

  // Fetch dynamic content on mount
  useEffect(() => {
    dispatch(fetchHomeContent());
    dispatch(fetchRecentViews({ sessionId, limit: 4 }));
    dispatch(fetchRecommendations({ sessionId, limit: 3 }));
  }, [dispatch, sessionId]);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (searchParams.city) query.append('city', searchParams.city);
    if (searchParams.checkIn) query.append('checkIn', searchParams.checkIn.toISOString());
    if (searchParams.checkOut) query.append('checkOut', searchParams.checkOut.toISOString());
    if (searchParams.guests) query.append('guests', searchParams.guests);
    navigate(`/hotels?${query.toString()}`);
  };

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (!email) return;
    setNewsletterLoading(true);
    try {
      await dispatch(subscribeNewsletter({ email })).unwrap();
      toast.success('Welcome! Check your inbox for exclusive deals.');
      setEmail('');
    } catch (err) {
      toast.error(err || 'Subscription failed');
    } finally {
      setNewsletterLoading(false);
    }
  };

  // Extract content sections
  const hero = homeContent?.hero;
  const destinationsRaw = homeContent?.destinations?.content;
  const destinations = Array.isArray(destinationsRaw) ? destinationsRaw : (destinationsRaw?.items || []);
  
  const testimonialsRaw = homeContent?.testimonials?.content;
  const testimonials = Array.isArray(testimonialsRaw) ? testimonialsRaw : (testimonialsRaw?.items || []);
  const featuresRaw = homeContent?.features?.content;
  const features = Array.isArray(featuresRaw) ? featuresRaw : (featuresRaw?.items || []);
  const newsletter = homeContent?.newsletter;

  // Scroll animation hooks
  const { ref: destRef, isVisible: destVisible } = useScrollAnimation({ threshold: 0.1 });
  const { ref: featRef, isVisible: featVisible } = useScrollAnimation({ threshold: 0.1 });
  const { ref: testRef, isVisible: testVisible } = useScrollAnimation({ threshold: 0.1 });
  const { ref: recRef, isVisible: recVisible } = useScrollAnimation({ threshold: 0.1 });
  const { ref: recentRef, isVisible: recentVisible } = useScrollAnimation({ threshold: 0.1 });
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation({ threshold: 0.3 });

  // Mouse parallax for hero
  const { ref: heroRef, position: mousePos } = useMouseParallax(15);

  // Hero video state — autoplay only when motion/data allow
  const heroVideoRef = useRef(null);
  const [heroVideoReady, setHeroVideoReady] = useState(false);
  const [heroMuted, setHeroMuted] = useState(true);
  const [allowHeroVideo, setAllowHeroVideo] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const saveData = navigator.connection?.saveData;
    setAllowHeroVideo(!reduce && !saveData);
  }, []);

  const handleHeroVideoReady = () => setHeroVideoReady(true);

  const toggleHeroMute = () => {
    const v = heroVideoRef.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    setHeroMuted(next);
    if (!next) {
      // Smooth volume fade-in
      v.volume = 0;
      let vol = 0;
      const step = () => {
        vol = Math.min(1, vol + 0.05);
        v.volume = vol;
        if (vol < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  };

  // Stats counter
  const stat1 = useCountUp(12400, 2000);
  const stat2 = useCountUp(850, 2000);
  const stat3 = useCountUp(98, 2000);
  const stat4 = useCountUp(4.9, 2000);

  if (contentLoading) {
    return <HeroSkeleton />;
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Immersive blurred glow blobs */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '-10%',
        width: '40vw',
        height: '40vw',
        background: 'var(--primary-glow)',
        borderRadius: '50%',
        filter: 'blur(120px)',
        opacity: 0.35,
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute',
        top: '60%',
        right: '-10%',
        width: '45vw',
        height: '45vw',
        background: 'rgba(197, 168, 128, 0.08)',
        borderRadius: '50%',
        filter: 'blur(150px)',
        opacity: 0.25,
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>
      {/* Hero Section with Video Background Option */}
      <section className="hero cine-hero" ref={heroRef} style={{ overflow: 'hidden' }}>
        <div className="hero-bg" style={{ position: 'absolute', inset: 0, zIndex: 1, backgroundColor: '#000', overflow: 'hidden' }}>
          {/* Fallback: Ken Burns image (always rendered; video fades over it) */}
          <div style={{ width: '100%', height: '100%', backgroundImage: 'url(https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=2000&auto=format&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center', animation: 'kenBurns 25s ease-in-out infinite alternate' }}></div>
          {allowHeroVideo && (
            <video
              ref={heroVideoRef}
              className={`hero-video-bg ${heroVideoReady ? 'is-ready' : ''}`}
              src={HERO_VIDEO_MP4}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              onLoadedData={handleHeroVideoReady}
              onCanPlay={handleHeroVideoReady}
            />
          )}
        </div>
        <div className="hero-overlay" style={{ background: 'linear-gradient(to bottom, rgba(15,20,35,0.62) 0%, rgba(15,20,35,0.32) 55%, rgba(15,20,35,0.72) 100%)' }}></div>
        {allowHeroVideo && (
          <button
            type="button"
            aria-label={heroMuted ? 'Unmute hero video' : 'Mute hero video'}
            onClick={toggleHeroMute}
            className="hero-mute-toggle"
          >
            {heroMuted ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
          </button>
        )}
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div className="hero-content mx-auto" style={{ textAlign: 'center' }}>
            <div className="cine-eyebrow cine-hero-eyebrow">BookMyStay — Curated stays since 2025</div>
            <h1 className="cine-hero-title">
              <span className="cine-hero-title-reveal"><span style={{ animationDelay: '0.05s' }}>Your dream stay,</span></span>{' '}
              <span className="cine-hero-title-reveal"><em style={{ animationDelay: '0.25s' }}>awaits.</em></span>
            </h1>
            <p className="cine-hero-sub animate-fadeIn" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
              {hero?.subtitle || 'A private collection of resorts, boutique hotels, and villas — each one chosen for the kind of trip you actually remember.'}
            </p>

          </div>
        </div>
        {/* Scroll cue */}
        <div className="scroll-cue" aria-hidden="true">
          <span>Scroll</span>
          <span className="scroll-cue-line" />
        </div>
      </section>

      {/* Why BookMyStay — auto-advancing carousel */}
      <HomeCarousel />

      {/* Stats Bar */}
      <section className="py-16 bg-secondary">
        <div className="container">
          <div className="grid grid-4 text-center stagger-children scroll-visible">
            <div>
              <div ref={stat1.ref} className="text-4xl font-bold mb-2" style={{ color: 'var(--primary-dark)' }}>{stat1.count.toLocaleString()}+</div>
              <div className="text-sm text-secondary">Happy Travelers</div>
            </div>
            <div>
              <div ref={stat2.ref} className="text-4xl font-bold mb-2" style={{ color: 'var(--primary-dark)' }}>{stat2.count}+</div>
              <div className="text-sm text-secondary">Luxury Properties</div>
            </div>
            <div>
              <div ref={stat3.ref} className="text-4xl font-bold mb-2" style={{ color: 'var(--primary-dark)' }}>{stat3.count}%</div>
              <div className="text-sm text-secondary">Satisfaction Rate</div>
            </div>
            <div>
              <div ref={stat4.ref} className="text-4xl font-bold mb-2" style={{ color: 'var(--primary-dark)' }}>{stat4.count}</div>
              <div className="text-sm text-secondary">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Recently Viewed */}
      {recentViews.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="animate-fadeIn">
              <div className="section-header">
                <h2 className="section-title">Continue Exploring</h2>
                <p className="section-subtitle">Pick up where you left off.</p>
              </div>
              <div className="grid grid-4">
                {recentViews.filter(rv => rv?.hotel?._id).map((rv, idx) => (
                  <Link to={`/hotel/${rv.hotel._id}`} key={idx} className="card hotel-card hover-lift card-shine">
                    <div className="card-img-wrapper hover-img-zoom">
                      <ImageLazy
                        src={rv.hotel.images?.[0]?.url}
                        alt={rv.hotel.name}
                        className="card-img"
                        height="200px"
                      />
                    </div>
                    <div className="hotel-info p-4">
                      <h3 className="hotel-name">{rv.hotel.name}</h3>
                      <div className="hotel-location">
                        <FiMapPin /> {rv.hotel.address?.city}, {rv.hotel.address?.country}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="section bg-secondary">
          <div className="container">
            <div className="animate-fadeIn">
              <div className="section-header">
                <h2 className="section-title">Recommended For You</h2>
                <p className="section-subtitle">Handpicked based on your interests.</p>
              </div>
              <div className="grid grid-3">
                {recommendations.filter(hotel => hotel?._id).map((hotel, idx) => (
                  <HotelCard
                    key={hotel._id || idx}
                    hotel={hotel}
                    showWishIcon={false}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Browse by Category Section */}
      <section className="section" style={{ padding: '64px 0 32px 0' }}>
        <div className="container">
          <div className="section-header" style={{ marginBottom: '32px' }}>
            <h2 className="section-title">Browse by Category</h2>
            <p className="section-subtitle">Find the perfect stay tailored to your style.</p>
          </div>
          
          <div className="category-browse-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            {[
              { name: 'Hotel', slug: 'hotel', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80' },
              { name: 'Resort', slug: 'resort', image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=600&q=80' },
              { name: 'Villa', slug: 'villa', image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80' },
              { name: 'Apartment', slug: 'apartment', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80' },
              { name: 'Hostel', slug: 'hostel', image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80' },
              { name: 'Guesthouse', slug: 'guesthouse', image: 'https://images.unsplash.com/photo-1627896157734-4d7d4388f24b?auto=format&fit=crop&w=600&q=80' },
              { name: 'Boutique', slug: 'boutique', image: 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=600&q=80' },
              { name: 'Heritage', slug: 'heritage', image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=600&q=80' },
              { name: 'Campsite', slug: 'campsite', image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80' },
              { name: 'Treehouse', slug: 'treehouse', image: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?auto=format&fit=crop&w=600&q=80' }
            ].map((cat, idx) => (
              <Link
                key={idx}
                to={`/hotels?category=${cat.slug}`}
                className="category-browse-card hover-lift"
                style={{
                  position: 'relative',
                  height: '150px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none'
                }}
              >
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${cat.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  transition: 'transform 0.3s ease'
                }} className="cat-card-bg" />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)',
                  zIndex: 1
                }} />
                <span style={{
                  position: 'relative',
                  zIndex: 2,
                  color: '#fff',
                  fontSize: '18px',
                  fontWeight: 700,
                  letterSpacing: '0.02em'
                }}>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Explore the Extraordinary — Editorial Mosaic */}
      <section className="cine-destinations">
        <header className="cine-section-header">
          <div>
            <div className="cine-eyebrow">A curated geography</div>
            <h2 className="cine-section-title">
              Explore the <em>extraordinary.</em>
            </h2>
          </div>
          <p className="cine-section-lede">
            From private islands to alpine lodges — six destinations from a much longer list. Each one has been visited, vetted, and quietly recommended by someone you'd trust to plan your honeymoon.
          </p>
        </header>

        <div className="cine-dest-grid">
          {[
            { city: 'Udaipur',   country: 'Rajasthan',             image: 'https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&q=80&w=1200', properties: 86 },
            { city: 'Goa',       country: 'India',                 image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&q=80&w=1200', properties: 142 },
            { city: 'Kerala',    country: 'Backwaters',            image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=80&w=1200', properties: 78 },
            { city: 'Jaipur',    country: 'The Pink City',         image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&q=80&w=1200', properties: 94 },
            { city: 'Rishikesh', country: 'Uttarakhand',           image: 'https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&q=80&w=1200', properties: 38 },
            { city: 'Ladakh',    country: 'The Roof of the World', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80&w=1200', properties: 22 },
          ].map((dest, i) => (
            <Link
              to={`/hotels?city=${encodeURIComponent(dest.city)}`}
              key={i}
              className="cine-dest-card"
              aria-label={`Explore stays in ${dest.city}, ${dest.country}`}
            >
              <img className="cine-dest-img" src={dest.image} alt="" loading="lazy" />
              <div className="cine-dest-overlay" />
              <div className="cine-dest-content">
                <div className="cine-dest-country">{dest.country}</div>
                <h3 className="cine-dest-city">{dest.city}</h3>
                <div className="cine-dest-meta">
                  <span className="cine-dest-pill">{dest.properties} stays</span>
                  <span className="cine-dest-arrow">Explore <FiArrowRight /></span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Signature Resorts — alternating split-screen editorial rows */}
      <section className="sig-resorts">
        <header className="cine-section-header">
          <div>
            <div className="cine-eyebrow">The signature collection</div>
            <h2 className="cine-section-title">
              Resorts worth <em>flying for.</em>
            </h2>
          </div>
          <p className="cine-section-lede">
            A short list of the properties our concierge actually books for themselves. Architect-built, chef-driven, and quietly run by people who think a turndown ritual still matters.
          </p>
        </header>

        <div className="sig-resorts-rows">
          {[
            {
              id: '6a815ce0ae23a8717c386869',
              name: 'The Oberoi Mumbai',
              location: 'Nariman Point, Mumbai',
              price: 12500,
              image: '/uploads/hotels/images-1786862816410-233153551.jpg',
              rating: 5.0,
              desc: "Iconic five-star luxury situated at Nariman Point along Marine Drive. Panoramic views of the Arabian Sea and the Queen's Necklace, world-class fine dining, luxury spa, and oceanfront suites.",
              amenities: ['Arabian Sea View', 'Marine Drive', 'Luxury Spa', 'Ocean Suites'],
            },
            {
              id: '6a6863c66536c5078077566c',
              name: 'Taj Lake Palace',
              location: 'Lake Pichola, Udaipur',
              price: 25000,
              image: 'https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&w=1600',
              rating: 4.9,
              desc: 'Rising from the shimmering waters of Lake Pichola, this 18th-century marble palace offers floating grandeur framed by the Aravalli Mountains with private royal boat transfers.',
              amenities: ['Lake-Facing Suites', 'Royal Boat Transfers', 'Palace Dining', 'Heritage Tours'],
            },
            {
              id: '6a6863c66536c50780775608',
              name: 'Misty Peak Tea Estate Villa',
              location: 'Munnar, Kerala',
              price: 5000,
              image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=1600',
              rating: 4.8,
              desc: 'Perched atop a working tea estate at 5,200 feet, opening to endless carpets of emerald tea bushes rolling into mist-wrapped valleys with private plunge pools.',
              amenities: ['Tea Plantation Tour', 'Private Plunge Pool', 'Mountain Trails', 'Ayurveda Spa'],
            },
          ].map((resort, idx) => (
            <article key={idx} className={`sig-row ${idx % 2 === 1 ? 'is-reverse' : ''}`}>
              <div className="sig-row-media">
                <div className="sig-row-rating">
                  <FiStar fill="currentColor" /> {resort.rating.toFixed(1)}
                </div>
                <Link to={`/hotel/${resort.id}`}>
                  <img className="sig-row-img" src={resort.image} alt={resort.name} loading="lazy" />
                </Link>
              </div>
              <div className="sig-row-content">
                <span className="sig-row-number">{String(idx + 1).padStart(2, '0')}.</span>
                <div className="cine-eyebrow">Signature resort</div>
                <h3 className="sig-row-name">
                  <Link to={`/hotel/${resort.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {resort.name}
                  </Link>
                </h3>
                <div className="sig-row-location">
                  <FiMapPin /> {resort.location}
                </div>
                <p className="sig-row-desc">{resort.desc}</p>
                <div className="sig-row-amenities">
                  {resort.amenities.map((a, i) => (
                    <span key={i} className="sig-row-amenity">{a}</span>
                  ))}
                </div>
                <div className="sig-row-cta-row">
                  <div>
                    <div className="sig-row-price-label">From</div>
                    <div className="sig-row-price-value">₹{resort.price.toLocaleString('en-IN')}<span> / night</span></div>
                  </div>
                  <Link to={`/hotel/${resort.id}`} className="sig-row-cta">
                    Reserve <FiArrowRight />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 'clamp(64px, 8vw, 96px)' }}>
          <Link to="/hotels?category=resort" className="btn btn-secondary btn-lg hover-scale">
            View the full collection <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section bg-secondary">
        <div className="container">
          <div className="animate-fadeIn">
            <div className="section-header">
              <h2 className="section-title">{homeContent?.features?.title || 'Why BookMyStay'}</h2>
              <p className="section-subtitle">{homeContent?.features?.subtitle || 'We deliver unparalleled experiences from booking to checkout.'}</p>
            </div>

            <div className="grid grid-3 stagger-children scroll-visible">
              {features.map((feat, idx) => {
                const Icon = feat.icon === 'CheckCircle' ? FiCheckCircle : feat.icon === 'Shield' ? FiShield : FiHeadphones;
                return (
                  <div key={idx} className="stat-card hover-lift card-shine" style={{ flexDirection: 'column', textAlign: 'center', padding: '40px 30px' }}>
                    <div className="stat-icon" style={{ width: '80px', height: '80px', fontSize: '32px', margin: '0 auto var(--space-5)', background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                      <Icon />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                    <p className="text-secondary leading-loose">{feat.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Product Showcase (§5.2) */}
      <InteractiveShowcase />

      {/* Testimonials */}
      <section className="section bg-secondary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-glow rounded-full blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-light rounded-full blur-3xl opacity-10 transform -translate-x-1/2 translate-y-1/2"></div>

        <div className="container relative z-10">
          <div className="animate-fadeIn">
            <div className="section-header">
              <h2 className="section-title">{homeContent?.testimonials?.title || 'Traveler Stories'}</h2>
              <p className="section-subtitle">{homeContent?.testimonials?.subtitle || 'Read what our guests have to say about their unforgettable experiences.'}</p>
            </div>

            <div className="grid grid-3 stagger-children scroll-visible">
              {testimonials.map((testimonial, idx) => (
                <div key={idx} className="card card-glass p-8 relative hover-lift">
                  <div className="text-primary-light opacity-20 text-6xl absolute top-6 right-6 font-serif">"</div>
                  <div className="flex gap-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <FiStar key={i} className="text-amber" fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-secondary mb-8 leading-loose relative z-10">
                    {testimonial.content}
                  </p>
                  <div className="flex items-center gap-4 border-t border-border pt-6">
                    <ImageLazy
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width="48px"
                      height="48px"
                      className="skeleton-circle"
                      style={{ borderRadius: '50%', border: '2px solid var(--border)' }}
                    />
                    <div>
                      <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>{testimonial.name}</h4>
                      <p className="text-xs text-muted">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Subscribe */}
      <section className="py-24 relative">
        <div className="container">
          <div className="card p-12 text-center relative overflow-hidden" style={{ border: '2px solid var(--primary)', background: 'linear-gradient(135deg, #0f1423 0%, #1e293b 100%)' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent z-0"></div>

            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl font-bold mb-4 text-white">{newsletter?.title || 'Unlock Secret Deals'}</h2>
              <p className="text-lg mb-8" style={{ color: '#cbd5e1' }}>
                {newsletter?.subtitle || 'Subscribe to our newsletter and get up to 20% off on your first luxury booking.'}
              </p>

              <form className="flex gap-2 max-w-md mx-auto" onSubmit={handleNewsletter}>
                <input
                  type="email"
                  placeholder={newsletter?.content?.placeholder || 'Enter your email address'}
                  className="form-input flex-1"
                  style={{ background: 'white', color: '#0f1423', border: 'none' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={newsletterLoading}
                />
                <Button type="submit" className="btn-primary whitespace-nowrap" disabled={newsletterLoading}>
                  {newsletterLoading ? 'Subscribing...' : (newsletter?.content?.buttonText || 'Subscribe')}
                </Button>
              </form>
              <p className="text-xs mt-4" style={{ color: '#94a3b8' }}>{newsletter?.content?.disclaimer || 'We respect your privacy. Unsubscribe at any time.'}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
