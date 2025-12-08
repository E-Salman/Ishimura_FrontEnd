import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "./axiosClient";

const BASE = "http://localhost:4002";
const ORDERS_URL = `${BASE}/admin/compras`;

export const fetchAdminOrders = createAsyncThunk(
  "adminOrders/fetchAll",
  async (_, { rejectWithValue, getState }) => {
    const state = getState();
    const authToken = state.login?.token;

    if (!authToken) {
      return rejectWithValue("No hay token de autenticación");
    }

    const res = await api.get(ORDERS_URL, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      validateStatus: () => true,
    });

    if (res.status === 401 || res.status === 403) {
      return rejectWithValue(
        "No autorizado. Inicia sesión con una cuenta admin."
      );
    }

    if (res.status !== 200) {
      return rejectWithValue(`Error HTTP ${res.status}`);
    }

    return res.data;
  }
);

const adminOrdersSlice = createSlice({
  name: "adminOrders",
  initialState: {
    items: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminOrders.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          action.payload ||
          action.error.message ||
          "No se pudieron cargar las compras.";
      });
  },
});

export default adminOrdersSlice.reducer;
