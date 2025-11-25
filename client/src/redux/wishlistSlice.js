import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE = "http://localhost:5173";

export const addToWishlist = createAsyncThunk("wishlist/add", async (coleccionableId, { getState, rejectWithValue }) => {
    const token = getState().auth.token;

    if (!token) return rejectWithValue("No se encuentra logueado");

    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };

    //ARREGLAR
    const attempts = [
        () => axios.post(`${BASE}/wishlist`, { coleccionableId }, { headers }),
        () => axios.post(`${BASE}/wishlist/${encodeURIComponent(coleccionableId)}`, null, { headers }),
        () => axios.post(`${BASE}/wishlist?coleccionableId=${encodeURIComponent(coleccionableId)}`, null, { headers }),
        () => axios.post(`${BASE}/wishlist/agregar/${encodeURIComponent(coleccionableId)}`, null, { headers }),
    ];

    for (const req of attempts) {
        try {
            const res = await req();
            return res.data ?? true;
        } catch (err) {
            if (err.response?.status === 409) return true; // ya existe
        }
    }

    return rejectWithValue("No se pudo agregar a la wishlist");
}
);

const wishlistSlice = createSlice({
    name: "wishlist",
    initialState: {
        status: "idle",
        error: null,
    },
    extraReducers: (builder) => {
        builder
            .addCase(addToWishlist.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(addToWishlist.fulfilled, (state) => {
                state.status = "succeeded";
            })
            .addCase(addToWishlist.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message; //El error es parte del action
            });
    },
});

export default wishlistSlice.reducer;
