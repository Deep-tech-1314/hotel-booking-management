import React, { useEffect, useState } from 'react';

/**
 * KenBurnsHero — rotating, crossfading hotel-image background.
 *
 * Renders an absolute-positioned stack of images. The active image gets the
 * `is-active` class (opacity 1); all others fade out. Each image has its own
 * staggered Ken Burns animation so the motion feels alive on every cycle.
 *
 * Reliable replacement for hero <video> when CDN hotlinking is blocked.
 * Honors prefers-reduced-motion (stops rotating, freezes the Ken Burns).
 */
const KenBurnsHero = ({
  images = [],
  intervalMs = 6000,
  className = '',
}) => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % images.length), intervalMs);
    return () => clearInterval(id);
  }, [images.length, intervalMs]);

  if (!images.length) return null;

  return (
    <div className={`kb-stack ${className}`} aria-hidden="true">
      {images.map((src, i) => (
        <div
          key={src + i}
          className={`kb-slide ${i === idx ? 'is-active' : ''}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
    </div>
  );
};

export default KenBurnsHero;
