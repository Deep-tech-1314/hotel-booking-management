import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchMyBookings = createAsyncThunk('bookings/fetchMine', async (status = '', { rejectWithValue }) => {
  try {
    const url = status ? `/bookings/me?status=${status}` : '/bookings/me';
    const { data } = await api.get(url);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
  }
});

export const createBooking = createAsyncThunk('bookings/create', async (bookingData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/bookings', bookingData);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create booking');
  }
});

export const cancelBooking = createAsyncThunk('bookings/cancel', async ({ id, reason }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/bookings/${id}/cancel`, { reason });
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to cancel booking');
  }
});

const bookingSlice = createSlice({
  name: 'bookings',
  initialState: {
    bookings: [],
    currentBooking: null,
    loading: false,
    error: null,
  },
  reducers: {
    setCurrentBooking: (state, action) => {
      state.currentBooking = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyBookings.pending, (state) => { state.loading = true; })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload.bookings;
      })
      .addCase(fetchMyBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createBooking.pending, (state) => { state.loading = true; })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload.booking;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        const index = state.bookings.findIndex((b) => b._id === action.payload.booking._id);
        if (index !== -1) state.bookings[index] = action.payload.booking;
      });
  },
});

export const { setCurrentBooking, clearError } = bookingSlice.actions;
export default bookingSlice.reducer;
