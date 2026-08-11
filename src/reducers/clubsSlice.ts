import { createSlice } from '@reduxjs/toolkit';
import { ClubWithBilling } from '../types';

type ClubsState = {
  value: ClubWithBilling[];
}

export const clubsSlice = createSlice({
  name: 'clubs',
  initialState: {
    value: [
      {
        _id: '',
        name: '',
        courts: [],
        reservations_limit: null,
        start_hour: 0,
        end_hour: 0,
        timezone: 'Europe/Berlin',
        access_plan_type: 'basic',
        next_plan_type: 'basic',
      }
    ]
  } as ClubsState,
  reducers: {
    fetch: (state, action) => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the Immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.value = action.payload.value;
    },
    upsert: (state, action) => {
      const club = action.payload.value as ClubWithBilling;
      const existingIndex = state.value.findIndex(item => item._id === club._id);

      if (existingIndex >= 0) {
        state.value[existingIndex] = club;
      } else {
        state.value.push(club);
        state.value.sort((a, b) => a.name.localeCompare(b.name, 'de'));
      }
    },
  }
})

// Action creators are generated for each case reducer function
export const { fetch, upsert } = clubsSlice.actions

export default clubsSlice.reducer
