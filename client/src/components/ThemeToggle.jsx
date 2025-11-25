import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setTheme, toggleTheme } from "../redux/themeSlice";

export default function ThemeToggle() {
  const dispatch = useDispatch();
  const mode = useSelector((state) => state.theme.mode); 
  const dark = mode === "dark";

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      let initialDark = dark;

      if (stored === "dark") {
        initialDark = true;
      } else if (stored === "light") {
        initialDark = false;
      } else if (window.matchMedia) {
        initialDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      }

      if (initialDark !== dark) {
        dispatch(setTheme(initialDark ? "dark" : "light"));
      }
    } catch {//ignorar errores
      }
  }, []);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      onClick={() => dispatch(toggleTheme())}
      className="rounded-full bg-primary/20 p-2 text-white hover:bg-primary/30 dark:text-black dark:hover:bg-primary/40 transition-colors"
      title={dark ? "Modo claro" : "Modo oscuro"}
    >
      <span className="material-symbols-outlined">
        {dark ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}