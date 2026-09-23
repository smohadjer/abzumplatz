import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Tournament } from '../types';

type TournamentsState = {
  value: Tournament[];
  loaded: boolean;
  clubId: string;
};

export const tournamentsSlice = createSlice({
  name: 'tournaments',
  initialState: {value: [], loaded: false, clubId: ''} as TournamentsState,
  reducers: {
    fetch: (state, action: PayloadAction<{value: Tournament[]; loaded: boolean; clubId: string}>) => {
      state.value = action.payload.value;
      state.loaded = action.payload.loaded;
      state.clubId = action.payload.clubId;
    },
    upsert: (state, action: PayloadAction<Tournament>) => {
      const index = state.value.findIndex(item => item._id === action.payload._id);
      if (index === -1) state.value.unshift(action.payload);
      else state.value[index] = action.payload;
    },
    remove: (state, action: PayloadAction<string>) => {
      state.value = state.value.filter(item => item._id !== action.payload);
    },
  },
});

export const {fetch, upsert, remove} = tournamentsSlice.actions;
export default tournamentsSlice.reducer;
