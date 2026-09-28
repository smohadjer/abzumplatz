import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  refreshing: false,
  requestVersion: 0,
};

export const appRefreshSlice = createSlice({
  name: 'appRefresh',
  initialState,
  reducers: {
    start: state => {
      state.refreshing = true;
    },
    finish: state => {
      state.refreshing = false;
    },
    request: state => {
      state.requestVersion += 1;
    },
    reset: () => initialState,
  },
});

export const {start, finish, request, reset} = appRefreshSlice.actions;
export default appRefreshSlice.reducer;
