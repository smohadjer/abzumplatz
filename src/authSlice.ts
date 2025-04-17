import { createSlice } from '@reduxjs/toolkit'

export const authSlice = createSlice({
  name: 'auth',
  initialState: {
    value: false,
    first_name: '',
    last_name: '',
    _id: '',
    club: {
      name: '',
      _id: '',
      start_hour: 0,
      end_hour: 0,
      reservations_limit: 0,
      courts_count: 0
    }
  },
  reducers: {
    login: (state, action) => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the Immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.value = action.payload.value;
      state.first_name = action.payload.first_name;
      state.last_name = action.payload.last_name;
      state._id = action.payload._id;
      state.club = action.payload.club;
    },
    logout: (state, action) => {
      state.value = action.payload.value;
      state.first_name = action.payload.first_name;
    },
  }
})

// Action creators are generated for each case reducer function
export const { login, logout } = authSlice.actions

export default authSlice.reducer
