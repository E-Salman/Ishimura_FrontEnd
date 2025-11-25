// src/views/Register.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  clearRegisterState,
  registerUser,
} from "../redux/registerSlice.js";

export default function Register() {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    direccion: "",
    email: "",
    password: "",
  });
  const [okMsg, setOkMsg] = useState("");
  const [validationError, setValidationError] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.register);

  useEffect(() => {
    return () => {
      dispatch(clearRegisterState());
    };
  }, [dispatch]);

  const validate = () => {
    if (form.password.trim().length < 4) {
      return "La contraseña debe tener al menos 4 caracteres.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      return "Ingresá un email válido.";
    }
    return "";
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setOkMsg("");
    setValidationError("");

    const validation = validate();
    if (validation) {
      setValidationError(validation);
      dispatch(clearRegisterState());
      return;
    }

    dispatch(registerUser({ ...form }))
      .unwrap()
      .then(() => {
    
        setOkMsg("¡Cuenta creada!");
        setTimeout(() => navigate("/home"), 700);
      })
      .catch(() => {
     
      });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-dark text-white dark:bg-background-light dark:text-black">
      <div className="w-11/12 max-w-md rounded-xl border border-[#4FFFCF]/20 bg-[#1a1a1a] p-8 dark:bg-white dark:border-black/10 dark:shadow-md">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold">Create your account</h2>
          <p className="mt-2 text-sm text-white/70 dark:text-black/60">
            Join the collector’s universe.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="text"
            name="nombre"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full rounded-lg border border-[#4FFFCF]/30 bg-transparent px-4 py-3 text-white placeholder-white/50 focus:border-[#4FFFCF] outline-none dark:text-black dark:placeholder-black/50 dark:bg-white dark:border-black/20 dark:focus:border-[#0ea5a4]"
            required
          />

          <input
            type="text"
            name="apellido"
            placeholder="Apellido"
            value={form.apellido}
            onChange={(e) => setForm({ ...form, apellido: e.target.value })}
            className="w-full rounded-lg border border-[#4FFFCF]/30 bg-transparent px-4 py-3 text-white placeholder-white/50 focus:border-[#4FFFCF] outline-none dark:text-black dark:placeholder-black/50 dark:bg-white dark:border-black/20 dark:focus:border-[#0ea5a4]"
            required
          />

          <input
            type="text"
            name="direccion"
            placeholder="Dirección"
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            className="w-full rounded-lg border border-[#4FFFCF]/30 bg-transparent px-4 py-3 text-white placeholder-white/50 focus:border-[#4FFFCF] outline-none dark:text-black dark:placeholder-black/50 dark:bg-white dark:border-black/20 dark:focus:border-[#0ea5a4]"
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-[#4FFFCF]/30 bg-transparent px-4 py-3 text-white placeholder-white/50 focus:border-[#4FFFCF] outline-none dark:text-black dark:placeholder-black/50 dark:bg-white dark:border-black/20 dark:focus:border-[#0ea5a4]"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-lg border border-[#4FFFCF]/30 bg-transparent px-4 py-3 text-white placeholder-white/50 focus:border-[#4FFFCF] outline-none dark:text-black dark:placeholder-black/50 dark:bg-white dark:border-black/20 dark:focus:border-[#0ea5a4]"
            required
          />

          {(validationError || error) && (
            <p className="text-sm text-red-400 dark:text-red-600">
              {validationError || error}
            </p>
          )}
          {okMsg && (
            <p className="text-sm text-emerald-400 dark:text-emerald-700">
              {okMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#4FFFCF] py-3 text-sm font-bold text-black hover:bg-[#4FFFCF]/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Register"}
          </button>

          <p className="text-center text-sm mt-6 text-white/70 dark:text-black/60">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-[#4FFFCF] hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
