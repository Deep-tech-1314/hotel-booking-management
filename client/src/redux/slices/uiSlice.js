import { createSlice } from '@reduxjs/toolkit';

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('theme') || 'light';
  }
  return 'light';
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: getInitialTheme(),
    sidebarOpen: true,
    searchFilters: {
      keyword: '',
      city: '',
      checkIn: '',
      checkOut: '',
      guests: 1,
      category: '',
      minPrice: 0,
      maxPrice: 50000,
      rating: 0,
      amenities: [],
      sort: '-createdAt',
    },
  },
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', state.theme);
        document.documentElement.setAttribute('data-theme', state.theme);
      }
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSearchFilters: (state, action) => {
      state.searchFilters = { ...state.searchFilters, ...action.payload };
    },
    resetSearchFilters: (state) => {
      state.searchFilters = {
        keyword: '', city: '', checkIn: '', checkOut: '',
        guests: 1, category: '', minPrice: 0, maxPrice: 50000,
        rating: 0, amenities: [], sort: '-createdAt',
      };
    },
  },
});

export const { toggleTheme, toggleSidebar, setSearchFilters, resetSearchFilters } = uiSlice.actions;
export default uiSlice.reducer;
