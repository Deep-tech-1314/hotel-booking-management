import React, { useEffect, useRef, useState } from 'react';
import { FiUsers, FiGlobe, FiAward, FiHeart, FiStar } from 'react-icons/fi';
import VideoPlayer from '../../components/common/VideoPlayer';
import ImageLazy from '../../components/common/ImageLazy';

const ABOUT_VIDEO = 'https://assets.mixkit.co/videos/preview/mixkit-swimming-pool-in-a-luxury-hotel-153-large.mp4';

const About = () => {
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [allowVideo, setAllowVideo] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const save = navigator.connection?.saveData;
    setAllowVideo(!reduce && !save);
  }, []);

  return (
    <div>
      {/* Cinematic hero with video */}
      <section className="cine-about-hero">
        <div className="cine-about-hero-bg">
          <div className="cine-about-hero-poster" />
          {allowVideo && (
            <video
              ref={videoRef}
              className={`hero-video-bg ${ready ? 'is-ready' : ''}`}
              src={ABOUT_VIDEO}
              autoPlay loop muted playsInline preload="metadata"
              onLoadedData={() => setReady(true)}
              onCanPlay={() => setReady(true)}
            />
          )}
          <div className="cine-about-hero-overlay" />
        </div>
        <div className="container cine-about-hero-content">
          <div className="cine-eyebrow cine-hero-eyebrow">Our story</div>
          <h1 className="cine-hero-title" style={{ maxWidth: 900, margin: '0 auto 24px' }}>
            We curate stays the way <em>you'd recommend them.</em>
          </h1>
          <p className="cine-hero-sub" style={{ marginBottom: 0 }}>
            BookMyStay began with one rule — only list places we'd send a friend.
            Every property is visited, vetted, and chosen for the kind of trip you remember.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="section">
        <div className="container">
          <div className="grid grid-2" style={{ alignItems: 'center', gap: '4rem' }}>
            <div>
              <h2 className="text-3xl font-bold mb-4">Our Story & Mission</h2>
              <p className="text-secondary leading-loose mb-4">
                Founded in 2026, BookMyStay began with a simple but powerful mission: to make luxury travel accessible, transparent, and unforgettable. We noticed that travelers were overwhelmed by cluttered interfaces, hidden fees, and unverified properties, making the process of finding the perfect getaway stressful rather than exciting.
              </p>
              <p className="text-secondary leading-loose mb-4">
                Our founders, a group of passionate globetrotters and tech innovators, set out to build a platform that bridges the gap between premium hospitality and cutting-edge technology. Today, we partner with thousands of premium properties worldwide—from tranquil beachfront villas to vibrant city-center penthouses—to bring you an exclusive collection of stays. 
              </p>
              <p className="text-secondary leading-loose">
                Every hotel on our platform is rigorously vetted by our dedicated travel experts to ensure it meets our uncompromising standards of quality, comfort, and exceptional service. We believe that booking a hotel should be just as relaxing as the vacation itself.
              </p>
            </div>
            <div style={{ minHeight: '400px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', position: 'relative', backgroundColor: '#000' }}>
              <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, backgroundImage: 'url(https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2)', backgroundSize: 'cover', backgroundPosition: 'center', animation: 'kenBurns 20s ease-in-out infinite alternate' }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section bg-secondary">
        <div className="container">
          <h2 className="text-3xl font-bold mb-12 text-center">Our Core Values</h2>
          <div className="grid grid-4">
            <div className="card p-6 text-center border-none">
              <div className="mx-auto flex items-center justify-center bg-primary-glow text-primary mb-4" style={{ width: 64, height: 64, borderRadius: '50%' }}>
                <FiUsers size={24} />
              </div>
              <h3 className="font-bold mb-2">Guest First</h3>
              <p className="text-sm text-secondary">Every decision we make starts with what's best for our travelers.</p>
            </div>
            <div className="card p-6 text-center border-none">
              <div className="mx-auto flex items-center justify-center bg-primary-glow text-primary mb-4" style={{ width: 64, height: 64, borderRadius: '50%' }}>
                <FiGlobe size={24} />
              </div>
              <h3 className="font-bold mb-2">Global Reach</h3>
              <p className="text-sm text-secondary">We connect cultures and communities through seamless travel.</p>
            </div>
            <div className="card p-6 text-center border-none">
              <div className="mx-auto flex items-center justify-center bg-primary-glow text-primary mb-4" style={{ width: 64, height: 64, borderRadius: '50%' }}>
                <FiAward size={24} />
              </div>
              <h3 className="font-bold mb-2">Excellence</h3>
              <p className="text-sm text-secondary">We never compromise on the quality of the properties we list.</p>
            </div>
            <div className="card p-6 text-center border-none">
              <div className="mx-auto flex items-center justify-center bg-primary-glow text-primary mb-4" style={{ width: 64, height: 64, borderRadius: '50%' }}>
                <FiHeart size={24} />
              </div>
              <h3 className="font-bold mb-2">Passion</h3>
              <p className="text-sm text-secondary">We love what we do, and we pour that passion into your trips.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Global Impact Stats */}
      <section className="section">
        <div className="container">
          <div className="card p-8 text-secondary-light text-center border-none relative overflow-hidden" style={{ borderRadius: 'var(--radius-2xl)', backgroundColor: 'var(--primary)' }}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="grid grid-4 position-relative z-10">
              <div>
                <h3 className="text-5xl font-serif text-white mb-2">10K+</h3>
                <p>Premium Properties</p>
              </div>
              <div>
                <h3 className="text-5xl font-serif text-white mb-2">1M+</h3>
                <p>Happy Travelers</p>
              </div>
              <div>
                <h3 className="text-5xl font-serif text-white mb-2">150+</h3>
                <p>Countries</p>
              </div>
              <div>
                <h3 className="text-5xl font-serif text-white mb-2">4.9/5</h3>
                <p>Average Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Our Experts */}
      <section className="section bg-secondary">
        <div className="container">
          <h2 className="text-3xl font-bold mb-12 text-center">Meet Our Leadership Team</h2>
          <div className="grid grid-4 text-center">
            {[
              { name: "Michael Chang", role: "Chief Executive Officer", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200&h=200" },
              { name: "Sarah Jenkins", role: "Head of Curation", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200" },
              { name: "Marcus Thorne", role: "Chief Technology Officer", img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200&h=200" },
              { name: "Elena Rodriguez", role: "VP of Guest Experience", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200&h=200" }
            ].map((member, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '150px', height: '150px', borderRadius: '50%', overflow: 'hidden', border: '4px solid var(--border)', marginBottom: '1rem' }}>
                  <img 
                    src={member.img} 
                    alt={member.name} 
                    className="hover-scale"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <h3 className="font-bold text-lg">{member.name}</h3>
                <p className="text-sm text-secondary">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Overview */}
      <section className="section">
        <div className="container">
          <div className="section-header text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">The BookMyStay Experience</h2>
            <p className="text-secondary max-w-2xl mx-auto">
              Discover how effortless it is to find, book, and enjoy your next luxury destination with our intuitive platform.
            </p>
          </div>
          <div className="max-w-4xl mx-auto" style={{ borderRadius: 'var(--radius-2xl)', overflow: 'hidden', boxShadow: 'var(--shadow-xl)', position: 'relative', paddingBottom: '56.25%', backgroundColor: '#000' }}>
            <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 1, backgroundImage: 'url(https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1600)', backgroundSize: 'cover', backgroundPosition: 'center', animation: 'kenBurns 30s ease-in-out infinite alternate' }}></div>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2 }}></div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 3, textAlign: 'center', width: '100%' }}>
              <h3 className="text-2xl font-serif text-white mb-2">BookMyStay Experience</h3>
              <p className="text-secondary-light">Immerse yourself in luxury</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section bg-secondary">
        <div className="container">
          <h2 className="text-3xl font-bold mb-12 text-center">What Our Travelers Say</h2>
          <div className="grid grid-3">
            {[
              {
                name: "Sarah Jenkins",
                role: "Frequent Traveler",
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
                content: "BookMyStay completely changed how I plan my vacations. The interface is stunning, and I always know I'm getting the best premium properties."
              },
              {
                name: "David Chen",
                role: "Business Executive",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
                content: "I travel for work constantly. The curated list of hotels means I never have to guess about the quality of my stay. Truly exceptional service."
              },
              {
                name: "Elena Rodriguez",
                role: "Travel Blogger",
                avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
                content: "The aesthetic of this app makes browsing for resorts a joy. The integrated maps and detailed amenities help me plan the perfect itineraries for my followers."
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="card card-glass p-8 relative hover-lift border-none shadow-md">
                <div className="text-primary opacity-20 text-6xl absolute top-6 right-6 font-serif">"</div>
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="text-amber" fill="currentColor" />
                  ))}
                </div>
                <p className="text-secondary mb-8 leading-loose relative z-10 italic">
                  {testimonial.content}
                </p>
                <div className="flex items-center gap-4 border-t border-border pt-6">
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--primary)' }}>
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary">{testimonial.name}</h4>
                    <p className="text-xs text-muted">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
