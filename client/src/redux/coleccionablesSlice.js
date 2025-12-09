import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "./axiosClient";

const BASE = 'http://localhost:4002';
const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : undefined);

export const fetchMarcas = createAsyncThunk(
  'coleccionables/fetchMarcas',
  async (_arg, { signal }) => {
    const res = await api.get(`${BASE}/marcas`, { signal });
    return Array.isArray(res.data) ? res.data : [];
  }
);

export const fetchLineasByMarca = createAsyncThunk(
  'coleccionables/fetchLineasByMarca',
  async ({ marcaId, signal }) => {
    const res = await api.get(`${BASE}/listarColeLineas/lineas/marca/${encodeURIComponent(marcaId)}`, { signal });
    return { marcaId, lineas: Array.isArray(res.data) ? res.data : [] };
  }
);

export const fetchColeccionables = createAsyncThunk(
  'coleccionables/fetchColeccionables',
  async ({ marcaId = null, lineaId = null, token = null } = {}, { signal, rejectWithValue }) => {
    const getMarcaId = (r) =>
      r?.marcaId ?? r?.marca_id ?? r?.marcaID ?? r?.marca?.id ?? (r?.coleccionable ? (r.coleccionable.marcaId ?? r.coleccionable.marca_id ?? r.coleccionable.marca?.id) : null);
    const getLineaId = (r) =>
      r?.lineaId ?? r?.linea_id ?? r?.lineaID ?? r?.linea?.id ?? (r?.coleccionable ? (r.coleccionable.lineaId ?? r.coleccionable.linea_id ?? r.coleccionable.linea?.id) : null);

    const asText = (val) => {
      if (!val) return '';
      if (typeof val === 'string') return val;
      if (typeof val === 'object' && typeof val.message === 'string') return val.message;
      try { return JSON.stringify(val); } catch (_) { return String(val); }
    };

    try {
      const url = `${BASE}/catalogo`;

      const res = await api.get(url, {
        signal,
        headers: authHeaders(token),
        validateStatus: () => true,
      });
      if (res.status !== 200) {
        const msg = asText(res?.data) || `HTTP ${res.status}`;
        return rejectWithValue(msg);
      }
      let rows = Array.isArray(res.data) ? res.data : [];
      // respaldo: filtrar ocultos si vinieran
      rows = rows.filter((r) => {
        const vis = r?.visibilidad;
        return vis === false || vis === 0 ? false : true;
      });

      // Filtro de respaldo por si el backend no lo aplica
      let filtered = rows;
      if (marcaId) {
        filtered = filtered.filter((r) => {
          const m = getMarcaId(r);
          return m == null || String(m) === String(marcaId);
        });
      }
      if (lineaId) {
        filtered = filtered.filter((r) => {
          const l = getLineaId(r);
          return l == null || String(l) === String(lineaId);
        });
      }

      const mapped = filtered.map((c) => {
        const it = c?.coleccionable ?? c;
        const lineaVal = getLineaId(c) ?? getLineaId(it);
        const marcaVal = getMarcaId(c) ?? getMarcaId(it);
        return {
          id: c?.coleccionableId ?? c?.coleccionableID ?? c?.id ?? c?.idColeccionable ?? it?.id ?? it?._id ?? null,
          stock: c?.stock ?? it?.stock ?? 0,
          nombre: it?.nombre ?? null,
          precio: it?.precio ?? null,
          firstImageId: c?.firstImageId ?? c?.firstImageID ?? it?.firstImageId ?? null,
          lineaId: lineaVal ?? null,
          marcaId: marcaVal ?? null,
        };
      }).filter((x) => x.id != null);

      return mapped;
    } catch (e) {
      return rejectWithValue(e?.message || 'No se pudieron cargar los coleccionables');
    }
  }
);

export const fetchDetalle = createAsyncThunk(
  'coleccionables/fetchDetalle',
  async ({ id, token }, { signal }) => {
    const res = await api.get(`${BASE}/coleccionable/${id}`, { signal, headers: undefined });
    const detalle = res.data;
    let imagenUrl = null;
    try {
      const imgRes = await api.get(`${BASE}/coleccionable/${id}/imagenes/0`, {
        signal,
        headers: undefined,
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
    const res = await api.get(
      `${BASE}/precio/preview?coleccionableId=${encodeURIComponent(id)}&qty=${encodeURIComponent(qty)}`,
      { signal }
    );
    return { id, preview: res.data ?? null };
  }
);

export const fetchFirstImage = createAsyncThunk(
  'coleccionables/fetchFirstImage',
  async ({ id, token }, { signal }) => {
    const res = await api.get(`${BASE}/coleccionable/${id}/imagenes/0`, {
      signal,
      headers: undefined,
      responseType: 'blob',
      validateStatus: (s) => s === 200 || s === 404,
    });
    if (res.status === 404) {
      return { id, imagenUrl: null };
    }
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
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchDetalle.fulfilled, (state, action) => {
        const prev = state.detallesById[action.payload.id] || {};
        state.detallesById[action.payload.id] = { ...prev, ...action.payload.detalle };
      })
      .addCase(fetchPricePreview.fulfilled, (state, action) => {
        state.previewsById[action.payload.id] = action.payload.preview;
      })
      .addCase(fetchFirstImage.fulfilled, (state, action) => {
        const current = state.detallesById[action.payload.id] || {};
        state.detallesById[action.payload.id] = { ...current, imagenUrl: action.payload.imagenUrl, firstImageTried: true };
      })
      .addCase(fetchFirstImage.rejected, (state, action) => {
        const id = action.meta?.arg?.id;
        if (id != null) {
          const current = state.detallesById[id] || {};
          state.detallesById[id] = { ...current, imagenUrl: null, firstImageTried: true };
        }
      });
  },
});

export const selectColeccionables = (state) => state.coleccionables.items;
export const selectColeccionablesStatus = (state) => state.coleccionables.status;
export const selectColeccionablesError = (state) => state.coleccionables.error;
export const selectMarcasCat = (state) => state.coleccionables.marcas;
const EMPTY_LINEAS = [];
export const selectLineasByMarcaCat = (state, marcaId) =>
  state.coleccionables.lineasByMarca[marcaId] || EMPTY_LINEAS;
export const selectDetalleCat = (state, id) => state.coleccionables.detallesById[id];
export const selectPreviewById = (state, id) => state.coleccionables.previewsById[id];

export default coleccionablesSlice.reducer;

