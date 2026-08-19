import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import Logo from '../common/Logo';

/**
 * AuthLayout — cinematic split-screen used by Login / Register / ForgotPassword.
 *
 * Left 50%: full-bleed Ken Burns image with overlay quote + brand mark.
 *           Rotates through a small set of luxury interiors every 8s.
 * Right 50%: ivory background, centered glass card containing the children.
 *
 * Mobile (< 960px): the image collapses to a slim top banner so the form is
 * always above the fold.
 */
const SCENES = [
  {
    img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1600',
    quote: 'The best view comes after the hardest climb. We just make the room better.',
    attribution: 'BookMyStay · Field notes',
  },
  {
    img: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=1600',
    quote: 'A great room is a quiet room with one perfect window.',
    attribution: 'BookMyStay · Field notes',
  },
  {
    img: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&q=80&w=1600',
    quote: 'Travel light. Land somewhere worth unpacking for.',
    attribution: 'BookMyStay · Field notes',
  },
];

const AuthLayout = ({ children, eyebrow, title, sub, footer }) => {
  const [sceneIdx, setSceneIdx] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const id = setInterval(() => {
      setSceneIdx((i) => (i + 1) % SCENES.length);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="auth-shell">
      {/* Left: cinematic image stage */}
      <aside className="auth-stage" aria-hidden="true">
        {SCENES.map((s, i) => (
          <div
            key={i}
            className={`auth-stage-img ${i === sceneIdx ? 'is-active' : ''}`}
            style={{ backgroundImage: `url(${s.img})` }}
          />
        ))}
        <div className="auth-stage-overlay" />
        <div className="auth-stage-chrome">
          <Link to="/" className="auth-stage-brand">
            <FiArrowLeft size={14} />
            <span>Back to BookMyStay</span>
          </Link>
        </div>
        <div className="auth-stage-quote">
          <span className="cine-eyebrow auth-stage-eyebrow">An invitation</span>
          <blockquote className="auth-stage-blockquote" key={sceneIdx}>
            "{SCENES[sceneIdx].quote}"
          </blockquote>
          <cite className="auth-stage-cite">— {SCENES[sceneIdx].attribution}</cite>
          <div className="auth-stage-dots" role="presentation">
            {SCENES.map((_, i) => (
              <span
                key={i}
                className={`auth-stage-dot ${i === sceneIdx ? 'is-active' : ''}`}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* Right: form panel */}
      <main className="auth-panel">
        <div className="auth-card">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <Logo size="lg" variant="mark" color="color" />
          </div>
          {eyebrow && <div className="cine-eyebrow auth-eyebrow">{eyebrow}</div>}
          {title && <h1 className="auth-title">{title}</h1>}
          {sub && <p className="auth-sub">{sub}</p>}
          <div className="auth-body">{children}</div>
          {footer && <div className="auth-foot">{footer}</div>}
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
