import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../redux/slices/authSlice';
import { FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';
import AuthLayout from '../../components/layout/AuthLayout';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, loading, error } = useSelector((s) => s.auth);
  const redirect = new URLSearchParams(location.search).get('redirect') || '/';

  useEffect(() => {
    if (isAuthenticated) navigate(redirect);
  }, [isAuthenticated, navigate, redirect]);

  useEffect(() => {
    if (error && error !== 'Network Error' && !error.includes('Cannot reach')) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title={<>Sign in to <em>continue.</em></>}
      sub="Your saved stays, recent searches, and concierge requests — picked up exactly where you left them."
      footer={
        <>
          Don't have an account yet?{' '}
          <Link to={`/register?redirect=${redirect}`}>Create one</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="auth-body">
        <div className="auth-field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@hotmail.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="login-password">Password</label>
          <div className="auth-password-wrapper">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        <div className="auth-meta-row">
          <label className="auth-checkbox">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>Keep me signed in</span>
          </label>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <button type="submit" className="auth-cta" disabled={loading}>
          {loading ? 'Signing in…' : (<>Sign in <FiArrowRight /></>)}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Login;
