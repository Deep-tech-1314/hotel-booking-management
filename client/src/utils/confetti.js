/**
 * Dependency-free confetti burst.
 *
 * Renders a short-lived full-screen canvas, spawns gravity-driven particles,
 * and tears itself down when the animation settles. Designed for one-shot
 * celebratory moments (e.g. BookingSuccess).
 *
 * Accessibility / performance guards (see `prefersCelebration`):
 *   - Suppressed under `prefers-reduced-motion: reduce`.
 *   - Suppressed on data-saver connections (`navigator.connection.saveData`).
 *   - Suppressed on low-end devices (few logical cores or little RAM).
 *
 * Callers can fire unconditionally — the guard runs inside and no-ops when
 * animation is inappropriate.
 */

const ACCENT_COLORS = ['#c5a880', '#e5d5c0', '#8e7355', '#d9aa32', '#fbe08d', '#ffffff'];

/**
 * Whether a celebratory animation should play on this device/session.
 * Exported so callers can also gate non-canvas affordances on the same rule.
 */
export const prefersCelebration = () => {
  if (typeof window === 'undefined') return false;

  // Respect reduced-motion preference.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return false;

  // Respect data-saver mode.
  const conn = navigator.connection || navigator.webkitConnection || navigator.mozConnection;
  if (conn?.saveData) return false;

  // Low-end device heuristics: few cores or little memory.
  if (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 2) {
    return false;
  }
  if (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 2) {
    return false;
  }

  return true;
};

/**
 * Fire a one-shot confetti burst.
 * @param {Object}  [opts]
 * @param {number}  [opts.particleCount=140]  Number of particles.
 * @param {number}  [opts.durationMs=2600]    Lifetime before cleanup.
 * @param {string[]}[opts.colors]             Override the palette.
 * @param {boolean} [opts.force=false]        Bypass the guard (testing only).
 * @returns {() => void} A cancel function that stops and removes the canvas.
 */
export const fireConfetti = (opts = {}) => {
  const {
    particleCount = 140,
    durationMs = 2600,
    colors = ACCENT_COLORS,
    force = false,
  } = opts;

  if (!force && !prefersCelebration()) return () => {};
  if (typeof document === 'undefined') return () => {};

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '9999',
  });
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const resize = () => {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  const W = () => window.innerWidth;
  const H = () => window.innerHeight;

  // Spawn particles from two side-cannons + a center puff, fountain upward.
  const particles = Array.from({ length: particleCount }, (_, i) => {
    const fromLeft = i % 2 === 0;
    const originX = fromLeft ? W() * 0.15 : W() * 0.85;
    const angle = (fromLeft ? -1 : 1) * (Math.PI / 4 + Math.random() * (Math.PI / 6));
    const speed = 9 + Math.random() * 9;
    return {
      x: originX,
      y: H() * 0.55,
      vx: Math.sin(angle) * speed,
      vy: -Math.cos(angle) * speed - Math.random() * 4,
      size: 6 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.3,
      drift: (Math.random() - 0.5) * 0.05,
    };
  });

  const GRAVITY = 0.28;
  const DRAG = 0.992;
  const start = performance.now();
  let raf = 0;
  let cancelled = false;

  const tick = (now) => {
    if (cancelled) return;
    const elapsed = now - start;
    const fade = Math.max(0, 1 - Math.max(0, elapsed - durationMs * 0.6) / (durationMs * 0.4));

    ctx.clearRect(0, 0, W(), H());
    particles.forEach((p) => {
      p.vx = p.vx * DRAG + p.drift;
      p.vy = p.vy * DRAG + GRAVITY;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;

      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });

    if (elapsed < durationMs) {
      raf = requestAnimationFrame(tick);
    } else {
      cleanup();
    }
  };

  const cleanup = () => {
    cancelled = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    canvas.remove();
  };

  raf = requestAnimationFrame(tick);
  return cleanup;
};

export default fireConfetti;
