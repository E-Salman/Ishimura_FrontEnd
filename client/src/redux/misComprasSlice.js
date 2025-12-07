import api from "./axiosClient";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const BASE = "http://localhost:4002";

// Obtiene las compras del usuario autenticado desde /mis-compras
export const fetchMisCompras = createAsyncThunk(
  "misCompras/fetch",
  async (_arg, { getState, rejectWithValue, signal }) => {
    const token = getState().login.token;
    if (!token) return rejectWithValue("No auth token");

    try {
      const res = await api.get(`${BASE}/mis-compras`, {
        signal,
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true,
      });

      if (res.status === 401 || res.status === 403) {
        return rejectWithValue("No autorizado");
      }
      const data = res.data;
      if (Array.isArray(data)) return data;
      const maybeArray =
        data?.items ||
        data?.content ||
        data?.ordenes ||
        data?.orders ||
        data?.lista;
      if (Array.isArray(maybeArray)) return maybeArray;
      if (data && typeof data === "object") {
        const vals = Object.values(data).find((v) => Array.isArray(v));
        if (Array.isArray(vals)) return vals;
      }
      return rejectWithValue("Respuesta inesperada");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Error al cargar compras";
      return rejectWithValue(msg);
    }
  }
);

const initialState = {
  items: [],
  status: "idle", // idle | loading | succeeded | failed
  error: null,
};

const misComprasSlice = createSlice({
  name: "misCompras",
  initialState,
  reducers: {
    clearMisCompras: (state) => {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMisCompras.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMisCompras.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload || [];
      })
      .addCase(fetchMisCompras.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error?.message || "Error al cargar compras";
      });
  },
});

export const { clearMisCompras } = misComprasSlice.actions;
export const selectMisCompras = (state) => state.misCompras.items;
export const selectMisComprasStatus = (state) => state.misCompras.status;
export const selectMisComprasError = (state) => state.misCompras.error;

export default misComprasSlice.reducer;
