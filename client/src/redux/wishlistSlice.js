import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE = "http://localhost:4002";

// Agregar a wishlist
export const addToWishlist = createAsyncThunk(
    "wishlist/add",
    async (coleccionableId, { getState, rejectWithValue }) => {
        const token = getState().login.token;

        if (!token) return rejectWithValue("No se encuentra logueado");

        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };

        const { data } =
            await axios.post(
                `${BASE}/wishlist/${encodeURIComponent(coleccionableId)}`,
                null,
                { headers }
            );

        return data;
    }
);

export const fetchWishlist = createAsyncThunk(
    "wishlist/fetchAll",
    async (_, { getState, rejectWithValue }) => {
        const token = getState().login.token;

        if (!token) return rejectWithValue("No se encuentra logueado");

        const headers = {
            Authorization: `Bearer ${token}`,
        };

        try {
            const { data } = await axios.get(`${BASE}/wishlist`, { headers });

            return data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const removeFromWishlist = createAsyncThunk(
    "wishlist/remove",
    async (wishlistItemId, { getState, rejectWithValue }) => {
        const token = getState().login.token;

        if (!token) return rejectWithValue("No se encuentra logueado");

        const headers = {
            Authorization: `Bearer ${token}`,
        };

        try {
            await axios.delete(`${BASE}/wishlist/${encodeURIComponent(wishlistItemId)}`, {
                headers,
            });
            return wishlistItemId;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

const wishlistSlice = createSlice({
    name: "wishlist",
    initialState: {
        items: [],
        loading: false,
        error: null,

    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // ADD
            .addCase(addToWishlist.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addToWishlist.fulfilled, (state, action) => {
                state.loading = false;
                state.error = null;
                state.items = [...state.items, action.payload];

            })
            .addCase(addToWishlist.rejected, (state, action) => {
                state.loading = false;
                state.error =
                    action.payload || action.error.message;
            })

            // FETCH ALL
            .addCase(fetchWishlist.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWishlist.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload ?? [];
            })
            .addCase(fetchWishlist.rejected, (state, action) => {
                state.loading = false;
                state.error =
                    action.payload ||
                    action.error.message
            })

            // REMOVE
            .addCase(removeFromWishlist.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(removeFromWishlist.fulfilled, (state, action) => {
                state.loading = false;
                const id = action.payload;
                state.items = state.items.filter(it => it.id !== id);
            })
            .addCase(removeFromWishlist.rejected, (state, action) => {
                state.loading = false;
                state.error =
                    action.payload ||
                    action.error.message
            });
    },
});

export default wishlistSlice.reducer;
