import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import hotelReducer from './slices/hotelSlice';
import bookingReducer from './slices/bookingSlice';
import uiReducer from './slices/uiSlice';
import contentReducer from './slices/contentSlice';
import analyticsReducer from './slices/analyticsSlice';
import adminReducer from './slices/adminSlice';
import ownerReducer from './slices/ownerSlice';
import notificationReducer from './slices/notificationSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    hotels: hotelReducer,
    bookings: bookingReducer,
    ui: uiReducer,
    content: contentReducer,
    analytics: analyticsReducer,
    admin: adminReducer,
    owner: ownerReducer,
    notifications: notificationReducer,
  },
});

export default store;
