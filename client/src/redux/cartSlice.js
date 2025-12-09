import api from "./axiosClient";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const BASE = "http://localhost:4002";
const authHeaders = (token) => ({ Authorization: `Bearer ${token}` }); //Devuelve un JSON para los headers

export const fetchCart = createAsyncThunk("cart/fetch", async (_arg, { getState, signal }) => { //trae los items del carrito
    const token = getState().login.token;
    const res = await api.get(`${BASE}/carrito`, { signal, headers: authHeaders(token) });
    return Array.isArray(res.data) ? res.data : [];
  }
);

export const addCartItem = createAsyncThunk("cart/add", async ({ coleccionableId, cantidad = 1 }, { getState, signal }) => { //agrega un item al carrito o actualiza su cantidad
    const token = getState().login.token;
    const url = `${BASE}/carrito/${encodeURIComponent(coleccionableId)}?cantidad=${encodeURIComponent(cantidad)}`;
    const res = await api.post(url, null, { signal, headers: authHeaders(token) });
    return res.data;
  }
);

export const updateCartQuantity = createAsyncThunk("cart/updateQty", async ({ itemId, cantidad }, { getState, signal }) => { //actualiza la cantidad de un item del carrito
    const token = getState().login.token;
    const url = `${BASE}/carrito/${encodeURIComponent(itemId)}?cantidad=${encodeURIComponent(cantidad)}`;
    const res = await api.patch(url, null, { signal, headers: authHeaders(token) });
    return res.data ?? { id: itemId, cantidad };
  }
);

export const removeCartItemThunk = createAsyncThunk("cart/remove", async ({ itemId }, { getState, signal }) => { //elimina un item del carrito
    const token = getState().login.token;
    await api.delete(`${BASE}/carrito/${encodeURIComponent(itemId)}`, { signal, headers: authHeaders(token) });
    return itemId;
  }
);

export const clearCartThunk = createAsyncThunk("cart/clear", async (_arg, { getState, signal }) => { //vaciar el carrito
    const token = getState().login.token;
    await api.delete(`${BASE}/carrito/vaciar`, { signal, headers: authHeaders(token) });
    return true;
  }
);

const cartSlice = createSlice({ //lo que guarda el store del carrito
  name: "cart",
  initialState: {
    items: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error;
      })
      
      .addCase(addCartItem.fulfilled, (state, action) => {
        const payload = action.payload;
        if (Array.isArray(payload)) {
          state.items = payload;
          return;
        }
        if (payload && typeof payload === "object") {
          const incomingId = payload.id ?? payload.itemId ?? payload.coleccionableId;
          const existingIndex = state.items.findIndex(
            (it) => String(it.id) === String(incomingId)
          );
          if (existingIndex !== -1) {
            state.items[existingIndex] = {
              ...state.items[existingIndex],
              ...payload,
              cantidad: payload.cantidad ?? state.items[existingIndex].cantidad,
            };
          } else {
            state.items.push(payload);
          }
          return;
        }
      })
      .addCase(updateCartQuantity.fulfilled, (state, action) => {
        const updated = action.payload;
        state.items = state.items.map((it) =>
          String(it.id) === String(updated.id ?? updated.itemId ?? updated.coleccionableId)
            ? { ...it, cantidad: updated.cantidad ?? it.cantidad }
            : it
        );
      })
      .addCase(removeCartItemThunk.fulfilled, (state, action) => {
        const id = action.payload;
        state.items = state.items.filter((it) => String(it.id) !== String(id));
      })
      .addCase(removeCartItemThunk.rejected, (state, action) => {
        state.error = action.error;
      })
      .addCase(clearCartThunk.fulfilled, (state) => {
        state.items = [];
      });
  },
});

export const selectCartItems = (state) => state.cart.items;
export const selectCartStatus = (state) => state.cart.status;
export const selectCartError = (state) => state.cart.error;
export default cartSlice.reducer; //exporta todo y en el store lo guarda
