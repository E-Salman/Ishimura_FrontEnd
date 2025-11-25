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

export default coleccionablesCarouselSlice.reducer