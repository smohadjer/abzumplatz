import { createSlice } from '@reduxjs/toolkit';
import { Club } from '../types';

type ClubsState = {
  value: Club[];
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
        plan_type: undefined,
        members_limit: null,
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
  }
})

// Action creators are generated for each case reducer function
export const { fetch } = clubsSlice.actions

export default clubsSlice.reducer
