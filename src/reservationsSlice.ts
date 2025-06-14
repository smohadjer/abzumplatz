import { createSlice } from '@reduxjs/toolkit';

export const reservationsSlice = createSlice({
  name: 'reservations',
  initialState: {
    value: [
      {
        club_id: '',
        user_id: '',
        date: '',
        court_num: '',
        start_time: 0,
        end_time: 0,
        label: '',
        recurring: false,
      }
    ],
    loaded: false
  },
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
export const { fetch } = reservationsSlice.actions

export default reservationsSlice.reducer
