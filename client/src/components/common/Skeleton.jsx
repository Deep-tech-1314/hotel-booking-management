import React from 'react';

/**
 * Skeleton – Loading placeholder component
 * Variants: text, image, circle, card, custom
 */
const Skeleton = ({ variant = 'text', width, height, className = '', lines = 3 }) => {
  const baseClass = 'skeleton';

  if (variant === 'text') {
    return (
      <div className={className} style={{ width }}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClass} skeleton-text ${i === lines - 1 ? 'short' : 'long'}`}
            style={{ width: i === lines - 1 ? '60%' : width }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'image') {
    return (
      <div
        className={`${baseClass} skeleton-img ${className}`}
        style={{ width, height }}
      />
    );
  }

  if (variant === 'circle') {
    return (
      <div
        className={`${baseClass} skeleton-circle ${className}`}
        style={{ width, height }}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div className={`skeleton-card ${className}`} style={{ width }}>
        <div className={`${baseClass} skeleton-img`} style={{ height }} />
        <div style={{ padding: '16px' }}>
          <div className={`${baseClass} skeleton-text medium`} />
          <div className={`${baseClass} skeleton-text short`} />
          <div className={`${baseClass} skeleton-text short`} style={{ width: '40%' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={`${baseClass} ${className}`} style={{ width, height }} />
  );
};

/**
 * HotelCardSkeleton – Full hotel card skeleton for loading states
 */
export const HotelCardSkeleton = ({ count = 3 }) => (
  <div className="grid grid-3" style={{ gap: '24px' }}>
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} variant="card" height="200px" />
    ))}
  </div>
);

/**
 * HeroSkeleton – Hero section loading state
 */
export const HeroSkeleton = () => (
  <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="text-center" style={{ maxWidth: '600px', width: '100%' }}>
      <div className="skeleton skeleton-text long" style={{ height: '48px', marginBottom: '16px' }} />
      <div className="skeleton skeleton-text medium" style={{ height: '24px', margin: '0 auto 32px' }} />
      <div className="skeleton" style={{ height: '64px', borderRadius: '999px' }} />
    </div>
  </div>
);

/**
 * DashboardSkeleton – Dashboard stat cards loading
 */
export const DashboardSkeleton = ({ cards = 4 }) => (
  <div className="grid grid-4" style={{ gap: '24px' }}>
    {Array.from({ length: cards }).map((_, i) => (
      <div key={i} className="card p-6">
        <div className="skeleton skeleton-circle" style={{ width: '48px', height: '48px', marginBottom: '16px' }} />
        <div className="skeleton skeleton-text long" style={{ height: '32px', marginBottom: '8px' }} />
        <div className="skeleton skeleton-text short" style={{ height: '16px' }} />
      </div>
    ))}
  </div>
);

/**
 * TableSkeleton – rows of placeholder cells for data tables
 */
export const TableSkeleton = ({ rows = 6, cols = 4 }) => (
  <div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} style={{ display: 'flex', gap: '16px', padding: '14px 0', borderBottom: '1px solid var(--grand-border, var(--border, #eee))' }}>
        {Array.from({ length: cols }).map((_, c) => (
          <div key={c} className="skeleton skeleton-text" style={{ height: '16px', flex: c === 0 ? 2 : 1 }} />
        ))}
      </div>
    ))}
  </div>
);

/**
 * ListSkeleton – stacked rows (avatar + two lines) for activity/booking feeds
 */
export const ListSkeleton = ({ rows = 5 }) => (
  <div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0' }}>
        <div className="skeleton skeleton-circle" style={{ width: '40px', height: '40px', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton skeleton-text" style={{ height: '14px', width: '60%', marginBottom: '6px' }} />
          <div className="skeleton skeleton-text" style={{ height: '12px', width: '40%' }} />
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;
