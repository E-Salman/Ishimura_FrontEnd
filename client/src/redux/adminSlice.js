import axios from 'axios';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { uploadColeccionableImages, uploadMarcaImages } from '../lib/api';

const BASE = 'http://localhost:4002';
const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : undefined);

// Catálogo (id, stock, nombre, precio, firstImageId)
export const fetchCatalogo = createAsyncThunk(
  'admin/fetchCatalogo',
  async ({ token } = {}, { signal }) => {
    const res = await axios.get(`${BASE}/catalogo`, { signal, headers: authHeaders(token) });
    const data = Array.isArray(res.data) ? res.data : [];
    return data.map((c) => ({
      id: c?.coleccionableId ?? c?.coleccionableID ?? c?.id ?? c?.idColeccionable ?? null,
      stock: c?.stock ?? 0,
      nombre: c?.nombre ?? null,
      precio: c?.precio ?? null,
      firstImageId: c?.firstImageId ?? c?.firstImageID ?? null,
    })).filter((x) => x.id != null);
  }
);

// Detalle de coleccionable (sin imagen blob)
export const fetchDetalle = createAsyncThunk(
  'admin/fetchDetalle',
  async ({ id, token }, { signal }) => {
    const headers = authHeaders(token);
    const res = await axios.get(`${BASE}/coleccionable/${id}`, { signal, headers });
    const detalle = res.data;

    // Promos activas para obtener descuento
    let descuento = detalle?.descuento ?? detalle?.discount ?? null;
    try {
      const promoRes = await axios.get(`${BASE}/promociones/activas`, {
        params: { coleccionableId: id },
        signal,
        headers,
      });
      const arr = Array.isArray(promoRes.data) ? promoRes.data : [];
      const found = arr.find((p) => String(p?.scopeType).toUpperCase?.() === 'ITEM' && String(p?.scopeId) === String(id));
      if (found?.valor != null && String(found?.tipo).toUpperCase?.() === 'PERCENT') {
        descuento = found.valor;
      }
    } catch (_) { }

    // Imagen principal
    let imagenUrl = null;
    try {
      const imgRes = await axios.get(`${BASE}/coleccionable/${id}/imagenes/0`, {
        signal,
        headers,
        responseType: 'blob',
      });
      const blob = imgRes.data;
      imagenUrl = URL.createObjectURL(blob);
    } catch (_) { }

    return { id, detalle: { ...detalle, descuento, imagenUrl } };
  }
);

// Marcas
export const fetchMarcas = createAsyncThunk(
  'admin/fetchMarcas',
  async (_arg, { signal }) => {
    const res = await axios.get(`${BASE}/marcas`, { signal });
    return res.data;
  }
);

// Líneas por marca
export const fetchLineasByMarca = createAsyncThunk(
  'admin/fetchLineasByMarca',
  async ({ marcaId, signal }) => {
    const res = await axios.get(`${BASE}/listarColeLineas/lineas/marca/${encodeURIComponent(marcaId)}`, { signal });
    return { marcaId, lineas: res.data };
  }
);

// Crear / borrar marca
export const createMarca = createAsyncThunk(
  'admin/createMarca',
  async ({ nombre, token }, { rejectWithValue }) => {
    const res = await axios.post(`${BASE}/marcas/crear`, { nombre }, { headers: { ...authHeaders(token), 'Content-Type': 'application/json' } });
    return res.data;
  }
);

export const deleteMarca = createAsyncThunk(
  'admin/deleteMarca',
  async ({ id, token }, { rejectWithValue }) => {
    await axios.delete(`${BASE}/marcas/${id}`, { headers: authHeaders(token) });
    return id;
  }
);

// Crear / borrar línea
export const createLinea = createAsyncThunk(
  'admin/createLinea',
  async ({ nombre, marcaId, token }, { rejectWithValue }) => {
    const body = { idMarca: marcaId, nombre };
    const res = await axios.post(`${BASE}/lineas/crear`, body, { headers: { ...authHeaders(token), 'Content-Type': 'application/json' } });
    return res.data;
  }
);

export const deleteLinea = createAsyncThunk(
  'admin/deleteLinea',
  async ({ id, token }, { rejectWithValue }) => {
    await axios.delete(`${BASE}/lineas/${id}`, { headers: authHeaders(token) });
    return id;
  }
);

