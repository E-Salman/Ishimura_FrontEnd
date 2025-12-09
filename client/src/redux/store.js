// src/redux/store.js
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import storage from "redux-persist/lib/storage";

import postReducer from './postSlice';
import wishlistReducer from './wishlistSlice';
import destacadosReducer from './colDestacadosSlice';
import lineasReducer from "./lineasSlice";
import marcasReducer from "./marcasSlice";
import coleccionablesReducer from "./coleccionablesSlice";
import themeReducer from "./themeSlice";
import adminOrdersReducer from "./adminOrdersSlice";
import newArrivalsReducer from "./newArrivalsSlice";
import promotionsReducer from "./promotionsSlice";
import registerReducer from "./registerSlice";
import navigationReducer from "./navigationSlice";
import loginReducer from "./loginSlice";
import cartReducer from './cartSlice';
import adminReducer from './adminSlice';
import ordersReducer from './ordersSlice';
import carouselReducer from './coleccionablesCarouselSlice'
import misComprasReducer from './misComprasSlice'

const loginPersistConfig = {
  key: "login",
  storage,
  whitelist: ["token", "role", "email"], 
};

const persistedLoginReducer = persistReducer(loginPersistConfig, loginReducer);
const rootReducer = combineReducers({
  posts: postReducer,
  wishlist: wishlistReducer,
  destacados: destacadosReducer,
  lineas: lineasReducer,
  marcas: marcasReducer,
  coleccionables: coleccionablesReducer,
  theme: themeReducer,
  adminOrders: adminOrdersReducer,
  newArrivals: newArrivalsReducer,
  misCompras: misComprasReducer,
  promotions: promotionsReducer,
  register: registerReducer,
  navigation: navigationReducer,
  login: persistedLoginReducer, 
  cart: cartReducer,
  admin: adminReducer,
  orders: ordersReducer,
  colsCarousel: carouselReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER], //Ignora errores de este tipo porque vienen incluidos en el redux persist
      },
    }),
});

export const persistor = persistStore(store);
