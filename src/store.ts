import { configureStore } from '@reduxjs/toolkit';
import authReducer from './reducers/authSlice';
import clubsReducer from './reducers/clubsSlice';
import clubReducer from './reducers/clubSlice';
import usersReducer from './reducers/usersSlice';
import reservationsReducer from './reducers/reservationsSlice';
import type { Action, ThunkAction } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    clubs: clubsReducer,
    club: clubReducer,
    users: usersReducer,
    reservations: reservationsReducer,
  }
})

// Infer the type of `store`
export type AppStore = typeof store
export type RootState = ReturnType<AppStore['getState']>
// Infer the `AppDispatch` type from the store itself
export type AppDispatch = AppStore['dispatch']
// Define a reusable type describing thunk functions
export type AppThunk<ThunkReturnType = void> = ThunkAction<
  ThunkReturnType,
  RootState,
  unknown,
  Action
>
