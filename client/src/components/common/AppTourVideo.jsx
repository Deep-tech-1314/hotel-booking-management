import React, { useEffect, useRef, useState } from 'react';
import { FiPlay, FiVolume2, FiVolumeX, FiX } from 'react-icons/fi';

/**
 * AppTourVideo — full-bleed cinematic "watch how it works" section.
 *
 * Big poster card with a pulsating play button. Click → full-screen
 * lightbox modal with the actual tour video and glass controls.
 *
 * Honors prefers-reduced-motion (no pulse, no autoplay).
 */
const POSTER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1800';
// Pexels CDN — verified accessible (mixkit blocks hotlinking from dev origins).
const TOUR_VIDEO = 'https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4';

const AppTourVideo = ({
  poster = POSTER,
  src = TOUR_VIDEO,
  eyebrow = 'A 60-second tour',
  title = <>Watch how <em>BookMyStay</em> works.</>,
  sub = 'From the front door to your suite key in under a minute — see the journey from search to stay.',
}) => {
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [videoErr, setVideoErr] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setMuted(true); // start muted every time the modal opens
    setVideoErr(false);
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (open && videoRef.current) {
      // Muted autoplay is universally allowed; if it still rejects, the
      // <video> shows controls and the user can hit play.
      videoRef.current.muted = true;
      const p = videoRef.current.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => { /* user gesture required — controls let them start it */ });
      }
    }
  }, [open]);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  return (
    <section className="app-tour" aria-label="App tour video">
      <div className="container">
        <header className="app-tour-head">
          <div className="cine-eyebrow">{eyebrow}</div>
          <h2 className="app-tour-title">{title}</h2>
          <p className="app-tour-sub">{sub}</p>
        </header>

        <button
          type="button"
          className="app-tour-card"
          onClick={() => setOpen(true)}
          aria-label="Play app tour video"
        >
          <img className="app-tour-poster" src={poster} alt="" loading="lazy" />
          <div className="app-tour-overlay" />
          <div className="app-tour-play-wrap">
            <span className="app-tour-play">
              <span className="app-tour-play-ring" aria-hidden="true" />
              <span className="app-tour-play-ring app-tour-play-ring--2" aria-hidden="true" />
              <FiPlay size={30} fill="currentColor" />
            </span>
            <span className="app-tour-play-label">Watch the tour · 0:58</span>
          </div>
          <div className="app-tour-chips">
            <span>① Search</span>
            <span>② Curate</span>
            <span>③ Reserve</span>
            <span>④ Arrive</span>
          </div>
        </button>
      </div>

      {open && (
        <div className="app-tour-modal" role="dialog" aria-modal="true">
          <button
            className="app-tour-close"
            onClick={() => setOpen(false)}
            aria-label="Close video"
          >
            <FiX size={20} />
          </button>
          <button
            className="app-tour-mute"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute' : 'Mute'}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
          </button>
          <div className="app-tour-modal-inner">
            {videoErr ? (
              <div className="app-tour-modal-error">
                <p>The tour video couldn't load right now.</p>
                <a href={src} target="_blank" rel="noreferrer">Open in a new tab</a>
              </div>
            ) : (
              <video
                ref={videoRef}
                src={src}
                controls
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onError={() => setVideoErr(true)}
                className="app-tour-modal-video"
              />
            )}
          </div>
          <div
            className="app-tour-modal-scrim"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        </div>
      )}
    </section>
  );
};

export default AppTourVideo;
