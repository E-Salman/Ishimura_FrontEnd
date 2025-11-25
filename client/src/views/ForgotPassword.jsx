// src/views/ForgotPassword.jsx
import axios from "axios";
import { useState } from "react";
import { Link } from "react-router-dom";

const BASE = "http://localhost:4002";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE}/auth/forgot-password`, { email });
      alert(`Te enviamos un enlace de reset a: ${email}`);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "No se pudo enviar el correo";
      alert(msg);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Forgot Your Password?</h2>
          <p className="mt-2 text-sm text-white/60">
            No worries! Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-lg border border-gray-700 bg-black px-3 py-3 text-white placeholder-white/50 focus:border-primary focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-black hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Send Reset Link
          </button>
        </form>

        <div className="text-center">
          <Link to="/login" className="text-sm font-medium text-primary hover:text-primary/80">
            Back to Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
