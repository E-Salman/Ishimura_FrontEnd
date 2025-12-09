import api from "./axiosClient";
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const BASE = 'http://localhost:4002';
const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : undefined);

export const fetchCatalogo = createAsyncThunk(
  'admin/fetchCatalogo',
  async (_arg, { signal, getState }) => {
    const token = getState()?.login?.token;
    const res = await api.get(`${BASE}/catalogo`, { signal, headers: authHeaders(token) });
    const data = Array.isArray(res.data) ? res.data : [];
    return data.map((c) => ({
      id: c?.coleccionableId ?? c?.coleccionableID ?? c?.id ?? c?.idColeccionable ?? null,
      stock: c?.stock ?? 0,
      nombre: c?.nombre ?? null,
      precio: c?.precio ?? null,
      visibilidad: c?.visibilidad === false || c?.visibilidad === 0 ? false : true,
      firstImageId: c?.firstImageId ?? c?.firstImageID ?? null,
    })).filter((x) => x.id != null);
  }
);

export const fetchDetalle = createAsyncThunk(
  'admin/fetchDetalle',
  async ({ id, token }, { signal }) => {
    const headers = authHeaders(token);
    const res = await api.get(`${BASE}/coleccionable/${id}`, { signal, headers });
    const detalle = res.data;
    const visibilidad =
      detalle?.visibilidad === false || detalle?.visibilidad === 0 ? false : true;

    
    let descuento = detalle?.descuento ?? detalle?.discount ?? null;
    const promoRes = await api.get(`${BASE}/promociones/activas`, {
      params: { coleccionableId: id },
      signal,
      headers,
  validateStatus: (s) => s >= 200 && s < 500, 
  });
  const arr = Array.isArray(promoRes.data) ? promoRes.data : [];
    
    let imagenUrl = null;
    const imgRes = await api.get(`${BASE}/coleccionable/${id}/imagenes/0`, {
      signal,
      headers,
      responseType: 'blob',
      validateStatus: (s) => s === 200 || s === 404,
    });
    if (imgRes.status === 200) {
      const blob = imgRes.data;
      imagenUrl = URL.createObjectURL(blob);
    }

    return { id, detalle: { ...detalle, descuento, imagenUrl, visibilidad } };
  }
);

export const fetchMarcas = createAsyncThunk(
  'admin/fetchMarcas',
  async (_arg, { signal }) => {
    const res = await api.get(`${BASE}/marcas`, { signal });
    return res.data;
  }
);

export const fetchLineasByMarca = createAsyncThunk(
  'admin/fetchLineasByMarca',
  async ({ marcaId, signal }) => {
    const res = await api.get(`${BASE}/listarColeLineas/lineas/marca/${encodeURIComponent(marcaId)}`, { signal });
    return { marcaId, lineas: res.data };
  }
);

export const createMarca = createAsyncThunk(
  'admin/createMarca',
  async ({ nombre, token }, { rejectWithValue }) => {
    const res = await api.post(`${BASE}/marcas/crear`, { nombre }, { headers: { ...authHeaders(token), 'Content-Type': 'application/json' } });
    return res.data;
  }
);

export const deleteMarca = createAsyncThunk(
  'admin/deleteMarca',
  async ({ id, token }, { rejectWithValue }) => {
    await api.delete(`${BASE}/marcas/${id}`, { headers: authHeaders(token) });
    return id;
  }
);

export const createLinea = createAsyncThunk(
  'admin/createLinea',
  async ({ nombre, marcaId, token }, { rejectWithValue }) => {
    const body = { idMarca: marcaId, nombre };
    const res = await api.post(`${BASE}/lineas/crear`, body, { headers: { ...authHeaders(token), 'Content-Type': 'application/json' } });
    return res.data;
  }
);

export const deleteLinea = createAsyncThunk(
  'admin/deleteLinea',
  async ({ id, token }, { rejectWithValue }) => {
    await api.delete(`${BASE}/lineas/${id}`, { headers: authHeaders(token) });
    return id;
  }
);

