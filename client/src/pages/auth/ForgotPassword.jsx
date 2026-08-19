import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiMail } from 'react-icons/fi';
import AuthLayout from '../../components/layout/AuthLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      // Server returns 200 with message even on unknown email for privacy — we mirror that here on any 4xx.
      const status = err.response?.status;
      if (status && status >= 400 && status < 500) {
        setSent(true);
      } else {
        toast.error(err.response?.data?.message || 'Could not send reset email');
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        eyebrow="Check your inbox"
        title={<>Reset link <em>sent.</em></>}
        sub="We've emailed instructions to reset your password. The link is good for 60 minutes."
        footer={<Link to="/login">← Back to sign in</Link>}
      >
        <div className="auth-success">
          <div className="auth-success-mark">
            <FiCheck size={28} strokeWidth={2.5} />
          </div>
          <p style={{
            fontFamily: 'var(--font-body)',
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            lineHeight: 1.55,
            margin: '0 0 24px',
          }}>
            Reset instructions sent to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
            Don't see it? Check your spam folder.
          </p>
          <button
            type="button"
            className="auth-cta"
            onClick={() => { setSent(false); setEmail(''); }}
          >
            Send to a different email
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Reset password"
      title={<>Forgot your <em>password?</em></>}
      sub="Enter the email tied to your account and we'll send instructions to reset it."
      footer={<Link to="/login">← Back to sign in</Link>}
    >
      <form onSubmit={handleSubmit} className="auth-body">
        <div className="auth-field">
          <label htmlFor="fp-email">Email</label>
          <input
            id="fp-email"
            type="email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@hotmail.com"
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        <button type="submit" className="auth-cta" disabled={loading}>
          {loading ? 'Sending…' : (<>Send reset link <FiArrowRight /></>)}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
