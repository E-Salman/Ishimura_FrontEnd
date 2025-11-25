import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const REGISTER_URL = "http://localhost:4002/api/v1/auth/register";

export const registerUser = createAsyncThunk(
  "register/registerUser",
  async (payload, { rejectWithValue }) => {
    const { nombre, apellido, direccion, email, password } = payload || {};

    if (!email || !password || !nombre || !apellido || !direccion) {
      return rejectWithValue("Faltan campos obligatorios");
    }

    try {
      const body = JSON.stringify({
        nombre,
        apellido,
        direccion,
        email,
        password,
        rol: "USER",
      });
      const headers = { "Content-Type": "application/json" };
      const { data } = await axios.post(REGISTER_URL, body, { headers });
      return data;
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.message ||
        "Error al registrarse";
      return rejectWithValue(msg);
    }
  }
);

const registerSlice = createSlice({
  name: "register",
  initialState: {
    loading: false,
    error: null,
    success: false,
    response: null,
  },
  reducers: {
    clearRegisterState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.response = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.response = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.success = true;
        state.response = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload || action.error?.message;
      });
  },
});

export const { clearRegisterState } = registerSlice.actions;
export default registerSlice.reducer;
