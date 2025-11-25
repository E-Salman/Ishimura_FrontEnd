import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export const authLogin = createAsyncThunk("auth/login", async ({ email, password },{rejectWithValue}) => {
  const URL = "http://localhost:4002/api/v1/auth/authenticate";
    if(!email || !password) return rejectWithValue("Email y contraseña son obligatorios")
    const headers = {
        "Content-Type": "application/json",
    }
    const body = JSON.stringify({ email, password })
    const { data } = await axios.post(URL, body, { headers })
    return data
})

const loginSlice = createSlice({
    name: "login",
    initialState: {
        role: null,
        token: null,
        loading: false,
        error: null,
        kaomojiCount: 0
    },
    extraReducers: (builder) => {
        builder
            .addCase(authLogin.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(authLogin.fulfilled, (state, action) => {
                state.loading = false
                state.error = null
                state.role = action.payload.data.role
                state.token = action.payload.data.access_token
                state.kaomojiCount = 0
            })
            .addCase(authLogin.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload || action.error.message
                state.kaomojiCount = state.kaomojiCount + 1
            })
    }
})

export default loginSlice.reducer
