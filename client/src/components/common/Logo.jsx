import React from 'react';

const Logo = ({ variant = 'full', size = 'md', color = 'color', className = '' }) => {
  // Size calculations
  const iconSizes = {
    sm: 20,
    md: 28,
    lg: 40,
  };
  const iconSize = iconSizes[size] || 28;

  const fontSizes = {
    sm: '14px',
    md: '18px',
    lg: '24px',
  };
  const fontSize = fontSizes[size] || '18px';

  // Color mappings
  const isDarkTheme = color === 'dark';
  const isWhiteTheme = color === 'white';

  const archColor = isWhiteTheme ? '#ffffff' : (isDarkTheme ? '#e2e8f0' : '#6366f1');
  const dotColor = isWhiteTheme ? '#ffffff' : (isDarkTheme ? '#94a3b8' : '#f59e0b');
  const bookColor = isWhiteTheme ? '#ffffff' : 'var(--text-primary)';
  const myColor = isWhiteTheme ? 'rgba(255, 255, 255, 0.7)' : 'var(--text-secondary)';
  const stayColor = isWhiteTheme ? '#ffffff' : '#6366f1';

  // SVG Arch Path: a clean geometric arch
  const renderIcon = () => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="logo-mark-svg"
      style={{ flexShrink: 0 }}
    >
      {/* Arch body (doorway arch) */}
      <path
        d="M6 26V14C6 8.47715 10.4772 4 16 4C21.5228 4 26 8.47715 26 14V26C26 27.1046 25.1046 28 24 28H22C20.8954 28 20 27.1046 20 26V16C20 13.7909 18.2091 12 16 12C13.7909 12 12 13.7909 12 16V26C12 27.1046 11.1046 28 10 28H8C6.89543 28 6 27.1046 6 26Z"
        fill={archColor}
      />
      {/* Location pin dot at apex of arch */}
      <circle cx="16" cy="4" r="3.5" fill={dotColor} />
    </svg>
  );

  const renderWordmark = () => (
    <span
      className="logo-wordmark"
      style={{
        fontSize,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        display: 'flex',
        alignItems: 'baseline',
        userSelect: 'none',
      }}
    >
      <span style={{ fontWeight: 800, color: bookColor }}>Book</span>
      <span style={{ fontWeight: 400, color: myColor, margin: '0 1px' }}>My</span>
      <span style={{ fontWeight: 800, color: stayColor }}>Stay</span>
    </span>
  );

  return (
    <div
      className={`logo-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'sm' ? '6px' : '10px',
      }}
    >
      {variant !== 'wordmark' && renderIcon()}
      {variant !== 'mark' && renderWordmark()}
    </div>
  );
};

export default Logo;
