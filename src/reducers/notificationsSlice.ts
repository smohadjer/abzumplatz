import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '../types';

type NotificationsState = {
  value: Notification[];
  unreadCount: number;
  dismissedCount: number;
  loaded: boolean;
  clubId: string;
  userId: string;
};

const initialState: NotificationsState = {
  value: [],
  unreadCount: 0,
  dismissedCount: 0,
  loaded: false,
  clubId: '',
  userId: '',
};

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    fetch: (state, action: PayloadAction<{value: Notification[]; unreadCount: number; dismissedCount: number; clubId: string; userId: string}>) => {
      state.value = action.payload.value;
      state.unreadCount = action.payload.unreadCount;
      state.dismissedCount = action.payload.dismissedCount;
      state.loaded = true;
      state.clubId = action.payload.clubId;
      state.userId = action.payload.userId;
    },
    markRead: (state, action: PayloadAction<{id: string; readAt: string}>) => {
      const notification = state.value.find(item => item._id === action.payload.id);
      if (notification && !notification.read_at) {
        notification.read_at = action.payload.readAt;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead: (state, action: PayloadAction<string>) => {
      state.value.forEach(notification => {
        if (!notification.read_at) notification.read_at = action.payload;
      });
      state.unreadCount = 0;
    },
    dismiss: (state, action: PayloadAction<string>) => {
      const notification = state.value.find(item => item._id === action.payload);
      if (notification && !notification.read_at) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.value = state.value.filter(item => item._id !== action.payload);
      state.dismissedCount += 1;
    },
    restoreDismissedItem: (state, action: PayloadAction<{notification: Notification; index: number}>) => {
      if (state.value.some(item => item._id === action.payload.notification._id)) return;
      const index = Math.min(Math.max(action.payload.index, 0), state.value.length);
      state.value.splice(index, 0, action.payload.notification);
      if (!action.payload.notification.read_at) state.unreadCount += 1;
      state.dismissedCount = Math.max(0, state.dismissedCount - 1);
    },
    reset: () => initialState,
  },
});

export const {fetch, markRead, markAllRead, dismiss, restoreDismissedItem, reset} = notificationsSlice.actions;
export default notificationsSlice.reducer;
