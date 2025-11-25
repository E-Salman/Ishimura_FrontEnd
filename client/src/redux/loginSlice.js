import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// Login al backend
export const authLogin = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    const URL = "http://localhost:4002/api/v1/auth/authenticate";
    if (!email || !password) {
      return rejectWithValue("Email y contraseña son obligatorios");
    }
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify({ email, password });
    const { data } = await axios.post(URL, body, { headers });
    return data;
  }
);

const initialState = {
  role: null,
  token: null,
  loading: false,
  error: null,
  kaomojiCount: 0,
  email: null,
};

const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    setLogin: (state, action) => {
      const { token, role, email } = action.payload || {};
      state.token = token || null;
      state.role = role || null;
      state.email = email || null;
      state.error = null;
      state.kaomojiCount = 0;
    },
    logout: (state) => {
      state.token = null;
      state.role = null;
      state.email = null;
      state.error = null;
      state.kaomojiCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(authLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(authLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const payload = action.payload || {};
        const data = payload?.data || payload;
        state.role = data?.role || null;
        state.token = data?.access_token || data?.token || null;
        state.email = action.meta?.arg?.email || null;
        state.kaomojiCount = 0;
      })
      .addCase(authLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
        state.kaomojiCount = state.kaomojiCount + 1;
      });
  },
});

export const { setLogin, logout } = loginSlice.actions;
export default loginSlice.reducer;
