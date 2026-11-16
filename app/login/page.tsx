"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, User, KeyRound, ArrowRight, Flame, Sparkles } from "lucide-react";

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
      className="backdrop-blur-xl bg-[#14110f]/90 text-white rounded-3xl p-8 max-w-sm w-full space-y-5 shadow-2xl border border-white/10 relative overflow-hidden z-10"
    >
      {/* Luz decorativa âmbar interna */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="text-center space-y-2 relative z-10">
        <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 text-gray-950 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/25">
          <Flame size={28} className="fill-current text-gray-950" />
        </div>
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
            PAINEL DE GESTÃO
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight">Central Lanches</h2>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            Acesso administrativo e ponto de venda
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold text-center">
          {error}
        </div>
      )}

      <div className="space-y-3.5 relative z-10">
        <div>
          <label className="text-xs font-bold text-gray-300 block mb-1">Usuário</label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              autoFocus
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário"
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500 text-sm font-semibold text-white placeholder-gray-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-300 block mb-1">Senha</label>
          <div className="relative">
            <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500 text-sm font-semibold text-white placeholder-gray-500 transition-all"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !username || !password}
        className="w-full py-3.5 bg-amber-500 text-gray-950 font-black text-sm rounded-xl hover:bg-amber-400 active:scale-95 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <span>{loading ? "Entrando..." : "Acessar Sistema"}</span>
        <ArrowRight size={16} />
      </button>

      <div className="text-center pt-2">
        <a
          href="/menu"
          className="text-xs text-amber-400/90 hover:text-amber-300 transition-colors font-bold inline-flex items-center gap-1.5"
        >
          <span>🍔 Abrir Cardápio de Clientes</span>
          <ArrowRight size={12} />
        </a>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0d0b0a] relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background de lanche gourmet escuro */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1550547660-d9450f859349?w=1600&auto=format&fit=crop&q=80"
          alt="Central Lanches Background"
          className="w-full h-full object-cover opacity-20 filter blur-xs"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b0a] via-[#0d0b0a]/80 to-[#0d0b0a]/90" />
      </div>

      <Suspense fallback={<div className="text-white text-sm">Carregando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
