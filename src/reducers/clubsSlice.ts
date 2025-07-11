import { createSlice } from '@reduxjs/toolkit';

export const clubsSlice = createSlice({
  name: 'clubs',
  initialState: {
    value: [
      {
        _id: '',
        name: '',
        courts_count: 0,
        reservations_limit: 0,
        start_hour: 0,
        end_hour: 0,
      }
    ]
  },
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
