import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE = "http://localhost:4002";

export const fetchLineasByMarca = createAsyncThunk(
  "lineas/fetchByMarca",
  async (marcaId, { rejectWithValue, signal }) => {
    if (!marcaId) return rejectWithValue("Id de marca invalido");

    try {
      const res = await axios.get(
        `${BASE}/listarColeLineas/lineas/marca/${encodeURIComponent(marcaId)}`,
        { signal, validateStatus: () => true }
      );

      if (res.status !== 200) {
        const data = res.data;
        const msg =
          (typeof data === "string" && data) ||
          data?.message ||
          `HTTP ${res.status}`;
        return rejectWithValue(msg);
      }

      return { marcaId, items: Array.isArray(res.data) ? res.data : [] };
    } catch (err) {
      const data = err?.response?.data;
      const msg =
        (typeof data === "string" && data) ||
        data?.message ||
        err?.message ||
        "No se pudieron cargar las lineas";
      return rejectWithValue(msg);
    }
  }
);

const lineasSlice = createSlice({
  name: "lineas",
  initialState: {
    byMarca: {},
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLineasByMarca.pending, (state, action) => {
        const marcaId = action.meta.arg;
        state.byMarca[marcaId] = {
          status: "loading",
          items: [],
          error: null,
        };
      })
      .addCase(fetchLineasByMarca.fulfilled, (state, action) => {
        const { marcaId, items } = action.payload;
        state.byMarca[marcaId] = {
          status: "loaded",
          items,
          error: null,
        };
      })
      .addCase(fetchLineasByMarca.rejected, (state, action) => {
        const marcaId = action.meta.arg;
        state.byMarca[marcaId] = {
          status: "error",
          items: [],
          error: action.payload || action.error.message,
        };
      });
  },
});

export default lineasSlice.reducer;
