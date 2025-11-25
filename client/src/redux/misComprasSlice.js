import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getUserOrders } from "../lib/api";

export const fetchMisCompras = createAsyncThunk(
  "misCompras/fetch",
  async ({ token, user }, { signal, rejectWithValue }) => {
    if (!token || !user) {
      return rejectWithValue("Iniciá sesión para ver tus compras");
    }
    try {
      const data = await getUserOrders(token, user, signal);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue(
        error?.message ||
          "No se pudieron cargar tus compras. Iniciá sesión nuevamente."
      );
    }
  }
);

const misComprasSlice = createSlice({
  name: "misCompras",
  initialState: {
    items: [],
    status: "idle",
    error: null,
  },
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
        state.items = action.payload ?? [];
      })
      .addCase(fetchMisCompras.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          action.payload ||
          action.error?.message ||
          "Error al cargar las compras";
      });
  },
});

export const { clearMisCompras } = misComprasSlice.actions;
export default misComprasSlice.reducer;
