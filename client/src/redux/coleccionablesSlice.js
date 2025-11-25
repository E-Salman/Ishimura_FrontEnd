import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getUniqueRandoms = (count, min, max) => {
  const numbers = new Set();
  while (numbers.size < count) {
    numbers.add(randomInt(min, max));
  }
  return Array.from(numbers);
};

export const fetchColeccionablesCarousel = createAsyncThunk("coleccionables/fetchColeccionables", async (_, { rejectWithValue }) => {
    const URLBase = "http://localhost:4002/coleccionable/";
    const randomIds = getUniqueRandoms(5, 1, 22);

    try {
      const results = await Promise.all(
        randomIds.map(async (id) => {
          const coleccionableRes = await axios.get(URLBase + id);
          const imagenRes = await axios.get(URLBase + id + "/imagenes/0", {
            responseType: "blob",
          });

          const imagenBlob = URL.createObjectURL(imagenRes.data);
          return {
            coleccionable: coleccionableRes.data,
            imagen: imagenBlob,
          };
        })
      );

      return results; // array de {coleccionable, imagen}
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const coleccionablesCarouselSlice = createSlice({
  name: "coleccionablesCarousel",
  initialState: {
    items: [], // { coleccionable, imagen }
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchColeccionablesCarousel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchColeccionablesCarousel.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchColeccionablesCarousel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

const BASE = 'http://localhost:4002';
const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : undefined);

export const fetchMarcas = createAsyncThunk(
  'coleccionables/fetchMarcas',
  async (_arg, { signal }) => {
    const res = await axios.get(`${BASE}/marcas`, { signal });
    return Array.isArray(res.data) ? res.data : [];
  }
);

export const fetchLineasByMarca = createAsyncThunk(
  'coleccionables/fetchLineasByMarca',
  async ({ marcaId, signal }) => {
    const res = await axios.get(`${BASE}/listarColeLineas/lineas/marca/${encodeURIComponent(marcaId)}`, { signal });
    return { marcaId, lineas: Array.isArray(res.data) ? res.data : [] };
  }
);

export const fetchColeccionables = createAsyncThunk(
  'coleccionables/fetchColeccionables',
  async ({ marcaId = null, lineaId = null, token } = {}, { signal }) => {
    const res = await axios.get(`${BASE}/catalogo`, { signal, headers: authHeaders(token) });
    const rows = Array.isArray(res.data) ? res.data : [];
    // Si hay filtros, aplicar con detalle
    let filtered = rows;
    if (lineaId) filtered = rows.filter((r) => String(r.lineaId ?? r.linea_id ?? r.lineaID) === String(lineaId));
    else if (marcaId) filtered = rows.filter((r) => String(r.marcaId ?? r.marca_id ?? r.marcaID) === String(marcaId));
    const mapped = filtered.map((c) => ({
      id: c?.coleccionableId ?? c?.coleccionableID ?? c?.id ?? c?.idColeccionable ?? null,
      stock: c?.stock ?? 0,
      nombre: c?.nombre ?? null,
      precio: c?.precio ?? null,
      firstImageId: c?.firstImageId ?? c?.firstImageID ?? null,
    })).filter((x) => x.id != null);
    return mapped;
  }
);

export const fetchDetalle = createAsyncThunk(
  'coleccionables/fetchDetalle',
  async ({ id, token }, { signal }) => {
    const res = await axios.get(`${BASE}/coleccionable/${id}`, { signal, headers: authHeaders(token) });
    const detalle = res.data;
    let imagenUrl = null;
    try {
      const imgRes = await axios.get(`${BASE}/coleccionable/${id}/imagenes/0`, {
        signal,
        headers: authHeaders(token),
        responseType: 'blob',
      });
      imagenUrl = URL.createObjectURL(imgRes.data);
    } catch (_) {}
    return { id, detalle: { ...detalle, imagenUrl } };
  }
);

export const fetchPricePreview = createAsyncThunk(
  'coleccionables/fetchPricePreview',
  async ({ id, qty = 1 }, { signal }) => {
    const res = await axios.get(
      `${BASE}/precio/preview?coleccionableId=${encodeURIComponent(id)}&qty=${encodeURIComponent(qty)}`,
      { signal }
    );
    return { id, preview: res.data ?? null };
  }
);

export const fetchFirstImage = createAsyncThunk(
  'coleccionables/fetchFirstImage',
  async ({ id, token }, { signal }) => {
    const res = await axios.get(`${BASE}/coleccionable/${id}/imagenes/0`, {
      signal,
      headers: authHeaders(token),
      responseType: 'blob',
    });
    const blob = res.data;
    const imagenUrl = URL.createObjectURL(blob);
    return { id, imagenUrl };
  }
);

const initialState = {
  items: [],
  status: 'idle',
  error: null,
  marcas: [],
  lineasByMarca: {},
  detallesById: {},
  previewsById: {},
};

const coleccionablesSlice = createSlice({
  name: 'coleccionables',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarcas.fulfilled, (state, action) => {
        state.marcas = action.payload;
      })
      .addCase(fetchLineasByMarca.fulfilled, (state, action) => {
        state.lineasByMarca[action.payload.marcaId] = action.payload.lineas;
      })
      .addCase(fetchColeccionables.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchColeccionables.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchColeccionables.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchDetalle.fulfilled, (state, action) => {
        state.detallesById[action.payload.id] = action.payload.detalle;
      })
      .addCase(fetchPricePreview.fulfilled, (state, action) => {
        state.previewsById[action.payload.id] = action.payload.preview;
      })
      .addCase(fetchFirstImage.fulfilled, (state, action) => {
        const current = state.detallesById[action.payload.id] || {};
        state.detallesById[action.payload.id] = { ...current, imagenUrl: action.payload.imagenUrl };
      });
  },
});

export const selectColeccionables = (state) => state.coleccionables.items;
export const selectColeccionablesStatus = (state) => state.coleccionables.status;
export const selectColeccionablesError = (state) => state.coleccionables.error;
export const selectMarcasCat = (state) => state.coleccionables.marcas;
export const selectLineasByMarcaCat = (state, marcaId) => state.coleccionables.lineasByMarca[marcaId] || [];
export const selectDetalleCat = (state, id) => state.coleccionables.detallesById[id];
export const selectPreviewById = (state, id) => state.coleccionables.previewsById[id];

export default coleccionablesSlice.reducer;
