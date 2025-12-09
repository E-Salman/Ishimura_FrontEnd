// src/redux/registerSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "./axiosClient";

const REGISTER_URL = "http://localhost:4002/api/v1/auth/register";

export const registerUser = createAsyncThunk(
  "register/registerUser",
  async ({ nombre, apellido, direccion, email, password }, { rejectWithValue }) => {
    if (!nombre || !apellido || !direccion || !email || !password) {
      return rejectWithValue("Faltan campos obligatorios");
    }

    const body = { nombre, apellido, direccion, email, password, rol: "USER" };
    const headers = { "Content-Type": "application/json" };

    return api
      .post(REGISTER_URL, body, { headers })
      .then(({ data }) => ({
        token: data?.access_token,
        role: data?.rol || "USER",
      }))
      .catch((error) =>
        rejectWithValue(error.response?.data?.message || error.message || "Error en registro")
      );

  }
);

const registerSlice = createSlice({
  name: "register",
  initialState: {
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    clearRegisterState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });
  },
});

export const { clearRegisterState } = registerSlice.actions;
export default registerSlice.reducer;
