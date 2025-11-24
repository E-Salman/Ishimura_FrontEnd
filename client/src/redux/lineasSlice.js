import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE = "http://localhost:4002";

export const fetchLineasByMarca = createAsyncThunk(
  "lineas/fetchByMarca",
  async (marcaId, { rejectWithValue }) => {
    if (!marcaId) return rejectWithValue("Id de marca inválido");

    const res = await axios.get(`${BASE}/marcas/${marcaId}/lineas`, {
      validateStatus: () => true,
    });

    if (res.status !== 200) {
      return rejectWithValue("No se pudieron cargar las líneas");
    }

    return { marcaId, items: res.data };
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
