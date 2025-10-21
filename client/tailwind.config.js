/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // Habilita el modo oscuro controlado por clase
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // Escanea todos tus componentes
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4FFFCF",
        "background-light": "#f5f8f8",
        "background-dark": "#000000",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
