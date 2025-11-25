import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getWishlist, removeFromWishlist } from "../lib/api";

export const fetchWishlist = createAsyncThunk(
  "wishlist/fetch",
  async ({ token }, { rejectWithValue }) => {
    if (!token) return rejectWithValue("No se encuentra logueado");
    try {
      const data = await getWishlist(token);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue(
        error?.message || "No se pudo cargar la wishlist"
      );
    }
  }
);

export const removeWishlistItem = createAsyncThunk(
  "wishlist/removeItem",
  async ({ token, itemId }, { rejectWithValue }) => {
    if (!token) return rejectWithValue("No se encuentra logueado");
    if (!itemId) return rejectWithValue("Item inválido");
    try {
      await removeFromWishlist(token, itemId);
      return itemId;
    } catch (error) {
      return rejectWithValue(
        error?.message || "No se pudo eliminar el item de la wishlist"
      );
    }
  }
);

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: {
    items: [],
    status: "idle",
    error: null,
  },
  reducers: {
    clearWishlistState: (state) => {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload ?? [];
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error?.message;
      })
      .addCase(removeWishlistItem.fulfilled, (state, action) => {
        const id = action.payload;
        state.items = state.items.filter((it) => it.id !== id);
      })
      .addCase(removeWishlistItem.rejected, (state, action) => {
        state.error = action.payload || action.error?.message;
      });
  },
});

export const { clearWishlistState } = wishlistSlice.actions;
export default wishlistSlice.reducer;
