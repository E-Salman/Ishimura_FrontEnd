// src/redux/loginSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "./axiosClient";

export const authLogin = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    const URL = "http://localhost:4002/api/v1/auth/authenticate";

      const headers = {
        "Content-Type": "application/json",
      };
      const body = JSON.stringify({ email, password });
      const { data } = await api.post(URL, body, { headers });
      return data;
    }  
      
);

const loginSlice = createSlice({
  name: "login",
  initialState: {
    role: null,
    token: null,
    email: null,
    loading: false,
    error: null,
    kaomojiCount: 0,
  },
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
        state.role = action.payload.role;
        state.token = action.payload.access_token;
        state.email = action.meta.arg.email;
        state.kaomojiCount = 0;
      })
      .addCase(authLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error desconocido";
        state.kaomojiCount += 1;
      });
  },
});

export default loginSlice.reducer;
export const { setLogin, logout } = loginSlice.actions;
