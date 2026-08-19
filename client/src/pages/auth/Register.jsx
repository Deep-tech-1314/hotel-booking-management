import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../../redux/slices/authSlice';
import { FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';
import AuthLayout from '../../components/layout/AuthLayout';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });
  const { name, email, password, confirmPassword, role } = formData;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const setRole = (next) => setFormData((prev) => ({ ...prev, role: next }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    dispatch(registerUser({ name, email, password, role }));
  };

  return (
    <AuthLayout
      eyebrow="Join BookMyStay"
      title={<>Create your <em>account.</em></>}
      sub="Get personalised recommendations, save trip ideas, and book in two taps. List your property if you're hosting."
      footer={
        <>
          Already with us?{' '}
          <Link to={`/login?redirect=${redirect}`}>Sign in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="auth-body">
        <div className="auth-roles">
          <label className={`auth-role ${role === 'user' ? 'is-on' : ''}`}>
            <input
              type="radio"
              name="role"
              value="user"
              checked={role === 'user'}
              onChange={() => setRole('user')}
            />
            <span className="auth-role-name">I'm travelling</span>
            <span className="auth-role-desc">Book stays, save favourites</span>
          </label>
          <label className={`auth-role ${role === 'owner' ? 'is-on' : ''}`}>
            <input
              type="radio"
              name="role"
              value="owner"
              checked={role === 'owner'}
              onChange={() => setRole('owner')}
            />
            <span className="auth-role-name">I'm hosting</span>
            <span className="auth-role-desc">List a property, accept bookings</span>
          </label>
        </div>

        <div className="auth-field">
          <label htmlFor="reg-name">Full name</label>
          <input
            id="reg-name"
            name="name"
            type="text"
            className="auth-input"
            value={name}
            onChange={handleChange}
            placeholder="Maya Chen"
            required
            autoComplete="name"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
            name="email"
            type="email"
            className="auth-input"
            value={email}
            onChange={handleChange}
            placeholder="you@hotmail.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="reg-password">Password</label>
          <div className="auth-password-wrapper">
            <input
              id="reg-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className="auth-input"
              value={password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              minLength={6}
              required
              autoComplete="new-password"
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

        <div className="auth-field">
          <label htmlFor="reg-confirm">Confirm password</label>
          <div className="auth-password-wrapper">
            <input
              id="reg-confirm"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              className="auth-input"
              value={confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              title={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        <button type="submit" className="auth-cta" disabled={loading}>
          {loading ? 'Creating your account…' : (<>Create account <FiArrowRight /></>)}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Register;
