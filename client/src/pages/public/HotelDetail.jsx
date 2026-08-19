import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHotelDetails, clearHotelDetails } from '../../redux/slices/hotelSlice';
import { trackHotelView } from '../../redux/slices/analyticsSlice';
import { calculateNights, formatPrice } from '../../utils/constants';
import {
  FiArrowRight, FiCheck, FiChevronLeft, FiChevronRight, FiClock,
  FiHeart, FiMapPin, FiShare2, FiShield, FiStar, FiUsers, FiX,
  FiMail, FiPhone, FiAward, FiMaximize2, FiCompass, FiSun, FiNavigation,
  FiHome, FiBox, FiKey, FiTag, FiCalendar
} from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import ImageLazy from '../../components/common/ImageLazy';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const TABS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'location-guide', label: 'Location & Travel Guide' },
  { id: 'rooms',     label: 'Rooms & Rates' },
  { id: 'contact-location', label: 'Contact Details' },
  { id: 'amenities', label: 'Amenities' },
  { id: 'policies',  label: 'Policies' },
];

const DetailSkeleton = () => (
  <div className="hd-skel">
    <div className="hd-skel-title" />
    <div className="hd-skel-meta" />
    <div className="hd-skel-gallery" />
    <div className="hd-skel-body" />
  </div>
);

