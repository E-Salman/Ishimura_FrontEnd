import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "./axiosClient";

const BASE = "http://localhost:4002";

export const fetchMarcas = createAsyncThunk(
  "marcas/fetchMarcas",
  async (_, { rejectWithValue }) => {
    const res = await api.get(`${BASE}/marcas`, {
      validateStatus: () => true,
    });

    if (res.status !== 200) {
      return rejectWithValue("No se pudieron cargar las marcas");
    }

    return res.data;
  }
);

const marcasSlice = createSlice({
  name: "marcas",
  initialState: {
    items: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarcas.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMarcas.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchMarcas.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          action.payload || action.error.message || "Error al cargar marcas";
      });
  },
});

export default marcasSlice.reducer;

