import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const trackHotelView = createAsyncThunk(
  'analytics/trackView',
  async ({ hotelId, sessionId }, { rejectWithValue }) => {
    try {
      await api.post('/analytics/view', { hotelId, sessionId });
      return { hotelId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Tracking failed');
    }
  }
);

export const fetchRecentViews = createAsyncThunk(
  'analytics/fetchRecentViews',
  async ({ sessionId, limit = 8 }, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/analytics/recent', { params: { sessionId, limit } });
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load recent views');
    }
  }
);

export const fetchRecommendations = createAsyncThunk(
  'analytics/fetchRecommendations',
  async ({ sessionId, limit = 6 }, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/analytics/recommendations', { params: { sessionId, limit } });
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load recommendations');
    }
  }
);

export const fetchHotelVideos = createAsyncThunk(
  'analytics/fetchHotelVideos',
  async (hotelId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/hotels/${hotelId}/videos`);
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load videos');
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    recentViews: [],
    recommendations: [],
    hotelVideos: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearAnalyticsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecentViews.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRecentViews.fulfilled, (state, action) => {
        state.loading = false;
        state.recentViews = action.payload;
      })
      .addCase(fetchRecentViews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.recommendations = action.payload;
      })
      .addCase(fetchHotelVideos.fulfilled, (state, action) => {
        state.hotelVideos = action.payload;
      });
  },
});

export const { clearAnalyticsError } = analyticsSlice.actions;
export default analyticsSlice.reducer;
