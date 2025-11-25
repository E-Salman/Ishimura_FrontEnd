import { createSlice } from "@reduxjs/toolkit";

const initialLinks = [
  { path: "/home", label: "Casa" },
  { path: "/contact", label: "Contacto" },
  { path: "/marcas", label: "Marcas" },
  { path: "/login", label: "Login" },
];

const navigationSlice = createSlice({
  name: "navigation",
  initialState: {
    links: initialLinks,
    activePath: "/home",
  },
  reducers: {
    setActivePath: (state, action) => {
      state.activePath = action.payload || "/home";
    },
    setLinks: (state, action) => {
      state.links = Array.isArray(action.payload) ? action.payload : state.links;
    },
  },
});

export const { setActivePath, setLinks } = navigationSlice.actions;
export default navigationSlice.reducer;
