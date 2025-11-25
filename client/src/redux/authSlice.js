import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAdminFromToken } from "../lib/api";

const BASE = "http://localhost:4002";

export const requestPasswordReset = createAsyncThunk(
  "auth/requestPasswordReset",
  async ({ email }, { rejectWithValue, signal }) => {
    const res = await axios.post(`${BASE}/auth/forgot-password`, { email }, { signal, validateStatus: () => true });
    if (res.status !== 200 && res.status !== 201) {
      const msg = res?.data?.message || `HTTP ${res.status}`;
      return rejectWithValue(msg);
    }
    return true;
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: null,
    email: null,
    resetStatus: "idle",
    resetError: null,
  },
  reducers: {//cambiar a asincrona, que saque login desde el server
    setLogin: (state, action) => {
      state.token = action.payload.token; //Payload = parametros. Datos que se le mandan al reducer cuando se despacha
      state.email = action.payload.user; //Reducers = funciones dentro del slice que actualizan el estado segun la accion
    },
    logout: (state) => {
      state.token = null;
      state.email = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestPasswordReset.pending, (state) => {
        state.resetStatus = "loading";
        state.resetError = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state) => {
        state.resetStatus = "succeeded";
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.resetStatus = "failed";
        state.resetError = action.payload || action.error.message;
      });
  },
});

export const { setLogin, logout } = authSlice.actions;
export const selectToken = (state) => state.auth.token;
export const selectEmail = (state) => state.auth.email;
export const selectIsAdmin = (state) => isAdminFromToken(state.auth.token);
export const selectResetStatus = (state) => state.auth.resetStatus;
export const selectResetError = (state) => state.auth.resetError;
export default authSlice.reducer;
