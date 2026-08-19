import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchHomeContent = createAsyncThunk(
  'content/fetchHomeContent',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/content/home');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load content');
    }
  }
);

export const subscribeNewsletter = createAsyncThunk(
  'content/subscribeNewsletter',
  async ({ email, name }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/newsletter/subscribe', { email, name, source: 'website_footer' });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Subscription failed');
    }
  }
);

// ── Admin CMS thunks ──────────────────────────────────────────────────────

export const fetchAllContent = createAsyncThunk(
  'content/fetchAllContent',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/content');
      return data.data; // array of blocks
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load content blocks');
    }
  }
);

export const upsertContentBlock = createAsyncThunk(
  'content/upsertContentBlock',
  async (block, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/content', block);
      return data.data; // saved block
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save content block');
    }
  }
);

export const seedContent = createAsyncThunk(
  'content/seedContent',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/content/seed');
      return data.data; // seeded blocks
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to seed content');
    }
  }
);

const contentSlice = createSlice({
  name: 'content',
  initialState: {
    homeContent: {},
    loading: false,
    error: null,
    newsletterSuccess: false,
    // Admin CMS
    blocks: [],
    blocksLoading: false,
    saving: false,
  },
  reducers: {
    clearContentError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHomeContent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHomeContent.fulfilled, (state, action) => {
        state.loading = false;
        state.homeContent = action.payload;
      })
      .addCase(fetchHomeContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(subscribeNewsletter.pending, (state) => {
        state.newsletterSuccess = false;
      })
      .addCase(subscribeNewsletter.fulfilled, (state) => {
        state.newsletterSuccess = true;
      })
      .addCase(subscribeNewsletter.rejected, (state, action) => {
        state.error = action.payload;
      })
      // ── Admin CMS ──
      .addCase(fetchAllContent.pending, (state) => {
        state.blocksLoading = true;
        state.error = null;
      })
      .addCase(fetchAllContent.fulfilled, (state, action) => {
        state.blocksLoading = false;
        state.blocks = action.payload;
      })
      .addCase(fetchAllContent.rejected, (state, action) => {
        state.blocksLoading = false;
        state.error = action.payload;
      })
      .addCase(upsertContentBlock.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(upsertContentBlock.fulfilled, (state, action) => {
        state.saving = false;
        const saved = action.payload;
        const idx = state.blocks.findIndex((b) => b.section === saved.section);
        if (idx >= 0) state.blocks[idx] = saved;
        else state.blocks.push(saved);
      })
      .addCase(upsertContentBlock.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(seedContent.fulfilled, (state, action) => {
        state.blocks = action.payload;
      })
      .addCase(seedContent.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearContentError } = contentSlice.actions;
export default contentSlice.reducer;
