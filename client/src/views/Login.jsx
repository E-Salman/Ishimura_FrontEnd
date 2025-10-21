import React, { useState } from "react";
<h1 className="text-3xl font-bold text-red-500">Tailwind v3 OK</h1>

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });

  const onSubmit = (e) => {
    e.preventDefault();
    alert(`Login: ${form.email}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-11/12 max-w-md rounded-xl border border-[#4FFFCF]/20 bg-[#1a1a1a] p-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
          <p className="mt-2 text-sm text-white/70">
            Enter your credentials to access your account.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="text"
            name="email"
            placeholder="Email or Username"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-[#4FFFCF]/30 bg-transparent px-4 py-3 text-white placeholder-white/50 focus:border-[#4FFFCF] outline-none"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-lg border border-[#4FFFCF]/30 bg-transparent px-4 py-3 text-white placeholder-white/50 focus:border-[#4FFFCF] outline-none"
            required
          />

          <div className="text-right">
            <a href="#" className="text-sm font-medium text-[#4FFFCF] hover:underline">
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-[#4FFFCF] py-3 text-sm font-bold text-black hover:bg-[#4FFFCF]/90"
          >
            Login
          </button>

          <p className="text-center text-sm text-white/70 mt-6">
            Don’t have an account?{" "}
            <a href="#" className="font-medium text-[#4FFFCF] hover:underline">
              Create one
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
