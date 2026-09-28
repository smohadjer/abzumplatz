import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '../types';

type AdminNotificationsState = {
  items: Notification[];
  loaded: boolean;
  loading: boolean;
  clubId: string;
  lastUpdatedAt: string;
};

const initialState: AdminNotificationsState = {
  items: [],
  loaded: false,
  loading: false,
  clubId: '',
  lastUpdatedAt: '',
};

export const adminNotificationsSlice = createSlice({
  name: 'adminNotifications',
  initialState,
  reducers: {
    fetchStart: (state, action: PayloadAction<string>) => {
      if (state.clubId !== action.payload) {
        state.items = [];
        state.loaded = false;
        state.clubId = action.payload;
      }
      state.loading = true;
    },
    fetchSuccess: (state, action: PayloadAction<{items: Notification[]; clubId: string}>) => {
      state.items = action.payload.items;
      state.loaded = true;
      state.loading = false;
      state.clubId = action.payload.clubId;
      state.lastUpdatedAt = new Date().toISOString();
    },
    fetchFailure: state => {
      state.loading = false;
    },
    add: (state, action: PayloadAction<{item: Notification; clubId: string}>) => {
      if (!state.loaded || state.clubId !== action.payload.clubId) return;
      state.items.unshift(action.payload.item);
      state.lastUpdatedAt = new Date().toISOString();
    },
    reset: () => initialState,
  },
});

export const {fetchStart, fetchSuccess, fetchFailure, add, reset} = adminNotificationsSlice.actions;
export default adminNotificationsSlice.reducer;
