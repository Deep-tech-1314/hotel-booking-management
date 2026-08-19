import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (params = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams(params).toString();
      const { data } = await api.get(`/notifications${query ? `?${query}` : ''}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load notifications');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/unreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      return data.unread;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load count');
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/notifications/${id}/read`);
      return data.notification;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update');
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await api.patch('/notifications/read-all');
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update');
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/notifications/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete notification');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unread: 0,
    total: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    addNotification: (state, action) => {
      // Prepend to items if loaded
      state.items.unshift(action.payload);
      state.unread += 1;
      state.total += 1;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.notifications;
        state.unread = action.payload.unread;
        state.total = action.payload.total;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unread = action.payload;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const idx = state.items.findIndex((n) => n._id === action.payload?._id);
        if (idx !== -1) state.items[idx] = action.payload;
        state.unread = Math.max(0, state.unread - 1);
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items = state.items.map((n) => ({ ...n, isRead: true }));
        state.unread = 0;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const target = state.items.find((n) => n._id === action.payload);
        if (target && !target.isRead) {
          state.unread = Math.max(0, state.unread - 1);
        }
        state.items = state.items.filter((n) => n._id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      });
  },
});

export const { clearError, addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
