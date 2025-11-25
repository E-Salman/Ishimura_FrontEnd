import axios from 'axios';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const BASE = 'http://localhost:4002';

export const createOrderThunk = createAsyncThunk(
  'orders/create',
  async ({ token, data }, { rejectWithValue, signal }) => {
    if (!token) return rejectWithValue('No auth token');
    const res = await axios.post(`${BASE}/ordenes`, data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal,
      validateStatus: () => true,
    });
    const contentType = res.headers?.get?.('content-type') ?? res.headers?.['content-type'] ?? '';
    const payload = contentType && String(contentType).includes('application/json') ? res.data : res.data ?? null;
    if (res.status !== 200 && res.status !== 201) {
      const message =
        (payload && typeof payload === 'object' && (payload.detail || payload.message)) ||
        (typeof payload === 'string' && payload) ||
        `HTTP ${res.status}`;
      return rejectWithValue(message);
    }
    return payload;
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    lastOrder: null,
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createOrderThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createOrderThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.lastOrder = action.payload;
      })
      .addCase(createOrderThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      });
  },
});

export const selectOrderStatus = (state) => state.orders.status;
export const selectOrderError = (state) => state.orders.error;

export default ordersSlice.reducer;
