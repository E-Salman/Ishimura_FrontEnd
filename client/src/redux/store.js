import { configureStore } from '@reduxjs/toolkit';
import postReducer from './postSlice';
import authReducer from './authSlice';
import wishlistReducer from './wishlistSlice';
import destacadosReducer from './colDestacadosSlice';
import lineasReducer from "./lineasSlice";
import marcasReducer from "./marcasSlice";
import coleccionablesReducer from "./coleccionablesSlice";
import themeReducer from "./themeSlice";
import adminOrdersReducer from "./adminOrdersSlice";

export const store = configureStore({
    reducer: { 
        posts: postReducer,
        auth: authReducer,
        wishlist: wishlistReducer,
        destacados: destacadosReducer,
        lineas: lineasReducer,
        marcas: marcasReducer,
        coleccionables: coleccionablesReducer,
        theme: themeReducer,
        adminOrders: adminOrdersReducer,
    }
})