// Ajuste de stock
export const updateStock = createAsyncThunk(
  'admin/updateStock',
  async ({ id, mode, value, token }, { rejectWithValue }) => {
    let url = null;
    let method = 'post';
    if (mode === 'inc') url = `${BASE}/catalogo/${id}/incrementarstock?cantidad=${encodeURIComponent(value)}`;
    else if (mode === 'dec') url = `${BASE}/catalogo/${id}/decrementarstock?cantidad=${encodeURIComponent(value)}`;
    else if (mode === 'set') { url = `${BASE}/catalogo/${id}/cambiarstock?nuevoStock=${encodeURIComponent(value)}`; method = 'put'; }
    else return rejectWithValue('Modo inválido');

    await axios({ url, method, headers: authHeaders(token) });

    try {
      const one = await axios.get(`${BASE}/catalogo/${id}`, { headers: authHeaders(token) });
      const dto = one.data;
      return { id, stock: dto?.stock ?? dto?.cantidad ?? value };
    } catch (_) {
      return { id, stock: value };
    }
  }
);

// Borrar coleccionable
export const deleteColeccionable = createAsyncThunk(
  'admin/deleteColeccionable',
  async ({ id, token }, { rejectWithValue }) => {
    await axios.delete(`${BASE}/coleccionable/${id}`, { headers: authHeaders(token) });
    return id;
  }
);

export const createColeccionable = createAsyncThunk(
  'admin/createColeccionable',
  async ({ data, token }, { rejectWithValue }) => {
    const payload = {
      nombre: data.nombre?.trim() ?? '',
      descripcion: data.descripcion?.trim() ?? '',
      precio: data.precio ?? null,
      linea: data.lineaId ?? data.linea ?? null,
      imagenes: Array.isArray(data.imagenes) ? data.imagenes : [],
    };
    const headers = { ...authHeaders(token), 'Content-Type': 'application/json' };
    const res = await axios.post(`${BASE}/coleccionable`, payload, { headers });
    return res.data;
  }
);

// Editar coleccionable
export const updateColeccionable = createAsyncThunk(
  'admin/updateColeccionable',
  async ({ id, data, token }, { rejectWithValue }) => {
    const payload = {
      nombre: data.nombre ?? '',
      descripcion: data.descripcion ?? '',
      precio: data.precio ?? null,
      linea: data.lineaId ?? data.linea ?? null,
      imagenes: Array.isArray(data.imagenes) ? data.imagenes : [],
    };
    const res = await axios.put(`${BASE}/coleccionable/${encodeURIComponent(id)}`, payload, {
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    });
    return { id, updated: res.data ?? payload };
  }
);

export const uploadMarcaImagesThunk = createAsyncThunk(
  'admin/uploadMarcaImages',
  async ({ marcaId, files, token }, { rejectWithValue }) => {
    if (!marcaId) return rejectWithValue('marcaId requerido');
    const res = await uploadMarcaImages(marcaId, files, { token });
    if (!res?.ok) return rejectWithValue('Fallo la subida de imagenes de marca');
    return { marcaId, ok: true };
  }
);

export const uploadColeccionableImagesThunk = createAsyncThunk(
  'admin/uploadColeccionableImages',
  async ({ coleccionableId, files, token }, { rejectWithValue }) => {
    if (!coleccionableId) return rejectWithValue('coleccionableId requerido');
    const res = await uploadColeccionableImages(coleccionableId, files, { token });
    if (!res?.ok) return rejectWithValue('Fallo la subida de imagenes del coleccionable');
    return { coleccionableId, ok: true };
  }
);

export const fetchActivePromo = createAsyncThunk(
  'admin/fetchActivePromo',
  async ({ coleccionableId, token }, { rejectWithValue, signal }) => {
    if (!coleccionableId) return rejectWithValue('coleccionableId requerido');
    const headers = authHeaders(token);
    const res = await axios.get(`${BASE}/promociones/activas`, {
      params: { coleccionableId },
      signal,
      headers,
      validateStatus: () => true,
    });
    if (res.status !== 200) return rejectWithValue(`HTTP ${res.status}`);
    const list = Array.isArray(res.data) ? res.data : [];
    const found = list.find(
      (p) =>
        String(p?.scopeType || '').toUpperCase() === 'ITEM' &&
        String(p?.scopeId) === String(coleccionableId)
    );
    return { coleccionableId, promo: found || null };
  }
);

