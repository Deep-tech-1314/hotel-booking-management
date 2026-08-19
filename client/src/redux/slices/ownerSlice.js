import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchOwnerOverview = createAsyncThunk(
  'owner/overview',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/grand/overview');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load overview');
    }
  }
);

export const fetchOwnerBookings = createAsyncThunk(
  'owner/bookings',
  async (params = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams(params).toString();
      const { data } = await api.get(`/grand/bookings${query ? `?${query}` : ''}`);
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load bookings');
    }
  }
);

export const fetchOwnerRooms = createAsyncThunk(
  'owner/rooms',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/grand/rooms');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load rooms');
    }
  }
);

export const fetchOwnerGuests = createAsyncThunk(
  'owner/guests',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/grand/guests');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load guests');
    }
  }
);

export const fetchOwnerReports = createAsyncThunk(
  'owner/reports',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/grand/reports');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load reports');
    }
  }
);

const ownerSlice = createSlice({
  name: 'owner',
  initialState: {
    overview: null,
    bookings: { stats: null, table: [] },
    rooms: { stats: null, rooms: [] },
    guests: { stats: null, vips: [], directory: [] },
    reports: { stats: null, metrics: [], revenueSeries: [], sourceBreakdown: [] },
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOwnerOverview.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchOwnerOverview.fulfilled, (state, action) => { state.loading = false; state.overview = action.payload; })
      .addCase(fetchOwnerOverview.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchOwnerBookings.fulfilled, (state, action) => { state.bookings = action.payload; })
      .addCase(fetchOwnerBookings.rejected, (state, action) => { state.error = action.payload; })
      .addCase(fetchOwnerRooms.fulfilled, (state, action) => { state.rooms = action.payload; })
      .addCase(fetchOwnerRooms.rejected, (state, action) => { state.error = action.payload; })
      .addCase(fetchOwnerGuests.fulfilled, (state, action) => { state.guests = action.payload; })
      .addCase(fetchOwnerGuests.rejected, (state, action) => { state.error = action.payload; })
      .addCase(fetchOwnerReports.fulfilled, (state, action) => { state.reports = action.payload; })
      .addCase(fetchOwnerReports.rejected, (state, action) => { state.error = action.payload; });
  },
});

export const { clearError } = ownerSlice.actions;
export default ownerSlice.reducer;
