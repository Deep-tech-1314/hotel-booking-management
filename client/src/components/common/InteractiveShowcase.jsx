import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiArrowRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';

/**
 * InteractiveShowcase — auto-advancing full-screen carousel.
 *
 * • Auto-advances every 5 s; pauses on hover / focus.
 * • Prev/Next arrows + dot indicators.
 * • Slide counter (01 / 04).
 * • Background crossfades between slides (poster image + video).
 * • Fully keyboard-navigable.
 */
const DEFAULT_VIGNETTES = [
  {
    eyebrow: 'CURATED BY PEOPLE, NOT ALGORITHMS',
    title: 'Every stay is visited, vetted, and recommended by hand.',
    body: 'No paid placement, no fake reviews. The collection is what our concierge would book for themselves.',
    cta: { label: 'Browse the collection', href: '/hotels' },
    poster: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=2000',
  },
  {
    eyebrow: 'SIGNATURE SUITES',
    title: 'Rooms with a story.',
    body: 'Floor-to-ceiling glass, hand-finished joinery, a turndown ritual you remember long after checkout.',
    cta: { label: 'View suites', href: '/hotels?category=resort' },
    poster: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=2000',
  },
  {
    eyebrow: 'WELLNESS & SPA',
    title: 'Quiet rooms. Deliberate rituals.',
    body: 'Thermal pools, hammam circuits, and treatments led by therapists who remember your name.',
    cta: { label: 'Spa retreats', href: '/hotels?category=heritage' },
    poster: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=2000',
  },
  {
    eyebrow: 'DINING',
    title: 'A menu worth flying for.',
    body: 'Chef-driven restaurants and rooftop bars built for the long version of an evening.',
    cta: { label: 'Culinary stays', href: '/hotels?category=boutique' },
    poster: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=2000',
  },
];

const INTERVAL_MS = 5000;

const InteractiveShowcase = ({ vignettes = DEFAULT_VIGNETTES }) => {
  const total = vignettes.length;
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timerRef = useRef(null);
  const progressRef = useRef(null);
  const startTime = useRef(null);

  // Detect reduced-motion once
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const update = () => setReducedMotion(mq.matches);
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  const goTo = useCallback((idx) => {
    setActiveIdx(((idx % total) + total) % total);
    setProgress(0);
    startTime.current = Date.now();
  }, [total]);

  const next = useCallback(() => goTo(activeIdx + 1), [activeIdx, goTo]);
  const prev = useCallback(() => goTo(activeIdx - 1), [activeIdx, goTo]);

  // Auto-advance timer
  useEffect(() => {
    if (paused || reducedMotion) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIdx((i) => (i + 1) % total);
      setProgress(0);
      startTime.current = Date.now();
    }, INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [paused, reducedMotion, total]);

  // Smooth progress bar via rAF
  useEffect(() => {
    if (paused || reducedMotion) return;
    startTime.current = Date.now();
    let raf;
    const tick = () => {
      const elapsed = Date.now() - startTime.current;
      setProgress(Math.min((elapsed / INTERVAL_MS) * 100, 100));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [activeIdx, paused, reducedMotion]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  const current = vignettes[activeIdx];

  const padded = (n) => String(n).padStart(2, '0');

  return (
    <section
      className="showcase-carousel"
      aria-label="Interactive showcase"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Background layers (crossfade) */}
      {vignettes.map((v, idx) => (
        <div
          key={idx}
          className={`showcase-carousel-bg ${idx === activeIdx ? 'is-active' : ''}`}
          style={{ backgroundImage: `url(${v.poster})` }}
        />
      ))}

      {/* Dark gradient overlay */}
      <div className="showcase-carousel-overlay" />

      {/* Slide counter — top right */}
      <div className="showcase-carousel-counter" aria-hidden="true">
        <span className="showcase-carousel-count-current">{padded(activeIdx + 1)}</span>
        <span className="showcase-carousel-count-sep">—</span>
        <span className="showcase-carousel-count-total">{padded(total)}</span>
      </div>

      {/* Prev / Next arrows */}
      <button
        className="showcase-carousel-arrow showcase-carousel-arrow--prev"
        onClick={prev}
        aria-label="Previous slide"
      >
        <FiChevronLeft size={22} />
      </button>
      <button
        className="showcase-carousel-arrow showcase-carousel-arrow--next"
        onClick={next}
        aria-label="Next slide"
      >
        <FiChevronRight size={22} />
      </button>

      {/* Content */}
      <div className="showcase-carousel-content">
        {current.eyebrow && (
          <div className="showcase-carousel-eyebrow">
            <span className="showcase-carousel-eyebrow-line" />
            {current.eyebrow}
          </div>
        )}
        <h2 className="showcase-carousel-title">{current.title}</h2>
        <p className="showcase-carousel-body">{current.body}</p>
        {current.cta && (
          <Link to={current.cta.href} className="showcase-carousel-cta">
            {current.cta.label} <FiArrowRight size={16} />
          </Link>
        )}
      </div>

      {/* Dot indicators + progress — bottom */}
      <div className="showcase-carousel-dots" role="tablist" aria-label="Slides">
        {vignettes.map((_, idx) => (
          <button
            key={idx}
            role="tab"
            aria-selected={idx === activeIdx}
            aria-label={`Go to slide ${idx + 1}`}
            className={`showcase-carousel-dot ${idx === activeIdx ? 'is-active' : ''}`}
            onClick={() => goTo(idx)}
          >
            {/* Progress fill for active dot */}
            {idx === activeIdx && !reducedMotion && (
              <span
                className="showcase-carousel-dot-progress"
                style={{ width: `${progress}%` }}
              />
            )}
          </button>
        ))}
      </div>
    </section>
  );
};

export default InteractiveShowcase;
