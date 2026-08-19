import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser } from './redux/slices/authSlice';

// Layout
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Pages
import Home from './pages/public/Home';
import SearchResults from './pages/public/SearchResults';
import HotelDetail from './pages/public/HotelDetail';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import NotFound from './pages/public/NotFound';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import WhyUs from './pages/public/WhyUs';

// User Pages
import Profile from './pages/user/Profile';
import MyBookings from './pages/user/MyBookings';
import Wishlist from './pages/user/Wishlist';
import BookingDetails from './pages/user/BookingDetails';
import MyMessages from './pages/user/MyMessages';
import MyNotifications from './pages/user/MyNotifications';

// Owner Pages

import OwnerDashboard from './pages/owner/OwnerDashboard';
import MyHotels from './pages/owner/MyHotels';
import OwnerHotelForm from './pages/owner/OwnerHotelForm';
import ManageHotelRooms from './pages/owner/ManageHotelRooms';

// Admin Pages
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminHotels from './pages/admin/AdminHotels';
import AdminOwners from './pages/admin/AdminOwners';
import AdminUsers from './pages/admin/AdminUsers';
import AdminBookings from './pages/admin/AdminBookings';
import AdminPayments from './pages/admin/AdminPayments';
import AdminMessages from './pages/admin/AdminMessages';
import AdminSettings from './pages/admin/AdminSettings';

// Grand Owner Pages
import GrandLayout from './components/layout/GrandLayout';
import GrandOverview from './pages/owner/GrandOverview';
import GrandBookings from './pages/owner/GrandBookings';
import GrandRooms from './pages/owner/GrandRooms';
import GrandGuests from './pages/owner/GrandGuests';
import GrandMessages from './pages/owner/GrandMessages';
import GrandReports from './pages/owner/GrandReports';
import GrandPayouts from './pages/owner/GrandPayouts';
import OwnerSettings from './pages/owner/OwnerSettings';
import ScrollToTop from './components/common/ScrollToTop';

// Protected Route wrapper
import BookingCheckout from './pages/booking/BookingCheckout';
import BookingSuccess from './pages/booking/BookingSuccess';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const PublicLayout = ({ children }) => (
  <div className="page-wrapper">
    <Header />
    <main className="main-content">
      {children}
    </main>
    <Footer />
  </div>
);

function App() {
  const dispatch = useDispatch();
  const { theme } = useSelector((state) => state.ui || {});

  // Apply theme to <html> whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme || 'light');
  }, [theme]);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* Owner Routes */}
      <Route path="/grand" element={<ProtectedRoute roles={['owner', 'admin']}><GrandLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<GrandOverview />} />
        <Route path="dashboard" element={<Navigate to="../overview" replace />} />
        <Route path="bookings" element={<GrandBookings />} />
        <Route path="rooms" element={<GrandRooms />} />
        <Route path="guests" element={<GrandGuests />} />
        <Route path="messages" element={<GrandMessages />} />
        <Route path="reports" element={<GrandReports />} />
        <Route path="payouts" element={<GrandPayouts />} />
        <Route path="hotels" element={<MyHotels />} />
        <Route path="hotels/new" element={<OwnerHotelForm />} />
        <Route path="hotels/edit/:id" element={<OwnerHotelForm />} />
        <Route path="hotels/:id/edit" element={<OwnerHotelForm />} />
        <Route path="hotels/:id/rooms" element={<ManageHotelRooms />} />
        <Route path="settings" element={<OwnerSettings />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="hotels" element={<AdminHotels />} />
        <Route path="owners" element={<AdminOwners />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="messages" element={<AdminMessages />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>


      {/* Public / User Routes */}
      <Route path="/*" element={
        <PublicLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/hotels" element={<SearchResults />} />
            <Route path="/hotel/:id" element={<HotelDetail />} />
            <Route path="/hotels/:id" element={<HotelDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/why-us" element={<WhyUs />} />

            {/* Booking Routes */}
            <Route path="/checkout" element={<ProtectedRoute><BookingCheckout /></ProtectedRoute>} />
            <Route path="/booking/success" element={<ProtectedRoute><BookingSuccess /></ProtectedRoute>} />
            <Route path="/booking/success/:bookingId" element={<ProtectedRoute><BookingSuccess /></ProtectedRoute>} />
            <Route path="/payment/success" element={<ProtectedRoute><BookingSuccess /></ProtectedRoute>} />
            <Route path="/booking/:id" element={<ProtectedRoute><BookingDetails /></ProtectedRoute>} />

            {/* User Routes */}
            <Route path="/me" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/me/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
            <Route path="/me/messages" element={<ProtectedRoute><MyMessages /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><MyMessages /></ProtectedRoute>} />
            <Route path="/me/notifications" element={<ProtectedRoute><MyNotifications /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><MyNotifications /></ProtectedRoute>} />
            <Route path="/me/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
            <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />


            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PublicLayout>
      } />
    </Routes>
    </>
  );
}

export default App;
