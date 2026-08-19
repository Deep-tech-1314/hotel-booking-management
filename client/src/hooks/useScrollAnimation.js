import { useEffect, useRef, useState } from 'react';

/**
 * useScrollAnimation
 * Intersection Observer hook for scroll-triggered animations.
 * Usage: add class 'scroll-hidden' and the hook will toggle 'scroll-visible'
 * when the element enters the viewport.
 */
export const useScrollAnimation = (options = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Only unobserve if once=true (default)
          if (options.once !== false) {
            observer.unobserve(element);
          }
        } else if (options.once === false) {
          setIsVisible(false);
        }
      },
      {
        threshold: options.threshold || 0.15,
        rootMargin: options.rootMargin || '0px 0px -40px 0px',
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin, options.once]);

  return { ref, isVisible };
};

/**
 * useParallax
 * Simple parallax effect based on scroll position.
 */
export const useParallax = (speed = 0.5) => {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const scrolled = window.innerHeight - rect.top;
      if (scrolled > 0 && rect.bottom > 0) {
        setOffset(scrolled * speed * 0.1);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return { ref, offset };
};

/**
 * useCountUp
 * Animates a number counting up when its element enters the viewport.
 * - Single effect (no stale-closure on hasStarted dependency).
 * - Detects "already in viewport on mount" so the first paint of the stats
 *   strip animates even if the user lands directly on it.
 * - Supports decimals (e.g. rating 4.9) by detecting `end < 10`.
 */
export const useCountUp = (end, duration = 2000) => {
  const ref = useRef(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let timer = null;
    const isFloat = end < 10 && end % 1 !== 0;

    const startAnimation = () => {
      if (timer) return; // Prevent double trigger
      const startTime = Date.now();
      timer = setInterval(() => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        const value = eased * end;
        setCount(isFloat ? Math.round(value * 10) / 10 : Math.floor(value));
        
        if (progress >= 1) clearInterval(timer);
      }, 16);
    };

    const element = ref.current;
    if (element) {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          startAnimation();
          observer.disconnect();
        }
      }, { threshold: 0.1 });
      
      observer.observe(element);
      
      // Fallback: start animation after 1 second if observer fails
      const fallback = setTimeout(() => {
        startAnimation();
        observer.disconnect();
      }, 1000);

      return () => {
        observer.disconnect();
        clearTimeout(fallback);
        if (timer) clearInterval(timer);
      };
    } else {
      // Start immediately if no element
      startAnimation();
      return () => { if (timer) clearInterval(timer); };
    }
  }, [end, duration]);

  return { ref, count };
};

/**
 * useMouseParallax
 * Subtle parallax based on mouse position for hero sections.
 */
export const useMouseParallax = (intensity = 10) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e) => {
      const rect = element.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * intensity;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * intensity;
      setPosition({ x, y });
    };

    const handleMouseLeave = () => {
      setPosition({ x: 0, y: 0 });
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [intensity]);

  return { ref, position };
};
