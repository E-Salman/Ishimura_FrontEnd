// src/views/ForgotPassword.jsx
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

export default function ForgotPassword() {
  const [params] = useSearchParams();
  const token = params.get("token"); // si viene ?token=... => modo reset
  const navigate = useNavigate();

  // estados compartidos
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ENDPOINTS — ajustá si tus rutas son distintas
  const URL_REQUEST = "http://localhost:4002/api/v1/auth/forgot-password";
  const URL_RESET   = "http://localhost:4002/api/v1/auth/reset-password";

  const handleRequestLink = async (e) => {
    e.preventDefault();
    setMsg(""); setError("");

    // validación simple de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Ingresá un email válido.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(URL_REQUEST, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) throw new Error("No se pudo enviar el correo.");
      setMsg("Te enviamos un enlace para restablecer tu contraseña 💌");
    } catch (err) {
      setError("No pudimos procesar la solicitud. Intentá más tarde.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMsg(""); setError("");

    if (!token) {
      setError("El enlace no es válido.");
      return;
    }
    if (password.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(URL_RESET, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (!res.ok) throw new Error("Error al cambiar la contraseña.");
      setMsg("¡Contraseña actualizada! Redirigiendo al login…");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError("El enlace expiró o no es válido.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isResetMode = Boolean(token);

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-white dark:text-black">
      <div className="w-full max-w-md space-y-8 bg-[#1a1a1a] dark:bg-white rounded-xl p-8 shadow-lg border border-[#4FFFCF]/20">
        <div className="text-center">
          <h2 className="text-3xl font-bold">
            {isResetMode ? "Restablecer contraseña" : "¿Olvidaste tu contraseña?"}
          </h2>
          <p className="mt-2 text-sm text-white/70 dark:text-black/60">
            {isResetMode
              ? "Ingresá tu nueva contraseña para continuar."
              : "Ingresá tu email y te enviaremos un enlace de recuperación."}
          </p>
        </div>

        {/* Formulario condicional */}
        {!isResetMode ? (
          <form onSubmit={handleRequestLink} className="mt-8 space-y-6">
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[#4FFFCF]/30 bg-transparent px-4 py-3 text-white placeholder-white/50
                         focus:border-[#4FFFCF] outline-none
                         dark:text-black dark:placeholder-black/50 dark:bg-white dark:border-black/20 dark:focus:border-[#0ea5a4]"
            />

            {msg && <p className="text-sm text-emerald-400 dark:text-emerald-700">{msg}</p>}
            {error && <p className="text-sm text-red-400 dark:text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#4FFFCF] py-3 text-sm font-bold text-black hover:bg-[#4FFFCF]/90
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-sm font-medium text-[#4FFFCF] hover:underline">
                Volver al inicio de sesión
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="mt-8 space-y-6">
            <input
              type="password"
              placeholder="Nueva contraseña"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[#4FFFCF]/30 bg-transparent px-4 py-3 text-white placeholder-white/50
                         focus:border-[#4FFFCF] outline-none
                         dark:text-black dark:placeholder-black/50 dark:bg-white dark:border-black/20 dark:focus:border-[#0ea5a4]"
            />

            <input
              type="password"
              placeholder="Confirmar contraseña"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-[#4FFFCF]/30 bg-transparent px-4 py-3 text-white placeholder-white/50
                         focus:border-[#4FFFCF] outline-none
                         dark:text-black dark:placeholder-black/50 dark:bg-white dark:border-black/20 dark:focus:border-[#0ea5a4]"
            />

            {msg && <p className="text-sm text-emerald-400 dark:text-emerald-700">{msg}</p>}
            {error && <p className="text-sm text-red-400 dark:text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#4FFFCF] py-3 text-sm font-bold text-black hover:bg-[#4FFFCF]/90
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Guardando..." : "Cambiar contraseña"}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-sm font-medium text-[#4FFFCF] hover:underline">
                Volver al inicio de sesión
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
