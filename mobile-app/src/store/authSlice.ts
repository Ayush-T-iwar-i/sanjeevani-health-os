import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  userId: string | null;
  token: string | null;
  role: string | null;
  language: string;
}

const initialState: AuthState = {
  userId: null,
  token: null,
  role: null,
  language: 'en',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<{ userId: string; token: string; role: string }>) {
      state.userId = action.payload.userId;
      state.token = action.payload.token;
      state.role = action.payload.role;
    },
    setLanguage(state, action: PayloadAction<string>) {
      state.language = action.payload;
    },
    logout(state) {
      state.userId = null;
      state.token = null;
      state.role = null;
    },
  },
});

export const { setSession, setLanguage, logout } = authSlice.actions;
export default authSlice.reducer;
