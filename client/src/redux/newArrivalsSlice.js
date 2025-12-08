import api from "./axiosClient";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const BASE = "http://localhost:4002";

async function fetchCatalog(signal) {
  const res = await api.get(`${BASE}/catalogo`, { signal });
  if (!Array.isArray(res.data)) {
    throw new Error("Respuesta de catálogo no es una lista");
  }
  return res.data;
}

async function fetchPricePreview(id, signal) {
  const res = await api.get(`${BASE}/precio/preview`, {
    params: { coleccionableId: id, qty: 1 },
    signal,
    validateStatus: () => true,
  });


  if (!res.data || typeof res.data !== "object") {
    return {};
  }

  return res.data;
}


async function fetchDetalle(id, signal) {
  const res = await api.get(`${BASE}/coleccionable/${id}`, { signal, validateStatus: () => true });
  return res.data;
}

async function fetchFirstImageUrl(id, signal) {
  try {
    const res = await api.get(`${BASE}/coleccionable/${id}/imagenes/0`, {
      signal,
      responseType: "blob",
      validateStatus: (s) => s === 200 || s === 404,
    });
    if (res.status !== 200) return null;
    return URL.createObjectURL(res.data);
  } catch (_) {
    return null;
  }
}

export const fetchNewArrivals = createAsyncThunk(
  "newArrivals/fetch",
  async (_arg, { signal, rejectWithValue }) => {
    const revokedUrls = [];
    try {
      const catalog = await fetchCatalog(signal);
      const baseItems = catalog
        .map((raw) => ({
          id: raw?.coleccionableId ?? raw?.coleccionableID ?? raw?.id,
          nombre: raw?.nombre ?? "Coleccionable",
          descripcion: "",
          precio: raw?.precio ?? null,
          precioAnterior: null,
          imagen: null,
          stock: raw?.stock ?? null,
        }))
        .filter((it) => it.id != null)
        .slice(0, 12);

      const enriched = await Promise.all(
        baseItems.map(async (it) => {
          const acc = { ...it };
          try {
            const preview = await fetchPricePreview(it.id, signal);
            const lista = Number(preview?.precioLista ?? preview?.lista ?? acc?.precio ?? 0);
            const efectivo = Number(preview?.precioEfectivo ?? preview?.efectivo ?? acc?.precio ?? 0);
            const hasPromo =
              Number(preview?.discount ?? 0) > 0 ||
              (efectivo > 0 && lista > 0 && efectivo < lista) ||
              Boolean(preview?.promocionId);
            if (hasPromo) {
              acc.precio = efectivo || acc.precio || null;
              acc.precioAnterior = lista && efectivo && efectivo < lista ? lista : acc.precioAnterior ?? null;
            }
          } catch (_) {}

          if (acc?.precio == null) {
            try {
              const det = await fetchDetalle(it.id, signal);
              acc.precio = det?.precio ?? acc?.precio ?? null;
              if (!acc.descripcion) acc.descripcion = det?.descripcion || "";
            } catch (_) {}
          }

          if (!acc.imagen) {
            try {
              const url = await fetchFirstImageUrl(it.id, signal);
              if (url?.startsWith?.("blob:")) revokedUrls.push(url);
              acc.imagen = url;
            } catch (_) {}
          }

          return acc;
        })
      );

      return { items: enriched, revokedUrls };
    } catch (error) {
      return rejectWithValue(error?.message || "No se pudieron cargar las novedades");
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
        state.error = action.payload || action.error?.message || "Error al cargar las novedades";
      });
  },
});

export const { clearNewArrivals } = newArrivalsSlice.actions;
export default newArrivalsSlice.reducer;
