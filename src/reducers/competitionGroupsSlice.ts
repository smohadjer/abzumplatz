import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CompetitionGroup } from '../types';

type CompetitionGroupsState = {
  value: CompetitionGroup[];
  loaded: boolean;
  clubId: string;
};

export const competitionGroupsSlice = createSlice({
  name: 'competitionGroups',
  initialState: {value: [], loaded: false, clubId: ''} as CompetitionGroupsState,
  reducers: {
    fetch: (state, action: PayloadAction<{value: CompetitionGroup[]; loaded: boolean; clubId: string}>) => {
      state.value = action.payload.value;
      state.loaded = action.payload.loaded;
      state.clubId = action.payload.clubId;
    },
    upsert: (state, action: PayloadAction<CompetitionGroup>) => {
      const index = state.value.findIndex(item => item._id === action.payload._id);
      if (index === -1) state.value.push(action.payload);
      else state.value[index] = action.payload;
      state.value.sort((left, right) => left.name.localeCompare(right.name, 'de'));
    },
    remove: (state, action: PayloadAction<string>) => {
      state.value = state.value.filter(item => item._id !== action.payload);
    },
  },
});

export const {fetch, upsert, remove} = competitionGroupsSlice.actions;
export default competitionGroupsSlice.reducer;
