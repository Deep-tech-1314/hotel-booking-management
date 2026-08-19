import React, { useEffect, useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const SLIDES = [
  {
    eyebrow: 'Curated by people, not algorithms',
    title: 'Every stay is visited, vetted, and recommended by hand.',
    sub: 'No paid placement, no fake reviews. The collection is what our concierge would book for themselves.',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=2000',
    cta: { label: 'Browse the collection', href: '/hotels' },
  },
  {
    eyebrow: 'India-wide & growing',
    title: 'From Udaipur palaces to Ladakh hideouts — one short list.',
    sub: 'Heritage hotels, wellness retreats, beach villas, mountain lodges. All curated, all confirmed.',
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=2000',
    cta: { label: 'Explore destinations', href: '/hotels' },
  },
  {
    eyebrow: 'Real rates, no surprises',
    title: 'Final price upfront — taxes included, never inflated.',
    sub: 'See the total before you commit. If you find it lower elsewhere within 24 hours, we match it.',
    image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=2000',
    cta: { label: 'Find your stay', href: '/hotels' },
  },
  {
    eyebrow: '24/7 concierge',
    title: 'A real person, one tap away.',
    sub: 'Late check-in, dietary needs, a private boat at sunset — message your concierge before, during, after.',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=2000',
    cta: { label: 'Get started', href: '/register' },
  },
];

const ADVANCE_MS = 6500;

const HomeCarousel = ({ slides = SLIDES }) => {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || paused) return;
    timerRef.current = setTimeout(
      () => setIdx((i) => (i + 1) % slides.length),
      ADVANCE_MS,
    );
    return () => clearTimeout(timerRef.current);
  }, [idx, paused, slides.length]);

  const go = (delta) => {
    setIdx((i) => (i + delta + slides.length) % slides.length);
  };

  const slide = slides[idx];

  return (
    <section className="home-carousel" aria-roledescription="carousel" aria-label="Why BookMyStay">
      <div className="container">
        <header className="home-carousel-head">
          <div className="cine-eyebrow">Why BookMyStay</div>
          <h2 className="home-carousel-h2">
            Premium travel, <em>without the noise.</em>
          </h2>
        </header>

        <div
          className="home-carousel-stage"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          {slides.map((s, i) => (
            <div
              key={i}
              className={`home-carousel-slide ${i === idx ? 'is-active' : ''}`}
              aria-hidden={i !== idx}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}`}
            >
              <img
                className="home-carousel-img"
                src={s.image}
                alt=""
                loading={i === 0 ? 'eager' : 'lazy'}
              />
              <div className="home-carousel-overlay" />
              <div className="home-carousel-caption">
                <div className="cine-eyebrow home-carousel-eyebrow">{s.eyebrow}</div>
                <h3 className="home-carousel-title">{s.title}</h3>
                <p className="home-carousel-sub">{s.sub}</p>
                {s.cta && (
                  <Link to={s.cta.href} className="home-carousel-cta">
                    {s.cta.label} <FiArrowRight />
                  </Link>
                )}
              </div>
            </div>
          ))}

          <button
            type="button"
            className="home-carousel-nav home-carousel-nav--prev"
            onClick={() => go(-1)}
            aria-label="Previous slide"
          >
            <FiChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="home-carousel-nav home-carousel-nav--next"
            onClick={() => go(1)}
            aria-label="Next slide"
          >
            <FiChevronRight size={18} />
          </button>

          <div className="home-carousel-dots" role="tablist" aria-label="Slide selector">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === idx}
                aria-label={`Slide ${i + 1}`}
                className={`home-carousel-dot ${i === idx ? 'is-active' : ''}`}
                onClick={() => setIdx(i)}
              />
            ))}
          </div>

          <div className="home-carousel-count" aria-hidden="true">
            <span>{String(idx + 1).padStart(2, '0')}</span>
            <span className="home-carousel-count-sep" />
            <span>{String(slides.length).padStart(2, '0')}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeCarousel;
