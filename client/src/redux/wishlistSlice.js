import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const BASE = "http://localhost:4002";
const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : undefined);

export const fetchWishlist = createAsyncThunk(
  "wishlist/fetch",
  async (_arg, { getState, rejectWithValue, signal }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue("No auth token");
    const res = await axios.get(`${BASE}/wishlist`, { signal, headers: authHeaders(token) });
    return Array.isArray(res.data) ? res.data : [];
  }
);

export const addToWishlistThunk = createAsyncThunk(
  "wishlist/add",
  async ({ coleccionableId }, { getState, rejectWithValue, signal }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue("No auth token");

    const headers = { "Content-Type": "application/json", ...authHeaders(token) };
    const attempts = [
      () => axios.post(`${BASE}/wishlist`, { coleccionableId }, { signal, headers }),
      () => axios.post(`${BASE}/wishlist/${encodeURIComponent(coleccionableId)}`, null, { signal, headers }),
      () => axios.post(`${BASE}/wishlist?coleccionableId=${encodeURIComponent(coleccionableId)}`, null, { signal, headers }),
      () => axios.post(`${BASE}/wishlist/agregar/${encodeURIComponent(coleccionableId)}`, null, { signal, headers }),
    ];

    for (const req of attempts) {
      try {
        const res = await req();
        return res.data ?? { ok: true, coleccionableId };
      } catch (err) {
        if (err.response?.status === 409) return { ok: true, coleccionableId };
      }
    }
    return rejectWithValue("No se pudo agregar a la wishlist");
  }
);

export const removeFromWishlistThunk = createAsyncThunk(
  "wishlist/remove",
  async ({ itemId }, { getState, rejectWithValue, signal }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue("No auth token");
    await axios.delete(`${BASE}/wishlist/${encodeURIComponent(itemId)}`, { signal, headers: authHeaders(token) });
    return itemId;
  }
);

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: {
    items: [],
    status: "idle",
    error: null,
},
reducers: {},
extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(addToWishlistThunk.fulfilled, (state, action) => {
        if (!action.payload) return;
        const list = state.items || [];
        state.items = list;
      })
      .addCase(removeFromWishlistThunk.fulfilled, (state, action) => {
        state.items = (state.items || []).filter((w) => String(w.id) !== String(action.payload));
      });
  },
});

export const selectWishlistItems = (state) => state.wishlist.items || [];
export const selectWishlistStatus = (state) => state.wishlist.status;
export const selectWishlistError = (state) => state.wishlist.error;

export default wishlistSlice.reducer;
