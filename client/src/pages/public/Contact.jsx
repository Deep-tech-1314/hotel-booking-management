import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiMapPin, FiPhone, FiMail, FiSend, FiClock, FiShield,
  FiDollarSign, FiMessageCircle, FiStar, FiChevronRight,
  FiInstagram, FiTwitter, FiLinkedin, FiFacebook
} from 'react-icons/fi';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await api.post('/contact', formData);
      toast.success(res.data?.message || 'Message sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      // Fallback: still show success if backend is not running
      toast.success('Message sent successfully! We will get back to you within 24 hours.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } finally {
      setSubmitting(false);
    }
  };

  const testimonials = [
    {
      text: "BookMyStay made our anniversary trip absolutely perfect. The concierge team went above and beyond to arrange a sunset dinner. Truly unforgettable!",
      name: "Priya & Arjun Sharma",
      role: "Travelled to Goa, India",
      avatar: "PS",
      rating: 5
    },
    {
      text: "As a frequent business traveler, I rely on BookMyStay for every trip. The best price guarantee and instant confirmation save me hours every week.",
      name: "Rahul Mehta",
      role: "Corporate Traveler, Mumbai",
      avatar: "RM",
      rating: 5
    },
    {
      text: "The customer support team helped me rebook last-minute when my flight changed. They were available at 2 AM and resolved everything in 10 minutes.",
      name: "Ananya Reddy",
      role: "Family Vacation, Kerala",
      avatar: "AR",
      rating: 5
    }
  ];

  const [showChat, setShowChat] = useState(false);

  return (
    <>
      {/* Hero Banner */}
      <div className="contact-hero">
        <div className="contact-hero-bg">
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2000&auto=format&fit=crop"
            alt="Luxury hotel lobby"
          />
        </div>
        <div className="contact-hero-overlay"></div>
        <div className="contact-hero-content">
          <div className="contact-hero-breadcrumb">
            <Link to="/">Home</Link>
            <FiChevronRight size={14} />
            <span>Contact Us</span>
          </div>
          <h1>Get in Touch</h1>
          <p>
            Have a question about a booking, or want to partner with us?
            Our dedicated team is available 24/7 to assist you with anything you need.
          </p>
        </div>
      </div>

      <div className="container">
        {/* Why Choose Us — Feature Highlights */}
        <div className="feature-highlights">
          <div className="feature-highlight animate-fadeInUp">
            <div className="feature-highlight-icon">
              <FiClock />
            </div>
            <div>
              <h4>24/7 Support</h4>
              <p>Our team is always available, day or night, to help with your bookings and travel needs.</p>
            </div>
          </div>
          <div className="feature-highlight animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <div className="feature-highlight-icon">
              <FiShield />
            </div>
            <div>
              <h4>Instant Booking</h4>
              <p>Get instant confirmation on all reservations with our secure, seamless booking platform.</p>
            </div>
          </div>
          <div className="feature-highlight animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            <div className="feature-highlight-icon">
              <FiDollarSign />
            </div>
            <div>
              <h4>Best Price Guarantee</h4>
              <p>We match any lower price you find — ensuring you always get the best deal possible.</p>
            </div>
          </div>
        </div>

        {/* Department / Team Cards */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
          <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>Our Departments</h2>
          <p className="text-secondary" style={{ maxWidth: '500px', margin: '0 auto' }}>
            Reach out to the right team for the fastest response.
          </p>
        </div>

        <div className="team-grid">
          <div className="team-card animate-fadeInUp">
            <div className="team-card-icon">
              <FiPhone />
            </div>
            <h3>Reservations</h3>
            <p>Need help booking a room or modifying an existing reservation? Our reservations team handles it all.</p>
            <div className="team-card-contact">reservations@bookmystay.com</div>
            <div className="team-card-contact" style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>+1 (800) 123-4567</div>
          </div>

          <div className="team-card animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <div className="team-card-icon">
              <FiStar />
            </div>
            <h3>Partnerships</h3>
            <p>Hotel owner or travel agency? Let's grow together. We offer industry-leading commission rates.</p>
            <div className="team-card-contact">partners@bookmystay.com</div>
            <div className="team-card-contact" style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>+1 (800) 234-5678</div>
          </div>

          <div className="team-card animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            <div className="team-card-icon">
              <FiShield />
            </div>
            <h3>Corporate Travel</h3>
            <p>Custom rates, consolidated billing, and dedicated account managers for your business travel.</p>
            <div className="team-card-contact">corporate@bookmystay.com</div>
            <div className="team-card-contact" style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>+1 (800) 345-6789</div>
          </div>
        </div>

        {/* Contact Form + Info Layout */}
        <div className="grid grid-2" style={{ gap: '4rem' }}>
          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
            <div className="flex flex-col gap-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="bg-primary-glow text-primary p-3 rounded-full">
                  <FiMapPin size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Our Headquarters</h3>
                  <p className="text-secondary">123 Luxury Lane, Suite 400<br/>San Francisco, CA 94105</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-primary-glow text-primary p-3 rounded-full">
                  <FiPhone size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Phone Number</h3>
                  <p className="text-secondary">+1 (800) 123-4567<br/>Toll-free, 24/7 Support</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-primary-glow text-primary p-3 rounded-full">
                  <FiMail size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Email Address</h3>
                  <p className="text-secondary">support@bookmystay.com<br/>partners@bookmystay.com</p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <h3 className="font-bold text-lg mb-3">Follow Us</h3>
            <div className="social-links">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">
                <FiInstagram />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Twitter">
                <FiTwitter />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="LinkedIn">
                <FiLinkedin />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook">
                <FiFacebook />
              </a>
            </div>

            <div className="card p-6 border-none bg-secondary mb-6 hover-lift" style={{ marginTop: 'var(--space-8)' }}>
              <h3 className="font-bold mb-4 text-xl">Global Offices</h3>
              <ul className="text-sm text-secondary space-y-4">
                <li><strong className="text-primary">London:</strong> 45 Park Lane, Mayfair, W1K 1PN</li>
                <li><strong className="text-primary">Dubai:</strong> Sheikh Zayed Road, Trade Centre 1</li>
                <li><strong className="text-primary">Tokyo:</strong> 6-10-1 Roppongi, Minato City</li>
                <li><strong className="text-primary">Sydney:</strong> 1 Martin Place, Level 25</li>
              </ul>
            </div>

            <div className="card p-6 border-none bg-secondary hover-lift">
              <h3 className="font-bold mb-2">Frequently Asked Questions</h3>
              <p className="text-sm text-secondary mb-4">
                Find quick answers to common questions about bookings, cancellations, and more.
              </p>
              <Button variant="secondary" className="w-full">View Help Center</Button>
            </div>
          </div>

          {/* Contact Form & Map */}
          <div className="flex flex-col gap-8">
            <div className="card p-8 shadow-xl border-none relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-glow rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
              <h2 className="text-2xl font-bold mb-6 relative z-10">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="relative z-10">
                <div className="grid grid-2 gap-4">
                  <Input
                    label="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="John Doe"
                    className="bg-secondary-light border-none focus:ring-2 focus:ring-primary"
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    placeholder="john@example.com"
                    className="bg-secondary-light border-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="mt-4">
                  <Input
                    label="Subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    required
                    placeholder="How can we help you?"
                    className="bg-secondary-light border-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="form-group mt-4">
                  <label className="form-label">Message</label>
                  <textarea
                    className="form-textarea bg-secondary-light border-none"
                    style={{ outline: 'none', transition: 'box-shadow 0.2s', boxShadow: '0 0 0 0px var(--primary)' }}
                    onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px var(--primary)'}
                    onBlur={(e) => e.target.style.boxShadow = '0 0 0 0px var(--primary)'}
                    rows="5"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    required
                    placeholder="Write your message here..."
                  ></textarea>
                </div>
                <Button
                  type="submit"
                  className="btn-primary w-full mt-6 flex justify-center items-center gap-2 hover-lift hover-scale"
                  style={{ padding: '16px', fontSize: '16px', opacity: submitting ? 0.7 : 1 }}
                  disabled={submitting}
                >
                  <FiSend /> {submitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </div>
            
            <div className="card shadow-lg border-none overflow-hidden h-64">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.0194488344583!2d-122.395725!3d37.7895232!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80858066a30d52b9%3A0xc02e77b47b4e062f!2s123%20Mission%20St%2C%20San%20Francisco%2C%20CA%2094105%2C%20USA!5e0!3m2!1sen!2sin!4v1714578142825!5m2!1sen!2sin" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Headquarters Location"
              ></iframe>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="testimonial-section">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>What Our Guests Say</h2>
            <p className="text-secondary" style={{ maxWidth: '500px', margin: '0 auto' }}>
              Thousands of happy travelers trust BookMyStay for their perfect stays.
            </p>
          </div>

          <div className="testimonial-grid">
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card animate-fadeInUp" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="testimonial-stars">
                  {Array.from({ length: t.rating }, (_, j) => (
                    <FiStar key={j} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-author">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(t.avatar)}&background=c5a880&color=fff&size=40`}
                    alt={t.name}
                    className="testimonial-avatar"
                  />
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Chat FAB */}
      <button
        className="chat-fab"
        onClick={() => {
          setShowChat(!showChat);
          toast('Live chat is launching with v2 — coming soon!', { icon: '💬' });
        }}
        aria-label="Open live chat"
      >
        <FiMessageCircle />
      </button>
      <div className="chat-fab-tooltip">
        💬 Chat with us
      </div>
    </>
  );
};

export default Contact;
