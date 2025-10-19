import { Routes, Route, Navigate } from "react-router-dom";
import Navigation from "./views/Navigation";
import Home from "./views/Home";
import Contact from "./views/Contact";
import Login from "./views/Login";


export default function App() {
  return (
    <div className="min-h-screen w-full bg-background-dark text-white font-display">
      {/* Navbar (se muestra en todas las páginas) */}
      <Navigation />

      {/* Rutas */}
      <Routes>
        {/* redirigir raíz a /home */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />

        {/* 404 simple */}
        <Route path="*" element={<div className="p-8">404 — Not found</div>} />
      </Routes>
    </div>
  );
}
