import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const URL = "https://jsonplaceholder.typicode.com/posts"//"https://jsonplaceholder.typicode.com/posts/${postId}"

export const fetchPosts = createAsyncThunk("posts/fetchPosts", async() => {
    const { data } = await axios.get(URL)
    return data
})

const postSlice = createSlice({
    name: "posts",
    initialState: {
        items: [],
        loading: false,
        error: null
    },
    reducers: {}, // Para operaciones sincronas
    extraReducers: (builder) => { //Para operaciones asincronas
        builder
        .addCase(fetchPosts.pending, (state) => {
            state.loading = true
            state.error = null
        })
        .addCase(fetchPosts.fulfilled, (state, action) => {
            state.loading = false
            state.items = action.payload                        
        })
        .addCase(fetchPosts.rejected, (state, action) => {
            state.loading = false
            state.items = action.error.message
        })
    }
})

export default postSlice.reducer