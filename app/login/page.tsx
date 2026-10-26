"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, User, KeyRound, ArrowRight } from "lucide-react";

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Acesso não autorizado");

      router.push(from);
      router.refresh();
    } catch (e: any) {
      setError(e.message || "Usuário ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleLogin}
      className="bg-white rounded-3xl p-8 max-w-sm w-full space-y-5 shadow-2xl border border-gray-100"
    >
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-red-50 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-red-100">
          <Lock size={28} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Central Lanches</h2>
        <p className="text-xs text-gray-500 font-medium">Acesso restrito à gestão e caixa</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold text-center">
          {error}
        </div>
      )}

      <div className="space-y-3.5">
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1">Usuário</label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              autoFocus
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-sm font-semibold"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1">Senha</label>
          <div className="relative">
            <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary text-sm font-semibold"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !username || !password}
        className="w-full py-3 bg-primary text-white font-extrabold text-sm rounded-xl hover:bg-primary-hover active:scale-95 transition-all shadow-md shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <span>{loading ? "Entrando..." : "Acessar Sistema"}</span>
        <ArrowRight size={16} />
      </button>

      <div className="text-center">
        <a
          href="/menu"
          className="text-xs text-gray-400 hover:text-primary transition-colors font-semibold"
        >
          🍔 Ir para o Cardápio de Clientes
        </a>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-white text-sm">Carregando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
