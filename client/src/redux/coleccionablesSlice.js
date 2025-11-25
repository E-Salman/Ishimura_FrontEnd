import axios from 'axios';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

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

const initialState = {
  items: [],
  status: 'idle',
  error: null,
  marcas: [],
  lineasByMarca: {},
  detallesById: {},
};

const coleccionablesSlice = createSlice({
  name: 'coleccionables',
  initialState,
  reducers: {
    revokeImagen(state, { payload: { id } }) {
      const det = state.detallesById[id];
      if (det?.imagenUrl) {
        try { URL.revokeObjectURL(det.imagenUrl); } catch (_) {}
        det.imagenUrl = null;
      }
    },
  },
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
        const prev = state.detallesById[action.payload.id];
        if (prev?.imagenUrl && prev.imagenUrl !== action.payload.detalle.imagenUrl) {
          try { URL.revokeObjectURL(prev.imagenUrl); } catch (_) {}
        }
        state.detallesById[action.payload.id] = action.payload.detalle;
      });
  },
});

export const { revokeImagen } = coleccionablesSlice.actions;
export const selectColeccionables = (state) => state.coleccionables.items;
export const selectColeccionablesStatus = (state) => state.coleccionables.status;
export const selectColeccionablesError = (state) => state.coleccionables.error;
export const selectMarcasCat = (state) => state.coleccionables.marcas;
export const selectLineasByMarcaCat = (state, marcaId) => state.coleccionables.lineasByMarca[marcaId] || [];
export const selectDetalleCat = (state, id) => state.coleccionables.detallesById[id];

export default coleccionablesSlice.reducer;
