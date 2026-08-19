import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiStar, FiMapPin, FiHeart } from 'react-icons/fi';

const HotelCard = ({ hotel, isWished, onWishToggle, showWishIcon = true }) => {
  const [imgError, setImgError] = useState(false);
  const city = hotel.address?.city || 'India';
  const state = hotel.address?.state || '';
  const firstLetter = city.charAt(0).toUpperCase();

  // Create a pseudo-random gradient based on the city name hash
  const getGradient = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      ['#6366f1', '#a855f7'],
      ['#ec4899', '#f43f5e'],
      ['#10b981', '#06b6d4'],
      ['#f59e0b', '#ef4444'],
      ['#3b82f6', '#1d4ed8']
    ];
    const index = Math.abs(hash) % colors.length;
    return `linear-gradient(135deg, ${colors[index][0]} 0%, ${colors[index][1]} 100%)`;
  };

  const ULTIMATE_FALLBACK = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80';
  const imageSrc = imgError || !hotel.images?.[0]?.url ? ULTIMATE_FALLBACK : hotel.images[0].url;

  return (
    <div className="card hotel-card hover-lift card-shine" style={{ position: 'relative' }}>
      <Link to={`/hotel/${hotel._id}`}>
        <div className="card-img-wrapper hover-img-zoom" style={{ height: '260px', position: 'relative', overflow: 'hidden' }}>
          <img
            src={imageSrc}
            alt={hotel.name}
            className="card-img"
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
          <span
            className="card-badge"
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              zIndex: 5,
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'capitalize',
              letterSpacing: '0.5px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
            }}
          >
            {hotel.category}
          </span>

          {/* Rating Badge Overlay over Hotel Image */}
          <div
            className="hotel-card-rating-badge"
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              zIndex: 5,
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <FiStar fill="#fbbf24" color="#fbbf24" size={13} />
            <span>{hotel.rating ? Number(hotel.rating).toFixed(1) : '4.8'}</span>
            {hotel.numOfReviews || hotel.numReviews ? (
              <span style={{ opacity: 0.85, fontSize: '11px', fontWeight: 500 }}>
                ({hotel.numOfReviews || hotel.numReviews})
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      {showWishIcon && (
        <button
          className={`card-wishlist ${isWished ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onWishToggle?.(hotel._id);
          }}
          aria-label={isWished ? 'Remove from wishlist' : 'Save to wishlist'}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 10,
            background: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: isWished ? '#ef4444' : '#64748b',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'all 0.15s ease'
          }}
        >
          <FiHeart fill={isWished ? '#ef4444' : 'none'} size={18} />
        </button>
      )}

      <div className="hotel-info p-4">
        <Link to={`/hotel/${hotel._id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
          <div className="flex justify-between items-center mb-1">
            <h3 className="hotel-name truncate" style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{hotel.name}</h3>
            <div className="hotel-rating" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 600 }}>
              <FiStar className="star" fill="#f59e0b" color="#f59e0b" size={14} />
              <span className="rating-value">{hotel.rating ? Number(hotel.rating).toFixed(1) : 'New'}</span>
            </div>
          </div>
          <div className="hotel-location mb-2" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <FiMapPin size={14} /> {city}{state ? `, ${state}` : ''}
          </div>
          <div className="hotel-price" style={{ marginTop: '8px' }}>
            <span className="price-amount" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              ₹{(hotel.cheapestPrice || hotel.price || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-sm text-secondary"> / night</span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default HotelCard;
