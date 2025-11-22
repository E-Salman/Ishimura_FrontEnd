import { createAsyncThunk } from "@reduxjs/toolkit";

const URL = "http://jsonplaceholder.typicode.com/posts"

export const fetchPosts = createAsyncThunk('posts/fetchPosts', async () => {
    const {data} = await axios.get(URL)
    return data})

export const postSlice = createSlice({
    name: 'posts',
    initialState: {
        items: [],
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
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
                state.error = action.error.message
        })
    }
})

export default postSlice.reducer;
