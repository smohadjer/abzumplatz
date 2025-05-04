import { createSlice } from '@reduxjs/toolkit';

export const usersSlice = createSlice({
  name: 'users',
  initialState: {
    value: [
      {
        first_name: '',
        last_name: '',
        _id: '',
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
export const { fetch } = usersSlice.actions

export default usersSlice.reducer
