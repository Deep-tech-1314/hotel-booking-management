import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchAdminStats = createAsyncThunk(
  'admin/stats',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/admin/stats');
      return data.stats;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load stats');
    }
  }
);

export const fetchAdminAnalytics = createAsyncThunk(
  'admin/analytics',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/admin/analytics');
      return data.analytics;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load analytics');
    }
  }
);

export const fetchPendingHotels = createAsyncThunk(
  'admin/pendingHotels',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/admin/hotels/pending');
      return data.hotels;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load pending hotels');
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    stats: null,
    analytics: null,
    pendingHotels: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminStats.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAdminStats.fulfilled, (state, action) => { state.loading = false; state.stats = action.payload; })
      .addCase(fetchAdminStats.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchAdminAnalytics.fulfilled, (state, action) => { state.analytics = action.payload; })
      .addCase(fetchAdminAnalytics.rejected, (state, action) => { state.error = action.payload; })
      .addCase(fetchPendingHotels.fulfilled, (state, action) => { state.pendingHotels = action.payload; });
  },
});

export const { clearError } = adminSlice.actions;
export default adminSlice.reducer;
