"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";

function PinForm() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(from);
    } catch (e: any) {
      setError(e.message || "PIN incorreto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleVerify}
      className="bg-white rounded-3xl p-8 max-w-xs w-full text-center space-y-5 shadow-2xl border border-gray-100"
    >
      <div className="w-14 h-14 bg-red-50 text-primary rounded-2xl flex items-center justify-center mx-auto">
        <Lock size={26} />
      </div>
      <div>
        <h2 className="text-xl font-black text-gray-900">Acesso Restrito</h2>
        <p className="text-xs text-gray-500 mt-1">Digite o PIN administrativo para continuar</p>
      </div>

      {error && (
        <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold">
          {error}
        </div>
      )}

      <input
        type="password"
        maxLength={6}
        autoFocus
        required
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        placeholder="••••"
        className="w-full text-center tracking-[1em] text-2xl font-black py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-primary"
      />

      <button
        type="submit"
        disabled={loading || pin.length < 4}
        className="w-full py-3 bg-primary text-white font-extrabold text-sm rounded-xl hover:bg-primary-hover active:scale-95 transition-all shadow-md shadow-red-200 disabled:opacity-50"
      >
        {loading ? "Verificando..." : "Entrar no Sistema"}
      </button>
    </form>
  );
}

export default function PinPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-white text-sm">Carregando...</div>}>
        <PinForm />
      </Suspense>
    </div>
  );
}
