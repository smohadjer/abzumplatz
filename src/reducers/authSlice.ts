import { createSlice } from '@reduxjs/toolkit'

export const authSlice = createSlice({
  name: 'auth',
  initialState: {
    authChecked: false,
    value: false,
    first_name: '',
    last_name: '',
    email: '',
    _id: '',
    club_id: '',
    club_deleted: false,
    role: '',
    status: '',
  },
  reducers: {
    login: (state, action) => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the Immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.authChecked = true;
      state.value = action.payload.value;
      state.first_name = action.payload.first_name;
      state.last_name = action.payload.last_name;
      state.email = action.payload.email;
      state._id = action.payload._id;
      state.club_id = action.payload.club_id ?? '';
      state.club_deleted = action.payload.club_deleted ?? false;
      state.role = action.payload.role;
      state.status = action.payload.status ?? '';
    },
    logout: (state) => {
      state.authChecked = true;
      state.value = false;
      state.first_name = '';
      state.last_name = '';
      state.email = '';
      state._id = '';
      state.club_id = '';
      state.club_deleted = false;
      state.role = '';
      state.status = '';
    },
    setAuthChecked: (state) => {
      state.authChecked = true;
    },
    setClubId: (state, action) => {
      state.club_id = action.payload.club_id;
      state.club_deleted = false;
      if (action.payload.status) {
        state.status = action.payload.status;
      }
    },
    setClubDeleted: (state, action) => {
      state.club_deleted = action.payload.club_deleted;
    }
  }
})

// Action creators are generated for each case reducer function
export const { login, logout, setAuthChecked, setClubId, setClubDeleted } = authSlice.actions

export default authSlice.reducer