// Location Insights Generator for location-specific details
const getLocationInsights = (hotel) => {
  const city = (hotel?.address?.city || '').toLowerCase();
  const state = (hotel?.address?.state || '').toLowerCase();
  const cat = (hotel?.category || '').toLowerCase();
  const name = (hotel?.name || '').toLowerCase();

  if (city.includes('spiti') || name.includes('spiti') || cat.includes('camp')) {
    return {
      altitude: '3,800 Meters (High-Altitude Himalayan Desert)',
      climate: 'Cold Desert Climate · Clear Starry Skies',
      bestSeason: 'May to October for open mountain passes & trekking',
      transitInfo: 'Nearest Airport: Bhuntar (Kullu) - 245 km | Nearest Railhead: Shimla - 415 km',
      nearbySights: [
        { name: 'Key Monastery', dist: '12 km' },
        { name: 'Chandra Taal Lake', dist: '45 km' },
        { name: 'Dhankar Gompa & Lake', dist: '32 km' },
        { name: 'Langza Fossil Village', dist: '16 km' },
      ],
      badges: ['🌌 3,800m Stargazing Sanctuary', '🏔️ Moonscape Desert Views', '🔥 Heated Tents', '🍵 Local Butter Tea'],
      travelTip: 'Please allow 24 hours for altitude acclimatization upon arrival. Carry warm woolens even during summer months and bring adequate cash as mobile ATMs can be limited.',
    };
  }

  if (city.includes('jaipur') || name.includes('amer') || name.includes('jaipur')) {
    return {
      altitude: '431 Meters (Aravalli Foothills)',
      climate: 'Semi-Arid Royal Climate · Warm Sunsets',
      bestSeason: 'October to March (Mild Pleasant Winters)',
      transitInfo: 'Jaipur International Airport (JAI) - 14 km | Jaipur Junction Railway Station - 6 km',
      nearbySights: [
        { name: 'Amer Fort & Palace', dist: '3 km' },
        { name: 'Hawa Mahal (Palace of Winds)', dist: '5 km' },
        { name: 'City Palace & Jantar Mantar', dist: '4.5 km' },
        { name: 'Jal Mahal (Water Palace)', dist: '2 km' },
      ],
      badges: ['🏰 Royal Heritage Architecture', '💃 Evening Folk Cultural Music', '🍛 Marwari Gourmet Dining', '🦚 Peacock Courtyard'],
      travelTip: 'Visit Amer Fort early in the morning for camel rides and elephant gateway entries. Enjoy authentic Rajasthani Thali in the heritage courtyard dining area.',
    };
  }

  if (city.includes('udaipur') || name.includes('pichola') || name.includes('lake')) {
    return {
      altitude: '598 Meters (City of Lakes)',
      climate: 'Subtropical Lake Climate · Breezy Evenings',
      bestSeason: 'September to March (Lush Monsoons & Cool Winters)',
      transitInfo: 'Maharana Pratap Airport (UDR) - 24 km | Udaipur City Station - 4 km',
      nearbySights: [
        { name: 'Lake Pichola & Jag Mandir', dist: 'Overlooking' },
        { name: 'City Palace Udaipur', dist: '1.5 km' },
        { name: 'Saheliyon-ki-Bari Gardens', dist: '3 km' },
        { name: 'Sajjangarh Monsoon Palace', dist: '8 km' },
      ],
      badges: ['🌅 Lake Pichola Sunset Views', '⛵ Private Boat Jetty', '🍷 Rooftop Fine Dining', '🏰 Palace Architecture'],
      travelTip: 'Reserve a table at the rooftop dining pavilion before 6:00 PM for panoramic sunset views over Lake Pichola and the lit-up City Palace.',
    };
  }

  if (city.includes('goa') || name.includes('calangute') || cat.includes('resort')) {
    return {
      altitude: 'Sea Level (Coastal Oceanfront)',
      climate: 'Tropical Monsoon & Beach Sunshine',
      bestSeason: 'November to February (Sun, Surf & Nightlife)',
      transitInfo: 'Dabolim Airport (GOI) - 38 km | MOPA Airport (GOX) - 28 km | Thivim Station - 18 km',
      nearbySights: [
        { name: 'Calangute & Baga Beach', dist: '500 meters' },
        { name: 'Fort Aguada & Lighthouse', dist: '7 km' },
        { name: 'Anjuna Flea Market', dist: '6 km' },
        { name: 'Chapora Fort (Dil Chahta Hai Fort)', dist: '10 km' },
      ],
      badges: ['🏖️ Direct Beach Access', '🍹 Sunset Beach Shack Bar', '🏄 Water Sports Hub', '🌴 Tropical Palm Gardens'],
      travelTip: 'Water sports operate right off Calangute beach every morning. Beach shacks serve fresh local seafood catch starting at 1:00 PM.',
    };
  }

  return {
    altitude: 'Prime Scenic Elevation',
    climate: 'Pleasant & Comfortable Local Climate',
    bestSeason: 'Year-round welcoming climate with peak winter/summer highlights',
    transitInfo: `Conveniently accessible from ${hotel?.address?.city || 'city'} transit hubs and airport links`,
    nearbySights: [
      { name: `${hotel?.address?.city || 'City'} Center Marketplace`, dist: '2 km' },
      { name: 'Historic Cultural District', dist: '3.5 km' },
      { name: 'Scenic Viewpoint Park', dist: '4 km' },
    ],
    badges: ['✨ Curated Boutique Stay', '🌿 Nature Surroundings', '☕ Gourmet Breakfast', '🔒 High-Security Premises'],
    travelTip: 'Check-in begins at 2:00 PM. Our concierge can arrange custom local tours, private airport transfers, and vehicle rentals upon request.',
  };
};

const HotelDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { hotelDetails: hotel, rooms, loading } = useSelector((s) => s.hotels);
  const { isAuthenticated } = useSelector((s) => s.auth);

  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [galleryFilter, setGalleryFilter] = useState('all');
  const [wished, setWished] = useState(false);
  const [sessionId] = useState(() => localStorage.getItem('bms_session') || 'sess_anon');

  useEffect(() => {
    dispatch(fetchHotelDetails(id));
    dispatch(trackHotelView({ hotelId: id, sessionId }));
    return () => dispatch(clearHotelDetails());
  }, [dispatch, id, sessionId]);

  useEffect(() => {
    if (!isAuthenticated || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/wishlist');
        if (cancelled) return;
        setWished((data.wishlist || []).some((h) => h._id === id));
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, id]);

  const locationInsights = useMemo(() => getLocationInsights(hotel), [hotel]);

  // Aggregate property and room images into gallery
  const propertyImages = useMemo(() => {
    if (!hotel?.images) return [];
    return hotel.images.filter(img => img && img.url).map(img => ({
      url: img.url,
      caption: hotel.name,
      category: 'property'
    }));
  }, [hotel]);

  const roomImages = useMemo(() => {
    if (!rooms || rooms.length === 0) return [];
    const imgs = [];
    rooms.forEach(room => {
      if (room.images && room.images.length > 0) {
        room.images.forEach(img => {
          if (img && img.url) {
            imgs.push({
              url: img.url,
              caption: `${room.title} (${room.roomType})`,
              category: 'rooms'
            });
          }
        });
      }
    });
    return imgs;
  }, [rooms]);

  const allGalleryImages = useMemo(() => {
    const combined = [...propertyImages, ...roomImages];
    if (combined.length === 0) {
      return [{
        url: 'https://images.unsplash.com/photo-1542314831-c6a4d1400820?auto=format&fit=crop&q=80&w=1200',
        caption: hotel?.name || 'Hotel',
        category: 'property'
      }];
    }
    return combined;
  }, [propertyImages, roomImages, hotel?.name]);

  const filteredGalleryImages = useMemo(() => {
    if (galleryFilter === 'all') return allGalleryImages;
    return allGalleryImages.filter(img => img.category === galleryFilter);
  }, [allGalleryImages, galleryFilter]);

  const nights = useMemo(
    () => (checkIn && checkOut ? Math.max(0, calculateNights(checkIn, checkOut)) : 0),
    [checkIn, checkOut],
  );

  const cheapestRoom = useMemo(() => {
    if (!rooms || rooms.length === 0) return null;
    return [...rooms].sort((a, b) => a.pricePerNight - b.pricePerNight)[0];
  }, [rooms]);

  // Lightbox keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') setGalleryIndex((i) => (i + 1) % filteredGalleryImages.length);
      if (e.key === 'ArrowLeft')  setGalleryIndex((i) => (i - 1 + filteredGalleryImages.length) % filteredGalleryImages.length);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, filteredGalleryImages.length]);

  const handleReserve = (roomId) => {
    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates');
      document.getElementById('hd-availability')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    const qs = new URLSearchParams({
      hotelId: hotel._id,
      roomId,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
    });
    navigate(`/checkout?${qs.toString()}`);
  };

  const toggleWish = async () => {
    if (!isAuthenticated) {
      toast.error('Sign in to save stays');
      return navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
    }
    const next = !wished;
    setWished(next);
    try {
      if (next) await api.post(`/wishlist/${hotel._id}`);
      else       await api.delete(`/wishlist/${hotel._id}`);
    } catch (err) {
      setWished(!next);
      toast.error(err.response?.data?.message || 'Wishlist update failed');
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: hotel?.name,
          text: `Check out ${hotel?.name} on BookMyStay`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
    } catch { /* user cancelled */ }
  };

  if (loading || !hotel) {
    return <div className="hd-page"><DetailSkeleton /></div>;
  }

  const { name, rating, numReviews, category, description, address, amenities = [], policies = {}, owner } = hotel;
  const totalRooms = (rooms || []).reduce((sum, r) => sum + (r.totalRooms || 0), 0);

  const previewPrice = cheapestRoom?.pricePerNight || 0;
  const taxes = nights && previewPrice ? Math.round(previewPrice * nights * 0.18) : 0;
  const totalPreview = nights && previewPrice ? previewPrice * nights + taxes : 0;

  return (
    <div className="hd-page">
      {/* Header */}
      <header className="hd-head container">
        <div className="hd-head-row">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="hd-meta-cat" style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {category}
              </span>
              {hotel.starRating && (
                <span style={{ fontSize: '13px', color: '#eab308', fontWeight: 700 }}>
                  {'★'.repeat(hotel.starRating)} {hotel.starRating}-Star Luxury Property
                </span>
              )}
            </div>
            <h1 className="hd-name" style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '36px', fontWeight: 700 }}>{name}</h1>
            <div className="hd-meta">
              <span className="hd-meta-rating">
                <FiStar size={14} fill="currentColor" />
                <strong>{rating ? Number(rating).toFixed(1) : 'New'}</strong>
                {numReviews ? <span>({numReviews} reviews)</span> : null}
              </span>
              <span className="hd-meta-dot" />
              <span className="hd-meta-loc">
                <FiMapPin size={14} /> {address?.street ? `${address.street}, ` : ''}{address?.city}{address?.state ? `, ${address.state}` : ''}, {address?.country}
              </span>
            </div>
          </div>
          <div className="hd-head-actions">
            <button className="hd-icon-btn" onClick={handleShare} aria-label="Share">
              <FiShare2 size={16} />
              <span>Share</span>
            </button>
            <button
              className={`hd-icon-btn ${wished ? 'is-on' : ''}`}
              onClick={toggleWish}
              aria-label={wished ? 'Remove from wishlist' : 'Save'}
            >
              <FiHeart size={16} fill={wished ? 'currentColor' : 'none'} />
              <span>{wished ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Gallery Section */}
      <section className="hd-gallery container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`hd-gallery-filter-btn ${galleryFilter === 'all' ? 'active' : ''}`}
              onClick={() => setGalleryFilter('all')}
              style={{ padding: '7px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, border: '1px solid var(--border)', background: galleryFilter === 'all' ? 'var(--primary)' : 'var(--bg-card)', color: galleryFilter === 'all' ? '#fff' : 'var(--text-primary)', cursor: 'pointer' }}
            >
              All Photos ({allGalleryImages.length})
            </button>
            {propertyImages.length > 0 && (
              <button
                className={`hd-gallery-filter-btn ${galleryFilter === 'property' ? 'active' : ''}`}
                onClick={() => setGalleryFilter('property')}
                style={{ padding: '7px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, border: '1px solid var(--border)', background: galleryFilter === 'property' ? 'var(--primary)' : 'var(--bg-card)', color: galleryFilter === 'property' ? '#fff' : 'var(--text-primary)', cursor: 'pointer' }}
              >
                Property ({propertyImages.length})
              </button>
            )}
            {roomImages.length > 0 && (
              <button
                className={`hd-gallery-filter-btn ${galleryFilter === 'rooms' ? 'active' : ''}`}
                onClick={() => setGalleryFilter('rooms')}
                style={{ padding: '7px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, border: '1px solid var(--border)', background: galleryFilter === 'rooms' ? 'var(--primary)' : 'var(--bg-card)', color: galleryFilter === 'rooms' ? '#fff' : 'var(--text-primary)', cursor: 'pointer' }}
              >
                Rooms ({roomImages.length})
              </button>
            )}
          </div>
          <button
            onClick={() => { setGalleryIndex(0); setLightboxOpen(true); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--primary-dark)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <FiMaximize2 size={14} /> Open Full Screen Gallery
          </button>
        </div>

        {filteredGalleryImages.length === 0 ? (
          <div className="hd-gallery-empty">No photos available for this category.</div>
        ) : (
          <div className={`hd-gallery-grid count-${Math.min(filteredGalleryImages.length, 5)}`}>
            <button
              type="button"
              className="hd-gallery-main"
              onClick={() => { setGalleryIndex(0); setLightboxOpen(true); }}
              aria-label="Open photo gallery"
            >
              <ImageLazy src={filteredGalleryImages[0]?.url} alt={name} className="hd-gallery-img" height="100%" />
            </button>
            {filteredGalleryImages.slice(1, 5).map((img, i) => (
              <button
                key={i}
                type="button"
                className="hd-gallery-side"
                onClick={() => { setGalleryIndex(i + 1); setLightboxOpen(true); }}
                aria-label={`Photo ${i + 2}`}
              >
                <ImageLazy src={img.url} alt={`${name} photo ${i + 2}`} className="hd-gallery-img" height="100%" />
                {i === 3 && filteredGalleryImages.length > 5 && (
                  <span className="hd-gallery-more">+{filteredGalleryImages.length - 5} more photos</span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Sticky Navigation Tabs Bar */}
      <nav className="hd-tabs">
        <div className="container hd-tabs-inner">
          {TABS.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className={`hd-tab ${activeTab === t.id ? 'is-active' : ''}`}
              onClick={(e) => { e.preventDefault(); setActiveTab(t.id); document.getElementById(t.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
            >
              {t.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Body Section */}
      <div className="hd-body container">
        <main className="hd-main">
          
          {/* Overview Section - Matched to Screenshot Design */}
          <section id="overview" className="hd-section" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '32px' }}>
            <h2 className="hd-h2" style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '32px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
              About this stay
            </h2>
            
            <p className="hd-desc" style={{ fontSize: '15.5px', lineHeight: 1.75, color: 'var(--text-primary)', opacity: 0.9, marginBottom: '28px', maxWidth: '900px' }}>
              {description}
            </p>

            {/* 4 Summary Metric Cards (Pixel-Perfect Match to Screenshot) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px' }}>
              
              <div style={{
                padding: '20px 24px',
                borderRadius: '16px',
                border: '1px solid rgba(220, 215, 205, 0.7)',
                backgroundColor: 'var(--bg-card)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '96px'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8a94a6', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiHome size={12} /> PROPERTY TYPE
                </span>
                <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                  {category}
                </span>
              </div>

              <div style={{
                padding: '20px 24px',
                borderRadius: '16px',
                border: '1px solid rgba(220, 215, 205, 0.7)',
                backgroundColor: 'var(--bg-card)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '96px'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8a94a6', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiBox size={12} /> AVAILABLE ROOM TYPES
                </span>
                <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {rooms?.length || 0}
                </span>
              </div>

              <div style={{
                padding: '20px 24px',
                borderRadius: '16px',
                border: '1px solid rgba(220, 215, 205, 0.7)',
                backgroundColor: 'var(--bg-card)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '96px'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8a94a6', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiKey size={12} /> TOTAL GUEST ROOMS
                </span>
                <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {totalRooms || 10}
                </span>
              </div>

              <div style={{
                padding: '20px 24px',
                borderRadius: '16px',
                border: '1px solid rgba(220, 215, 205, 0.7)',
                backgroundColor: 'var(--bg-card)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '96px'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8a94a6', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiTag size={12} /> NIGHTLY RATES FROM
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {previewPrice ? formatPrice(previewPrice) : '₹4,500'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#8a94a6', fontWeight: 500 }}>/night</span>
                </div>
              </div>

            </div>
          </section>

          {/* Location & Travel Guide Section (Rich Location-Specific Info) */}
          <section id="location-guide" className="hd-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <FiCompass size={22} color="var(--primary-dark)" />
              <h2 className="hd-h2" style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '26px', margin: 0 }}>
                Location Insights & Travel Guide
              </h2>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Specific altitude, climate, transit access, and top sights for {address?.city || name}
            </p>

            {/* Badges Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
              {locationInsights.badges.map((badge, idx) => (
                <span key={idx} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12.5px', fontWeight: 600, backgroundColor: 'rgba(99, 102, 241, 0.08)', color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.18)' }}>
                  {badge}
                </span>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {/* Climate & Altitude Card */}
              <div style={{ padding: '20px', borderRadius: '14px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-dark)', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                  <FiSun size={16} /> Elevation & Climate
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {locationInsights.altitude}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  {locationInsights.climate}
                </div>
                <div style={{ fontSize: '12px', background: 'var(--bg-input)', padding: '8px 12px', borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 500 }}>
                  <strong>Best Season:</strong> {locationInsights.bestSeason}
                </div>
              </div>

              {/* Transit & Access Card */}
              <div style={{ padding: '20px', borderRadius: '14px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-dark)', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                  <FiNavigation size={16} /> Transit & Airport Access
                </div>
                <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: 1.6, fontWeight: 500 }}>
                  {locationInsights.transitInfo}
                </div>
              </div>
            </div>

            {/* Nearby Sights Grid */}
            <div style={{ marginTop: '20px', padding: '20px', borderRadius: '14px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                📍 Top Nearby Landmarks & Distances
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {locationInsights.nearbySights.map((sight, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-light)', fontSize: '13px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sight.name}</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-dark)', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px' }}>
                      {sight.dist}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location Travel Tip Box */}
            <div style={{ marginTop: '16px', padding: '16px 20px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', color: 'var(--text-primary)', fontSize: '13px', lineHeight: 1.6, display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>💡</span>
              <div>
                <strong>Concierge Travel Tip for {address?.city || name}:</strong> {locationInsights.travelTip}
              </div>
            </div>
          </section>

          {/* Rooms & Suites Section */}
          <section id="rooms" className="hd-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2 className="hd-h2" style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '28px', margin: 0 }}>
                  Available Rooms & Tents
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Choose your preferred accommodations for this stay</p>
              </div>
              <span className="hd-meta-cat" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                {rooms?.length || 0} published option{(rooms?.length || 0) === 1 ? '' : 's'}
              </span>
            </div>

            {(rooms || []).length === 0 ? (
              <div className="hd-empty">No rooms have been published for this property yet.</div>
            ) : (
              <div className="hd-rooms" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {rooms.map((room) => {
                  const subtotal = nights ? room.pricePerNight * nights : 0;
                  const roomImg = room.images?.[0]?.url || allGalleryImages[0]?.url;
                  return (
                    <article key={room._id} className="hd-room" style={{ border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', backgroundColor: 'var(--bg-card)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                      <div className="hd-room-media" style={{ position: 'relative', minHeight: '220px' }}>
                        <ImageLazy
                          src={roomImg}
                          alt={room.title}
                          className="hd-room-img"
                          height="100%"
                        />
                        <span className="hd-room-type" style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>
                          {room.roomType}
                        </span>
                        {room.images?.length > 1 && (
                          <span style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                            📷 {room.images.length} photos
                          </span>
                        )}
                      </div>
                      <div className="hd-room-body" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                          <h3 className="hd-room-title" style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '20px', fontWeight: 700, margin: 0 }}>{room.title}</h3>
                          {room.discount > 0 && (
                            <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '3px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>
                              {room.discount}% OFF SPECIAL
                            </span>
                          )}
                        </div>
                        <p className="hd-room-desc" style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>{room.description || 'Equipped with wooden floors, heating, and mountain views.'}</p>
                        
                        <ul className="hd-room-specs" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: 0, margin: '0 0 16px 0', listStyle: 'none' }}>
                          <li style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', background: 'var(--bg-input)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                            <FiUsers size={14} color="var(--primary-dark)" /> <strong>Up to {room.maxGuests} guests</strong>
                          </li>
                          {room.bedType && (
                            <li style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', background: 'var(--bg-input)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', textTransform: 'capitalize' }}>
                              <FiCheck size={14} color="var(--primary-dark)" /> {room.bedType} Bed
                            </li>
                          )}
                          {room.size && (
                            <li style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', background: 'var(--bg-input)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                              <FiMaximize2 size={14} color="var(--primary-dark)" /> {room.size} sq ft
                            </li>
                          )}
                          <li style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', background: 'var(--bg-input)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                            <FiCheck size={14} color="#10b981" /> {room.totalRooms} available
                          </li>
                        </ul>

                        {((room.amenities && room.amenities.length > 0) || (room.features && room.features.length > 0)) && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                            {[...(room.amenities || []), ...(room.features || [])].slice(0, 6).map((feat, idx) => (
                              <span key={idx} style={{ fontSize: '11px', background: 'rgba(99, 102, 241, 0.08)', color: '#6366f1', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                                ✓ {feat}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="hd-room-foot" style={{ padding: '16px 20px', background: 'var(--bg-input)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                        <div className="hd-room-price">
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                            <span className="hd-room-price-value" style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '24px', fontWeight: 700 }}>{formatPrice(room.pricePerNight)}</span>
                            <span className="hd-room-price-unit" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>/ night</span>
                          </div>
                          {subtotal > 0 && (
                            <span className="hd-room-price-sub" style={{ fontSize: '12px', color: 'var(--primary-dark)', fontWeight: 600, display: 'block', marginTop: '2px' }}>
                              {formatPrice(subtotal)} total for {nights} night{nights === 1 ? '' : 's'}
                            </span>
                          )}
                        </div>
                        <button className="hd-room-cta" onClick={() => handleReserve(room._id)} style={{ padding: '10px 20px', borderRadius: '8px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          Reserve Room <FiArrowRight size={14} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Contact Details & Location Section */}
          <section id="contact-location" className="hd-section">
            <h2 className="hd-h2" style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '28px' }}>Contact & Location Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '16px' }}>
              
              {/* Host Contact Card */}
              <div style={{ padding: '24px', border: '1px solid var(--border)', borderRadius: '16px', backgroundColor: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={owner?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(owner?.name || name)}&background=6366f1&color=fff`}
                    alt={owner?.name || 'Host'}
                    style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 700 }}>Hosted By</span>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '2px 0 0 0', color: 'var(--text-primary)' }}>{owner?.name || 'Property Manager'}</h4>
                    <span style={{ fontSize: '12px', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <FiAward size={12} /> Verified Property Host
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
                  {owner?.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: 'var(--text-primary)' }}>
                      <FiMail size={16} color="var(--primary-dark)" />
                      <span>{owner.email}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: 'var(--text-primary)' }}>
                    <FiPhone size={16} color="var(--primary-dark)" />
                    <span>{owner?.phone || '+91 (800) 123-4567'}</span>
                  </div>
                </div>
              </div>

              {/* Location & GPS Card */}
              <div style={{ padding: '24px', border: '1px solid var(--border)', borderRadius: '16px', backgroundColor: 'var(--bg-card)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 700 }}>Property Address</span>
                  <div style={{ marginTop: '8px', fontSize: '14.5px', lineHeight: 1.6, color: 'var(--text-primary)', fontWeight: 500 }}>
                    📍 {address?.street ? `${address.street}, ` : ''}{address?.city}, {address?.state} {address?.zipCode ? `- ${address.zipCode}` : ''}, {address?.country}
                  </div>
                </div>

                {hotel.location?.coordinates && (
                  <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>GPS Map Coordinates</span>
                    <div style={{ fontWeight: 600, fontSize: '13.5px', marginTop: '4px', color: 'var(--text-primary)', marginBottom: '12px' }}>
                      {hotel.location.coordinates[1]}° N, {hotel.location.coordinates[0]}° E
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${hotel.location.coordinates[1]},${hotel.location.coordinates[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="google-maps-link"
                      style={{
                        color: '#fff',
                        backgroundColor: '#6366f1',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        fontSize: '13px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      Open in Google Maps <FiArrowRight size={14} />
                    </a>
                  </div>
                )}
              </div>

            </div>
          </section>

          {/* Amenities Section */}
          <section id="amenities" className="hd-section">
            <h2 className="hd-h2" style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '28px' }}>Amenities & Services</h2>
            {amenities.length === 0 ? (
              <div className="hd-empty">Amenities haven't been listed yet.</div>
            ) : (
              <div className="hd-amenities" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '16px' }}>
                {amenities.map((a) => (
                  <div key={a} className="hd-amenity" style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 500 }}>
                    <FiCheck size={16} color="#10b981" /> {a}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* House Rules & Policies Section */}
          <section id="policies" className="hd-section">
            <h2 className="hd-h2" style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '28px' }}>House Rules & Policies</h2>
            <div className="hd-policies" style={{ marginTop: '16px' }}>
              <div className="hd-policy">
                <div className="hd-policy-icon"><FiClock size={18} /></div>
                <div>
                  <div className="hd-policy-label">Check-in / Check-out Schedule</div>
                  <div className="hd-policy-value">
                    Check-in: {policies?.checkIn || '2:00 PM'} · Check-out: {policies?.checkOut || '11:00 AM'}
                  </div>
                </div>
              </div>
              <div className="hd-policy">
                <div className="hd-policy-icon"><FiShield size={18} /></div>
                <div>
                  <div className="hd-policy-label">Cancellation Policy</div>
                  <div className="hd-policy-value" style={{ textTransform: 'capitalize' }}>
                    {policies?.cancellation || 'moderate'} cancellation policy
                  </div>
                </div>
              </div>
              <div className="hd-policy">
                <div className="hd-policy-icon"><FiUsers size={18} /></div>
                <div>
                  <div className="hd-policy-label">Pets & Smoking Policies</div>
                  <div className="hd-policy-value">
                    {policies?.petsAllowed ? '🐾 Pets allowed' : '🚫 No pets allowed'} · {policies?.smokingAllowed ? '🚬 Smoking permitted in designated areas' : '🚭 Non-smoking property'}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Sidebar */}
        <aside className="hd-side">
          <div id="hd-availability" className="hd-side-card">
            <header className="hd-side-head">
              <span className="cine-eyebrow">Check availability & reserve</span>
              {previewPrice > 0 && (
                <div className="hd-side-price">
                  <strong style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>{formatPrice(previewPrice)}</strong>
                  <span>/ night starting rate</span>
                </div>
              )}
            </header>

            <div className="hd-side-fields">
              <label className="hd-side-field">
                <span>Check in Date</span>
                <DatePicker
                  selected={checkIn}
                  onChange={(d) => setCheckIn(d)}
                  minDate={new Date()}
                  placeholderText="Select date"
                  className="hd-side-input"
                />
              </label>
              <label className="hd-side-field">
                <span>Check out Date</span>
                <DatePicker
                  selected={checkOut}
                  onChange={(d) => setCheckOut(d)}
                  minDate={checkIn || new Date()}
                  placeholderText="Select date"
                  className="hd-side-input"
                />
              </label>
            </div>

            {nights > 0 && previewPrice > 0 ? (
              <div className="hd-side-summary">
                <div><span>{formatPrice(previewPrice)} × {nights} night{nights === 1 ? '' : 's'}</span><strong>{formatPrice(previewPrice * nights)}</strong></div>
                <div><span>Taxes & fees (18% GST)</span><strong>{formatPrice(taxes)}</strong></div>
                <div className="hd-side-total"><span>Total Payable</span><strong>{formatPrice(totalPreview)}</strong></div>
                <button
                  className="hd-side-cta"
                  onClick={() => cheapestRoom && handleReserve(cheapestRoom._id)}
                >
                  Reserve {cheapestRoom?.title || 'a room'} <FiArrowRight size={14} />
                </button>
                <p className="hd-side-note">Instant confirmation · Best rate guarantee</p>
              </div>
            ) : (
              <div className="hd-side-empty">
                Select your check-in and check-out dates above to see total pricing and reserve your room.
              </div>
            )}
          </div>

          <div className="hd-side-policy">
            <strong>Why Book This Stay</strong>
            <p>
              {amenities.slice(0, 4).join(' · ') || 'Handpicked property curated by BookMyStay.'}
            </p>
          </div>
        </aside>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && filteredGalleryImages.length > 0 && (
        <div className="hd-lightbox" role="dialog" aria-modal="true">
          <button className="hd-lightbox-close" onClick={() => setLightboxOpen(false)} aria-label="Close"><FiX size={20} /></button>
          <button
            className="hd-lightbox-nav hd-lightbox-nav--prev"
            onClick={() => setGalleryIndex((i) => (i - 1 + filteredGalleryImages.length) % filteredGalleryImages.length)}
            aria-label="Previous photo"
          >
            <FiChevronLeft size={22} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <img className="hd-lightbox-img" src={filteredGalleryImages[galleryIndex]?.url} alt={`${name} ${galleryIndex + 1}`} />
            {filteredGalleryImages[galleryIndex]?.caption && (
              <div style={{ color: '#fff', marginTop: '8px', fontSize: '14px', fontWeight: 500 }}>
                {filteredGalleryImages[galleryIndex].caption}
              </div>
            )}
          </div>
          <button
            className="hd-lightbox-nav hd-lightbox-nav--next"
            onClick={() => setGalleryIndex((i) => (i + 1) % filteredGalleryImages.length)}
            aria-label="Next photo"
          >
            <FiChevronRight size={22} />
          </button>
          <div className="hd-lightbox-count">{galleryIndex + 1} / {filteredGalleryImages.length}</div>
        </div>
      )}
    </div>
  );
};

export default HotelDetail;
