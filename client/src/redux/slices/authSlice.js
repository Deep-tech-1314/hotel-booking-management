import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async Thunks
export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    if (data.accessToken) {
      localStorage.setItem('token', data.accessToken);
    }
    return data;
  } catch (error) {
    // Don't set error state for network errors - api.js interceptor handles the toast
    if (!error.response) {
      return rejectWithValue('');
    }
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', userData);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Registration failed');
  }
});

export const loadUser = createAsyncThunk('auth/loadUser', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to load user');
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await api.post('/auth/logout');
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (profileData, { rejectWithValue }) => {
  try {
    const { data } = await api.put('/auth/me/update', profileData);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Update failed');
  }
});

export const changePassword = createAsyncThunk('auth/changePassword', async (passwordData, { rejectWithValue }) => {
  try {
    const { data } = await api.put('/auth/me/password', passwordData);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Password update failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Load User
      .addCase(loadUser.pending, (state) => { state.loading = true; })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(loadUser.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      })
      // Update Profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
      })
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
