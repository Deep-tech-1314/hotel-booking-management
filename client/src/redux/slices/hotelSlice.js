import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchHotels = createAsyncThunk('hotels/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const { data } = await api.get(`/hotels?${queryString}`);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch hotels');
  }
});

export const fetchHotelDetails = createAsyncThunk('hotels/fetchDetails', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/hotels/${id}`);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch hotel details');
  }
});

export const fetchFeaturedHotels = createAsyncThunk('hotels/fetchFeatured', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/hotels/featured');
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch featured hotels');
  }
});

const hotelSlice = createSlice({
  name: 'hotels',
  initialState: {
    hotels: [],
    featuredHotels: [],
    hotelDetails: null,
    rooms: [],
    loading: false,
    error: null,
    totalHotels: 0,
    totalPages: 0,
    currentPage: 1,
  },
  reducers: {
    clearHotelDetails: (state) => {
      state.hotelDetails = null;
      state.rooms = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotels.pending, (state) => { state.loading = true; })
      .addCase(fetchHotels.fulfilled, (state, action) => {
        state.loading = false;
        state.hotels = action.payload.hotels;
        state.totalHotels = action.payload.totalHotels;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchHotels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchHotelDetails.pending, (state) => { state.loading = true; })
      .addCase(fetchHotelDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.hotelDetails = action.payload.hotel;
        state.rooms = action.payload.rooms;
      })
      .addCase(fetchHotelDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchFeaturedHotels.fulfilled, (state, action) => {
        state.featuredHotels = action.payload.hotels;
      });
  },
});

export const { clearHotelDetails, clearError } = hotelSlice.actions;
export default hotelSlice.reducer;
