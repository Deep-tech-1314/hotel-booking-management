import React, { useState, useRef, useEffect } from 'react';
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize, FiMinimize } from 'react-icons/fi';

/**
 * VideoPlayer – Custom HTML5 video player with glassmorphism controls.
 * Supports poster, autoplay (muted), loop, and lazy loading.
 */
const VideoPlayer = ({
  src,
  poster,
  className = '',
  autoPlay = false,
  loop = true,
  muted = true,
  playsInline = true,
  showControls = true,
  overlay = null, // Optional React node rendered over video
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  // Lazy load via IntersectionObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(container);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Progress tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener('timeupdate', updateProgress);
    return () => video.removeEventListener('timeupdate', updateProgress);
  }, [isInView]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
      setShowOverlay(false);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  };

  return (
    <div
      ref={containerRef}
      className={`video-player ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--bg-card)',
      }}
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => isPlaying && setShowOverlay(false)}
    >
      {isInView && (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          playsInline={playsInline}
          onClick={togglePlay}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            cursor: 'pointer',
          }}
        />
      )}

      {/* Custom overlay content (title, CTA, etc.) */}
      {overlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '32px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          {overlay}
        </div>
      )}

      {/* Center play button when paused */}
      {!isPlaying && isInView && (
        <button
          onClick={togglePlay}
          className="animate-bounceIn"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(245, 197, 67, 0.9)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 3,
            backdropFilter: 'blur(4px)',
          }}
        >
          <FiPlay size={28} color="#0f1423" style={{ marginLeft: '4px' }} />
        </button>
      )}

      {/* Bottom controls */}
      {showControls && showOverlay && (
        <div
          className="animate-fadeIn"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px 20px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 3,
          }}
        >
          <button
            onClick={togglePlay}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
          </button>

          {/* Progress bar */}
          <div
            onClick={handleSeek}
            style={{
              flex: 1,
              height: '4px',
              background: 'rgba(255,255,255,0.3)',
              borderRadius: '2px',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'var(--primary)',
                borderRadius: '2px',
                transition: 'width 0.1s linear',
              }}
            />
          </div>

          <button
            onClick={toggleMute}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isMuted ? <FiVolumeX size={20} /> : <FiVolume2 size={20} />}
          </button>

          <button
            onClick={toggleFullscreen}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isFullscreen ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
