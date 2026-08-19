import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
let networkErrorShown = false;
api.interceptors.response.use(
  (response) => {
    networkErrorShown = false; // reset on successful response
    return response;
  },
  async (error) => {
    // Network Error (no response from server)
    if (!error.response && error.request) {
      if (!networkErrorShown) {
        networkErrorShown = true;
        const toast = (await import('react-hot-toast')).default;
        toast.error('Cannot reach the server. Please check your connection.');
        // Reset after 5 seconds to allow showing again if still failing
        setTimeout(() => { networkErrorShown = false; }, 5000);
      }
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    // If 401 and not a retry, and not an auth route, try refreshing
    if (
      error.response?.status === 401 && 
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/refresh') &&
      !originalRequest.url.includes('/auth/logout') &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/register')
    ) {
      originalRequest._retry = true;

      try {
        await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
        return api(originalRequest);
      } catch (refreshError) {
        const store = (await import('../redux/store')).default;
        const { logoutUser } = await import('../redux/slices/authSlice');
        store.dispatch(logoutUser());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

export const createBookingEventSource = () => (
  new EventSource('/api/v1/bookings/stream', { withCredentials: true })
);

export const createAdminEventSource = () => (
  new EventSource('/api/v1/admin/stream', { withCredentials: true })
);
