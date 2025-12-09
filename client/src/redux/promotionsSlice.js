import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getColeccionables,
  getPricePreview,
  getColeccionableFirstImageUrl,
} from "../lib/api";

export const fetchPromotions = createAsyncThunk(
  "promotions/fetch",
  async (_, { signal, rejectWithValue }) => {
    const revokedUrls = [];
    const all = await getColeccionables({}, signal);

    const withPreview = await Promise.all(
      all.map(async (it) => {
        const quote = await getPricePreview(it.id, { qty: 1 }, signal);
        const lista = Number(quote?.precioLista ?? 0);
        const efectivo = Number(quote?.precioEfectivo ?? 0);
        const discount = Number(quote?.discount ?? 0);
        const hasPromo = discount > 0 || Boolean(quote?.promocionId);
        if (!hasPromo) return null;

        const precio = efectivo || it.precio || null;
        const precioAnterior = lista || it.precioAnterior || null;

        return {
          ...it,
          precio,
          precioAnterior,
          _discount: discount || (lista && efectivo ? lista - efectivo : 0),
        };
      })
    );

    const filtered = withPreview.filter(Boolean);

    const enriched = await Promise.all(
      filtered.map(async (it) => {
        if (it?.imagen) return it;
        const url = await getColeccionableFirstImageUrl(it.id, signal);
        if (url?.startsWith?.("blob:")) revokedUrls.push(url);
        return { ...it, imagen: url };

      })
    );

    enriched.sort((a, b) => (b._discount || 0) - (a._discount || 0));

    return { items: enriched, revokedUrls };

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
            if (typeof URL !== "undefined" && url?.startsWith?.("blob:")) {
              URL.revokeObjectURL(url);
            }
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
