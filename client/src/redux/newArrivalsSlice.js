import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const BASE = "http://localhost:4002";

async function fetchCatalog(signal) {
  const res = await axios.get(`${BASE}/catalogo`, { signal, validateStatus: () => true });
  let arr = [];
  if (Array.isArray(res.data)) {
    arr = res.data;
  } else if (res.data && typeof res.data === "object") {
    const candidates = [res.data.content, res.data.items, res.data.data, res.data.catalogo];
    for (const c of candidates) {
      if (Array.isArray(c)) {
        arr = c;
        break;
      }
    }
  }
  return Array.isArray(arr) ? arr : [];
}

async function fetchPricePreview(id, signal) {
  const res = await axios.get(`${BASE}/precio/preview`, {
    params: { coleccionableId: id, qty: 1 },
    signal,
    validateStatus: () => true,
  });
  return res.data;
}

async function fetchDetalle(id, signal) {
  const res = await axios.get(`${BASE}/coleccionable/${id}`, { signal, validateStatus: () => true });
  return res.data;
}

async function fetchFirstImageUrl(id, signal) {
  try {
    const res = await axios.get(`${BASE}/coleccionable/${id}/imagenes/0`, {
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
        .map((raw) => {
          const it = raw?.coleccionable ?? raw;
          return {
            id:
              raw?.coleccionableId ??
              raw?.coleccionableID ??
              it?.id ??
              it?._id ??
              it?.coleccionableId ??
              it?.coleccionableID ??
              String(Math.random()),
            nombre: it?.nombre ?? it?.name ?? "Coleccionable",
            descripcion: it?.descripcion ?? it?.description ?? "",
            precio: it?.precio ?? it?.price ?? null,
            precioAnterior: it?.precioAnterior ?? it?.listPrice ?? null,
            imagen: it?.imagen ?? it?.imageUrl ?? it?.image ?? raw?.imagen ?? null,
            lineaId:
              it?.linea_id ??
              it?.lineaId ??
              it?.lineaID ??
              (typeof it?.linea === "object" ? it?.linea?.id : it?.linea) ??
              null,
            marcaId:
              it?.marca_id ??
              it?.marcaId ??
              it?.marcaID ??
              (typeof it?.marca === "object" ? it?.marca?.id : it?.marca) ??
              null,
            stock: raw?.stock ?? it?.stock ?? null,
          };
        })
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
        state.error = action.payload || action.error?.message || "Error al cargar las novedades";
      });
  },
});

export const { clearNewArrivals } = newArrivalsSlice.actions;
export default newArrivalsSlice.reducer;
