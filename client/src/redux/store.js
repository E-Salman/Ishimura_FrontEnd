import { configureStore } from '@reduxjs/toolkit'
import postReducer from './postSlice'
import authReducer from './authSlice'
import wishlistReducer from './wishlistSlice'
import destacadosReducer from './colDestacadosSlice'

export const store = configureStore({
    reducer: { 
        posts: postReducer,
        auth: authReducer,
        wishlist: wishlistReducer,
        destacados: destacadosReducer
    }
})