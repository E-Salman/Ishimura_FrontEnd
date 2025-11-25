import { configureStore } from '@reduxjs/toolkit'
import postReducer from './postSlice'
import authReducer from './authSlice'
import wishlistReducer from './wishlistSlice'
import destacadosReducer from './colDestacadosSlice'
import cartReducer from './cartSlice'
import adminReducer from './adminSlice'
import coleccionablesReducer from './coleccionablesSlice'

export const store = configureStore({
    reducer: { 
        posts: postReducer,
        auth: authReducer,
        wishlist: wishlistReducer,
        destacados: destacadosReducer,
        cart: cartReducer,
        admin: adminReducer,
        coleccionables: coleccionablesReducer,
    }
})