export const savePromo = createAsyncThunk(
  'admin/savePromo',
  async ({ data, token }, { rejectWithValue }) => {
    const headers = { ...authHeaders(token), 'Content-Type': 'application/json' };
    const res = await axios.post(`${BASE}/promociones`, data, { headers, validateStatus: () => true });
    if (res.status !== 200 && res.status !== 201) {
      return rejectWithValue(res?.data?.message || `HTTP ${res.status}`);
    }
    return res.data ?? data;
  }
);

const initialState = {
  catalogo: [],
  detallesById: {},
  marcas: [],
  lineasByMarca: {},
  status: 'idle',
  error: null,
  busyById: {},
  promosById: {},
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setBusy(state, { payload: { id, on } }) {
      state.busyById[id] = on;
    },
    revokeImagen(state, { payload: { id } }) {
      const det = state.detallesById[id];
      if (det?.imagenUrl) {
        URL.revokeObjectURL(det.imagenUrl);
        det.imagenUrl = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCatalogo.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCatalogo.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.catalogo = action.payload;
      })
      .addCase(fetchCatalogo.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchDetalle.fulfilled, (state, action) => {
        state.detallesById[action.payload.id] = action.payload.detalle;
      })
      .addCase(fetchMarcas.fulfilled, (state, action) => {
        state.marcas = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchLineasByMarca.fulfilled, (state, action) => {
        state.lineasByMarca[action.payload.marcaId] = action.payload.lineas;
      })
      .addCase(createMarca.fulfilled, (state, action) => {
        state.marcas.push(action.payload);
      })
      .addCase(deleteMarca.fulfilled, (state, action) => {
        state.marcas = state.marcas.filter(
          (m) => String(m.id ?? m.marcaId) !== String(action.payload)
        );
      })
      .addCase(createLinea.fulfilled, (state, action) => {
        const marcaId = action.meta.arg.marcaId;
        const current = state.lineasByMarca[marcaId] || [];
        state.lineasByMarca[marcaId] = [...current, action.payload];
      })
      .addCase(deleteLinea.fulfilled, (state, action) => {
        const id = action.payload;
        Object.keys(state.lineasByMarca).forEach((mid) => {
          state.lineasByMarca[mid] = (state.lineasByMarca[mid] || []).filter(
            (l) => String(l.id ?? l.lineaId) !== String(id)
          );
        });
      })
      .addCase(updateStock.fulfilled, (state, action) => {
        state.catalogo = state.catalogo.map((r) =>
          String(r.id) === String(action.payload.id)
            ? { ...r, stock: action.payload.stock }
            : r
        );
      })
      .addCase(deleteColeccionable.fulfilled, (state, action) => {
        const id = action.payload;
        state.catalogo = state.catalogo.filter((r) => String(r.id) !== String(id));
        delete state.detallesById[id];
      })
      .addCase(updateColeccionable.fulfilled, (state, action) => {
        const { id, updated } = action.payload;
        state.detallesById[id] = { ...(state.detallesById[id] || {}), ...updated };
        state.catalogo = state.catalogo.map((r) =>
          String(r.id) === String(id)
            ? {
                ...r,
                nombre: updated.nombre ?? r.nombre,
                precio: updated.precio ?? r.precio,
              }
            : r
        );
      })
      .addCase(fetchActivePromo.fulfilled, (state, action) => {
        const { coleccionableId, promo } = action.payload;
        state.promosById[coleccionableId] = promo;
      })
      .addCase(savePromo.fulfilled, (state, action) => {
        const id =
          action.payload?.scopeId ??
          action.payload?.coleccionableId ??
          action.payload?.coleccionableID ??
          null;
        if (id != null) {
          state.promosById[id] = action.payload;
        }
      });
  },
});

export const { setBusy, revokeImagen } = adminSlice.actions;

// Selectors
export const selectCatalogo = (state) => state.admin.catalogo;
export const selectDetalleById = (state, id) => state.admin.detallesById[id];
export const selectMarcas = (state) => state.admin.marcas;
export const selectLineasByMarca = (state, marcaId) =>
  state.admin.lineasByMarca[marcaId] || [];
export const selectAdminStatus = (state) => state.admin.status;
export const selectAdminError = (state) => state.admin.error;
export const selectBusy = (state, id) => !!state.admin.busyById[id];
export const selectPromoById = (state, id) => state.admin.promosById[id];

export default adminSlice.reducer;
