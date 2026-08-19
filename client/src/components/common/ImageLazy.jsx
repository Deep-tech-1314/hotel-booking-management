import React, { useState } from 'react';

/**
 * ImageLazy – Native lazy-loading image with blur-up placeholder and fade-in animation.
 * Avoids IntersectionObserver viewport sync delays.
 */
const ImageLazy = ({
  src,
  alt,
  className = '',
  width,
  height,
  placeholderColor = 'var(--bg-card)',
  objectFit = 'cover',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    if (!isError) {
      // First error: switch to fallback and reset loaded state for smooth transition
      setIsError(true);
      setIsLoaded(false);
    } else {
      // Even fallback failed
      setFallbackFailed(true);
    }
  };

  const getGradient = (str = '') => {
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

  const ULTIMATE_FALLBACK = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';

  return (
    <div
      className={`image-lazy-container ${className}`}
      style={{
        position: 'relative',
        width: width || '100%',
        height: height || '100%',
        overflow: 'hidden',
        backgroundColor: placeholderColor,
        borderRadius: 'inherit',
      }}
    >
      {/* Placeholder / Blur layer */}
      {!fallbackFailed && (
        <div
          className="image-lazy-placeholder"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: placeholderColor,
            filter: 'blur(12px)',
            transform: 'scale(1.05)',
            transition: 'opacity 0.5s ease',
            opacity: isLoaded ? 0 : 1,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Gradient fallback when all images fail */}
      {fallbackFailed ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: getGradient(alt || 'hotel'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="18" rx="2" />
            <path d="m2 16 5-5a2.5 2.5 0 0 1 3.5 0l5.5 5.5" />
            <path d="m14 14 1-1a2.5 2.5 0 0 1 3.5 0L22 16" />
            <circle cx="8" cy="9" r="2" />
          </svg>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 500 }}>
            Photo unavailable
          </span>
        </div>
      ) : (
        /* Actual image */
        <img
          src={isError ? ULTIMATE_FALLBACK : src}
          alt={alt}
          loading="lazy"
          {...props}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit,
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'scale(1)' : 'scale(1.05)',
            transition: 'opacity 0.6s ease, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'block',
          }}
        />
      )}

      {/* Optional shimmer while loading */}
      {!isLoaded && !fallbackFailed && (
        <div
          className="skeleton"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

export default ImageLazy;
