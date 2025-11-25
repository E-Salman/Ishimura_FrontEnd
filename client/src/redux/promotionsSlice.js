import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getColeccionables,
  getPricePreview,
  getColeccionableFirstImageUrl,
  getColeccionableDetalle,
} from "../lib/api";

export const fetchPromotions = createAsyncThunk(
  "promotions/fetch",
  async (_, { signal, rejectWithValue }) => {
    const revokedUrls = [];
    try {
      const all = await getColeccionables({}, signal);
      const withPromo = [];

      for (const it of all) {
        try {
          const quote = await getPricePreview(it.id, { qty: 1 }, signal);
          const lista = Number(
            quote?.precioLista ?? quote?.lista ?? it?.precio ?? 0
          );
          const efectivo = Number(
            quote?.precioEfectivo ?? quote?.efectivo ?? it?.precio ?? 0
          );
          const hasPromo =
            Number(quote?.discount ?? 0) > 0 ||
            (efectivo > 0 && lista > 0 && efectivo < lista) ||
            Boolean(quote?.promocionId);
          if (!hasPromo) continue;
          withPromo.push({
            ...it,
            precio: efectivo || it.precio || null,
            precioAnterior:
              lista && efectivo && efectivo < lista
                ? lista
                : it.precioAnterior ?? null,
            _discount:
              Number(
                quote?.discount ?? (lista && efectivo ? lista - efectivo : 0)
              ) || 0,
          });
        } catch (_) {
          // ignorar ítems sin acceso al precio
        }
      }

      const enriched = await Promise.all(
        withPromo.map(async (it) => {
          let acc = it;
          if (acc?.precio == null) {
            try {
              const det = await getColeccionableDetalle(it.id, signal);
              acc = { ...acc, precio: det?.precio ?? acc?.precio ?? null };
            } catch (_) {}
          }
          if (!acc.imagen) {
            try {
              const url = await getColeccionableFirstImageUrl(it.id, signal);
              if (url?.startsWith?.("blob:")) revokedUrls.push(url);
              acc = { ...acc, imagen: url };
            } catch (_) {}
          }
          return acc;
        })
      );

      enriched.sort((a, b) => (b._discount || 0) - (a._discount || 0));

      return { items: enriched, revokedUrls };
    } catch (error) {
      return rejectWithValue(
        error?.message || "No se pudieron cargar las promociones"
      );
    }
  }
);

const promotionsSlice = createSlice({
  name: "promotions",
  initialState: {
    items: [],
    status: "idle",
    error: null,
    revokedUrls: [],
  },
  reducers: {
    clearPromotions: (state) => {
      if (Array.isArray(state.revokedUrls)) {
        state.revokedUrls.forEach((url) => {
          try {
            if (typeof URL !== "undefined" && url?.startsWith?.("blob:")) {
              URL.revokeObjectURL(url);
            }
          } catch (_) {}
        });
      }
      state.items = [];
      state.status = "idle";
      state.error = null;
      state.revokedUrls = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPromotions.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPromotions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload?.items ?? [];
        state.revokedUrls = action.payload?.revokedUrls ?? [];
      })
      .addCase(fetchPromotions.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          action.payload ||
          action.error?.message ||
          "Error al cargar las promociones";
      });
  },
});

export const { clearPromotions } = promotionsSlice.actions;
export default promotionsSlice.reducer;
