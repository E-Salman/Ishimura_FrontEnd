import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { authLogin } from "../redux/loginSlice.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { loading, error, kaomojiCount } = useSelector((state) => state.login);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [uiError, setUiError] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    const trimmedPass = password.trim();

    dispatch(authLogin({ email: trimmedEmail, password: trimmedPass }))
      .unwrap()
      .then(() => {
        navigate("/home");
      })
      .catch(() => {
        setUiError("Email o contraseña incorrectos")
      });
  };

  const mood =
    kaomojiCount === 0
      ? "◝(ᵔᗜᵔ)◜"
      : kaomojiCount === 1
        ? "(╥﹏╥)"
        : kaomojiCount === 2
          ? "<(ꐦㅍ _ㅍ)>"
          : "∘ ∘ ∘ ( °ヮ° )";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-dark text-white dark:bg-background-light dark:text-black">
      <div className="w-11/12 max-w-md rounded-xl border border-[#4FFFCF]/20 bg-[#1a1a1a] p-8 dark:bg-white dark:border-black/10 dark:shadow-md">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold leading-tight">Bienvenido de nuevo</h2>

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

          {(uiError || error) && (
            <p className="text-sm text-red-400 dark:text-red-600">
              {uiError || error}
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
            <Link
              to="/register"
              className="font-medium text-[#4FFFCF] hover:underline"
            >
              Crear una
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}