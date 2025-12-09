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
  return Promise.resolve()
    .then(() => JSON.stringify(val))
    .catch(() => String(val));
};

export const fetchColeccionablesCarousel = createAsyncThunk("coleccionablesCarousel/fetch", async (_, { rejectWithValue }) => {
  const URLBase = "http://localhost:4002/coleccionable/";
  const randomIds = getUniqueRandoms(5, 1, 22);
  const usedIds = new Set();

  const fetchWithBump = async (startId, bumpsLeft = 20) => {
    let current = startId;
    let remaining = bumpsLeft;

    while (remaining >= 0) {
      if (usedIds.has(current)) {
        current += 1;
        remaining -= 1;
        continue;
      }

      const coleccionableRes = await api
        .get(URLBase + current, { validateStatus: (s) => s === 200 })
        .catch(() => null);

      if (coleccionableRes?.status === 200) {
        const imagenRes = await api
          .get(URLBase + current + "/imagenes/0", {
            responseType: "blob",
            validateStatus: (s) => s === 200 || s === 404,
          })
          .catch(() => null);

        const imagenBlob =
          imagenRes?.status === 200 ? URL.createObjectURL(imagenRes.data) : null;
        usedIds.add(current);
        return {
          coleccionable: coleccionableRes.data,
          imagen: imagenBlob,
        };
      }

      current += 1;
      remaining -= 1;
    }

    return null;
  };

  const results = [];
  for (const id of randomIds) {
    const got = await fetchWithBump(id, 20);
    if (got) results.push(got);
  }

  const filtered = results.filter(Boolean);
  if (!filtered.length) {
    return rejectWithValue("No se pudieron cargar coleccionables para el carrusel");
  }

    return filtered; // array de {coleccionable, imagen}
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