export const updateStock = createAsyncThunk(
  "admin/updateStock",
  async ({ id, mode, value, token }, { rejectWithValue, getState }) => {
    const authToken = token || getState()?.login?.token;
    if (!authToken) return rejectWithValue("Falta token de autenticación");

    let url = null;
    let method = "post";
    if (mode === "inc") url = `${BASE}/catalogo/${id}/incrementarstock?cantidad=${encodeURIComponent(value)}`;
    else if (mode === "dec") url = `${BASE}/catalogo/${id}/decrementarstock?cantidad=${encodeURIComponent(value)}`;
    else if (mode === "set") { url = `${BASE}/catalogo/${id}/cambiarstock?nuevoStock=${encodeURIComponent(value)}`; method = "put"; }
    else return rejectWithValue("Modo inválido");

    await api({ url, method, headers: authHeaders(authToken) });

    const one = await api
      .get(`${BASE}/catalogo/${id}`, { headers: authHeaders(authToken) })
      .catch(() => null);
    if (!one) return { id, stock: value };
    const dto = one.data;
    return { id, stock: dto?.stock ?? dto?.cantidad ?? value };
  }
);

export const deleteColeccionable = createAsyncThunk(
  'admin/deleteColeccionable',
  async ({ id, token }, { rejectWithValue }) => {
    await api.delete(`${BASE}/coleccionable/${id}`, { headers: authHeaders(token) });
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
      visibilidad:
        data.visibilidad === false || data.visibilidad === 0
          ? false
          : data.visibilidad === true
          ? true
          : true,
    };
    const headers = { ...authHeaders(token), 'Content-Type': 'application/json' };
    const res = await api.post(`${BASE}/coleccionable`, payload, { headers });
    return res.data;
  }
);

export const updateColeccionable = createAsyncThunk(
  'admin/updateColeccionable',
  async ({ id, data, token }, { rejectWithValue }) => {
    const payload = {};
    if (data.nombre !== undefined) payload.nombre = data.nombre;
    if (data.descripcion !== undefined) payload.descripcion = data.descripcion;
    if (data.precio !== undefined) payload.precio = data.precio;
    if (data.lineaId !== undefined || data.linea !== undefined) {
      payload.linea = data.lineaId ?? data.linea ?? null;
    }
    if (data.imagenes !== undefined) {
      payload.imagenes = Array.isArray(data.imagenes) ? data.imagenes : [];
    }
    if (data.visibilidad !== undefined) {
      payload.visibilidad =
        data.visibilidad === false || data.visibilidad === 0
          ? false
          : data.visibilidad === true
          ? true
          : !!data.visibilidad;
    }
    const res = await api.put(`${BASE}/coleccionable/${encodeURIComponent(id)}`, payload, {
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    });
    const serverData = res && typeof res.data === 'object' ? res.data : {};
    return { id, updated: { ...serverData, ...payload } };
  }
);

export const uploadMarcaImagesThunk = createAsyncThunk(
  'admin/uploadMarcaImages',
  async ({ marcaId, files, token }, { rejectWithValue }) => {
    if (!marcaId) return rejectWithValue('marcaId requerido');
    if (!Array.isArray(files) || files.length === 0) return { marcaId, ok: true };

    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const endpoints = [
      { url: `${BASE}/marcasImages/${marcaId}/imagenes`, field: null },
      { url: `${BASE}/marcas/${marcaId}/imagenes`, field: null },
      { url: `${BASE}/imagenes/marca/${marcaId}`, field: null },
      { url: `${BASE}/imagenes`, field: 'idMarca' },
    ];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let uploaded = false;
      for (const entry of endpoints) {
        const form = new FormData();
        form.append('file', file, file.name);
        if (entry.field) form.append(entry.field, String(marcaId));
        const res = await api
          .post(entry.url, form, {
            headers: { ...headers, 'Content-Type': 'multipart/form-data' },
          })
          .catch(() => null);
        if (res && res.status >= 200 && res.status < 300) {
          uploaded = true;
          break;
        }
      }
      if (!uploaded) return rejectWithValue('Fallo la subida de imagenes de marca');
    }
    return { marcaId, ok: true };
  }
);

