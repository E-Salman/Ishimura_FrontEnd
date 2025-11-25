import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE = "http://localhost:4002";

export const fetchColeccionables = createAsyncThunk(
  "coleccionables/fetchAll",
  async (_, { rejectWithValue }) => {
    const res = await axios.get(`${BASE}/coleccionables`, {
      validateStatus: () => true,
    });

    if (res.status !== 200) {
      return rejectWithValue("No se pudieron cargar los coleccionables");
    }

    return res.data;
  }
);

const coleccionablesSlice = createSlice({
  name: "coleccionables",
  initialState: {
    items: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchColeccionables.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchColeccionables.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchColeccionables.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          action.payload ||
          action.error.message ||
          "Error al cargar coleccionables";
      });
  },
});

export default coleccionablesSlice.reducer;
