import { createSlice } from '@reduxjs/toolkit';
import { ClubWithBilling } from '../types';

type ClubState = {
  value: ClubWithBilling;
  loaded: boolean;
}

export const clubSlice = createSlice({
  name: 'club',
  initialState: {
    value: {
      _id: '',
      name: '',
      courts: [],
      reservations_limit: null,
      start_hour: 0,
      end_hour: 0,
      timezone: 'Europe/Berlin',
      plan_type: undefined,
    },
    loaded: false
  } as ClubState,
  reducers: {
    fetch: (state, action) => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the Immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.value = action.payload.value;
      state.loaded = action.payload.loaded;
    },
  }
})

// Action creators are generated for each case reducer function
export const { fetch } = clubSlice.actions

export default clubSlice.reducer
