import { createSlice } from '@reduxjs/toolkit'

export const authSlice = createSlice({
  name: 'auth',
  initialState: {
    value: false,
    first_name: '',
    last_name: '',
    email: '',
    _id: '',
    club_id: '',
    role: '',
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
      state.email = action.payload.email;
      state._id = action.payload._id;
      state.club_id = action.payload.club_id;
      state.role = action.payload.role;
    },
    logout: (state) => {
      state.value = false;
      state.first_name = '';
      state.last_name = '';
      state.email = '';
      state._id = '';
      state.club_id = '';
      state.role = '';
    },
    setClubId: (state, action) => {
      state.club_id = action.payload.club_id
    }
  }
})

// Action creators are generated for each case reducer function
export const { login, logout, setClubId } = authSlice.actions

export default authSlice.reducer
