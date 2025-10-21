import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    localStorage.theme
      ? localStorage.theme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark((v) => !v)}
      className="rounded-full bg-primary/20 p-2 text-white hover:bg-primary/30 dark:text-black dark:hover:bg-primary/40 transition-colors"
      title={dark ? "Modo claro" : "Modo oscuro"}
    >
      <span className="material-symbols-outlined">
        {dark ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
