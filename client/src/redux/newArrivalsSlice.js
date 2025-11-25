import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getNewArrivals,
  getColeccionableFirstImageUrl,
  getColeccionableDetalle,
  getPricePreview,
} from "../lib/api";

export const fetchNewArrivals = createAsyncThunk(
  "newArrivals/fetch",
  async (_, { signal, rejectWithValue }) => {
    const revokedUrls = [];
    try {
      const arr = await getNewArrivals({ limit: 12 }, signal);
      const enriched = await Promise.all(
        arr.map(async (it) => {
          const acc = { ...it };
          try {
            const preview = await getPricePreview(it.id, { qty: 1 }, signal);
            const lista = Number(
              preview?.precioLista ?? preview?.lista ?? acc?.precio ?? 0
            );
            const efectivo = Number(
              preview?.precioEfectivo ?? preview?.efectivo ?? acc?.precio ?? 0
            );
            const hasPromo =
              Number(preview?.discount ?? 0) > 0 ||
              (efectivo > 0 && lista > 0 && efectivo < lista) ||
              Boolean(preview?.promocionId);
            if (hasPromo) {
              acc.precio = efectivo || acc.precio || null;
              acc.precioAnterior =
                lista && efectivo && efectivo < lista
                  ? lista
                  : acc.precioAnterior ?? null;
            }
          } catch (_) {}

          if (acc?.precio == null) {
            try {
              const det = await getColeccionableDetalle(it.id, signal);
              acc.precio = det?.precio ?? acc?.precio ?? null;
              if (!acc.descripcion) acc.descripcion = det?.descripcion || "";
            } catch (_) {}
          }

          if (!acc.imagen) {
            try {
              const url = await getColeccionableFirstImageUrl(it.id, signal);
              if (url?.startsWith?.("blob:")) revokedUrls.push(url);
              acc.imagen = url;
            } catch (_) {}
          }

          return acc;
        })
      );
      return { items: enriched, revokedUrls };
    } catch (error) {
      return rejectWithValue(
        error?.message || "No se pudieron cargar las novedades"
      );
    }
  }
);

const newArrivalsSlice = createSlice({
  name: "newArrivals",
  initialState: {
    items: [],
    status: "idle",
  error: null,
  revokedUrls: [],
  },
  reducers: {
    clearNewArrivals: (state) => {
      state.items = [];
      state.status = "idle";
      state.error = null;
      state.revokedUrls = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNewArrivals.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchNewArrivals.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload?.items ?? [];
        state.revokedUrls = action.payload?.revokedUrls ?? [];
      })
      .addCase(fetchNewArrivals.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          action.payload ||
          action.error?.message ||
          "Error al cargar las novedades";
      });
  },
});

export const { clearNewArrivals } = newArrivalsSlice.actions;
export default newArrivalsSlice.reducer;
