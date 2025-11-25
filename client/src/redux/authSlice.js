import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: null,
    email: null,
  },
  reducers: {//cambiar a asincrona, que saque login desde el server
    setLogin: (state, action) => {
      state.token = action.payload.token; //Payload = parametros. Datos que se le mandan al reducer cuando se despacha
      state.email = action.payload.user; //Reducers = funciones dentro del slice que actualizan el estado segun la accion
    },
    logout: (state) => {
      state.token = null;
      state.email = null;
    },
  },
});

export const { setLogin, logout } = authSlice.actions;
export const selectToken = (state) => state.auth.token;
export const selectEmail = (state) => state.auth.email;
export const selectIsAdmin = (state) => isAdminFromToken(state.auth.token);
export default authSlice.reducer;