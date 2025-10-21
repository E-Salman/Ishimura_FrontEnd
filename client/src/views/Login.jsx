// src/views/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorCount, setErrorCount] = useState(0); // 👈 intentos fallidos visibles
  const { login } = useAuth();
  const navigate = useNavigate();

  const URL = "http://localhost:4002/api/v1/auth/authenticate";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    const trimmedPass = password.trim();
    if (!trimmedEmail || !trimmedPass) {
      setError("Completá email y contraseña.");
      setErrorCount((n) => n + 1);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: trimmedEmail, password: trimmedPass }),
      });

      // leemos el body como texto para tolerar backends que no devuelven JSON
      const raw = await res.text();
      let data = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch { }

      if (!res.ok) {
        const msg =
          data?.message || data?.error || data?.detail || raw || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      const token = data?.accessToken || data?.token || data?.access_token || data?.jwt;
      if (!token) throw new Error("El servidor no devolvió token.");
      
      localStorage.setItem("token", token)

      login({ email: trimmedEmail, token });
      setError("");
      setErrorCount(0);
      navigate("/home");
    } catch (err) {

      const msg = (err?.message || "").toLowerCase();

      const isCredencialesInvalidas =
        msg.includes("unauthorized") ||
        msg.includes("forbidden") ||
        msg.includes("bad credentials") ||
        msg.includes("authentication required") ||
        msg.includes("invalid") ||
        msg.includes("401");

      const isServicioNoDisponible =
        msg.includes("service unavailable") ||
        msg.includes("503") ||
        msg.includes("failed to fetch") ||
        msg.includes("networkerror") ||
        msg.includes("network error") ||
        msg.includes("timeout");

      if (isCredencialesInvalidas) {
        setError("Credenciales inválidas. Verificá tu email y contraseña.");
        setErrorCount((n) => n + 1);
      } else if (isServicioNoDisponible) {
        setError("Servicio no disponible. Intentá más tarde.");
        setErrorCount((n) => n + 1);
      } else {
        setError("");
        console.error("Login error (oculto):", err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Kaomoji según intentos fallidos visibles
  const mood =
    errorCount === 0
      ? "◝(ᵔᗜᵔ)◜"
      : errorCount === 1
        ? "(╥﹏╥)"
        : errorCount === 2
          ? "<(ꐦㅍ _ㅍ)>"
          : "∘ ∘ ∘ ( °ヮ° )";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-dark text-white dark:bg-background-light dark:text-black">
      <div className="w-11/12 max-w-md rounded-xl border border-[#4FFFCF]/20 bg-[#1a1a1a] p-8 dark:bg-white dark:border-black/10 dark:shadow-md">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold leading-tight">Bienvenido de nuevo</h2>

          {/* Kaomoji debajo del título */}
          <p
            className="text-2xl md:text-3xl mt-2 select-none transition-all duration-300"
            aria-hidden="true"
          >
            {mood}
          </p>

          <p className="mt-2 text-sm text-white/70 dark:text-black/60">
            Ingresa tus datos para acceder a la cuenta
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-[#4FFFCF]/30 bg-transparent px-4 py-3 text-white placeholder-white/50 focus:border-[#4FFFCF] outline-none dark:text-black dark:placeholder-black/50 dark:bg-white dark:border-black/20 dark:focus:border-[#0ea5a4]"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-[#4FFFCF]/30 bg-transparent px-4 py-3 text-white placeholder-white/50 focus:border-[#4FFFCF] outline-none dark:text-black dark:placeholder-black/50 dark:bg-white dark:border-black/20 dark:focus:border-[#0ea5a4]"
            required
          />

          {error && (
            <p className="text-sm text-red-400 dark:text-red-600" role="alert" aria-live="polite">
              {error}
            </p>
          )}

          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-[#4FFFCF] hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#4FFFCF] py-3 text-sm font-bold text-black hover:bg-[#4FFFCF]/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Iniciando sesión..." : "Login"}
          </button>

          <p className="text-center text-sm mt-6 text-white/70 dark:text-black/60">
            ¿No tenés cuenta?{" "}
            <Link to="/register" className="font-medium text-[#4FFFCF] hover:underline">
              Crear una
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