export const uploadColeccionableImagesThunk = createAsyncThunk(
  'admin/uploadColeccionableImages',
  async ({ coleccionableId, files, token }, { rejectWithValue }) => {
    if (!coleccionableId) return rejectWithValue('coleccionableId requerido');
    if (!Array.isArray(files) || files.length === 0) return { coleccionableId, ok: true };

    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const endpoints = [
      { url: `${BASE}/coleccionable/${coleccionableId}/imagenes`, field: null },
      { url: `${BASE}/coleccionable/${coleccionableId}/imagen`, field: null },
      { url: `${BASE}/imagenes`, field: 'idColeccionable' },
    ];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      let uploaded = false;
      for (const entry of endpoints) {
        const form = new FormData();
        form.append('file', f, f.name);
        if (entry.field) form.append(entry.field, String(coleccionableId));
        const res = await api
          .post(entry.url, form, {
            headers: { ...headers, 'Content-Type': 'multipart/form-data' },
          })
          .catch(() => null);
        if (res && res.status >= 200 && res.status < 300) {
          uploaded = true;
          break;
        }
      }
      if (!uploaded) return rejectWithValue('Fallo la subida de imagenes del coleccionable');
    }
    return { coleccionableId, ok: true };
  }
);

export const fetchActivePromo = createAsyncThunk(
  'admin/fetchActivePromo',
  async ({ coleccionableId, token }, { rejectWithValue, signal }) => {
    if (!coleccionableId) return rejectWithValue('coleccionableId requerido');
    const headers = authHeaders(token);
    const res = await api.get(`${BASE}/promociones/activas`, {
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
    const res = await api.post(`${BASE}/promociones`, data, { headers, validateStatus: () => true });
    if (res.status !== 200 && res.status !== 201) {
      return rejectWithValue(res?.data?.message || `HTTP ${res.status}`);
    }
    return res.data ?? data;
  }
);

export const updatePromo = createAsyncThunk(
  'admin/updatePromo',
  async ({ id, data, token }, { rejectWithValue }) => {
    if (!id) return rejectWithValue('promoId requerido');
    const headers = { ...authHeaders(token), 'Content-Type': 'application/json' };
    const res = await api.put(`${BASE}/promociones/${encodeURIComponent(id)}`, data, {
      headers,
      validateStatus: () => true,
    });
    if (res.status !== 200) {
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
    clearAdminError(state) {
      state.error = null;
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
      .addCase(fetchDetalle.rejected, (state, action) => {
        const id = action.meta?.arg?.id;
        if (id != null) {
          delete state.detallesById[id];
        }
        state.error = action.error?.message || 'No se pudo cargar el detalle';
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
        state.catalogo = state.catalogo.map((r) =>
          String(r.id) === String(id)
            ? { ...r, visibilidad: false, stock: 0 }
            : r
        );
        if (state.detallesById[id]) {
          state.detallesById[id] = {
            ...state.detallesById[id],
            visibilidad: false,
            stock: 0,
          };
        }
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
                visibilidad:
                  updated.visibilidad === false || updated.visibilidad === 0
                    ? false
                    : updated.visibilidad === true
                    ? true
                    : r.visibilidad,
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

export const { setBusy, revokeImagen, clearAdminError } = adminSlice.actions;

// Selectors
export const selectCatalogo = (state) => state.admin.catalogo;
export const selectDetalleById = (state, id) => state.admin.detallesById[id];
export const selectMarcas = (state) => state.admin.marcas;
export const selectLineasByMarca = (state, marcaId) => state.admin.lineasByMarca[marcaId] || [];
export const selectAdminStatus = (state) => state.admin.status;
export const selectAdminError = (state) => state.admin.error;
export const selectBusy = (state, id) => !!state.admin.busyById[id];
export const selectPromoById = (state, id) => state.admin.promosById[id];

export default adminSlice.reducer;







