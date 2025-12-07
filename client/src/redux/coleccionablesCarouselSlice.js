import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "./axiosClient";

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getUniqueRandoms = (count, min, max) => {
  const numbers = new Set();
  while (numbers.size < count) {
    numbers.add(randomInt(min, max));
  }
  return Array.from(numbers);
};

const asText = (val) => {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && typeof val.message === "string") return val.message;
  try { return JSON.stringify(val); } catch (_) { return String(val); }
};

export const fetchColeccionablesCarousel = createAsyncThunk("coleccionablesCarousel/fetch", async (_, { rejectWithValue }) => {
    const URLBase = "http://localhost:4002/coleccionable/";
    const randomIds = getUniqueRandoms(5, 1, 22);

    try {
      const results = await Promise.all(
        randomIds.map(async (id) => {
          try {
            const coleccionableRes = await api.get(URLBase + id, {
              validateStatus: (s) => s === 200,
            });
            const imagenRes = await api.get(URLBase + id + "/imagenes/0", {
              responseType: "blob",
              validateStatus: (s) => s === 200 || s === 404,
            });

            const imagenBlob = imagenRes.status === 200 ? URL.createObjectURL(imagenRes.data) : null;
            return {
              coleccionable: coleccionableRes.data,
              imagen: imagenBlob,
            };
          } catch (_) {
            return null; // omitir ids inexistentes sin romper todo el carrusel
          }
        })
      );

      const filtered = results.filter(Boolean);
      if (!filtered.length) {
        return rejectWithValue("No se pudieron cargar coleccionables para el carrusel");
      }

      return filtered; // array de {coleccionable, imagen}
    } catch (error) {
      return rejectWithValue(asText(error?.response?.data) || error.message);
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

export default coleccionablesCarouselSlice.reducer
