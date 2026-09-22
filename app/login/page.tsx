"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      localStorage.setItem("cl_token", d.token);
      localStorage.setItem("cl_user", JSON.stringify(d.user));
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <style jsx>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .left { flex: 1; background: linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 50%, #2d1b69 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; padding: 48px; position: relative; overflow: hidden; }
        .left::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(232,25,44,0.15) 0%, transparent 60%); animation: pulse 8s ease-in-out infinite; }
        @keyframes pulse { 0%,100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 0.8; } }
        .left h1 { font-size: 48px; font-weight: 800; margin-bottom: 16px; position: relative; z-index: 1; }
        .left h1 span { background: linear-gradient(135deg, #e8192c, #ff6b35); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .left p { font-size: 18px; color: rgba(255,255,255,0.7); max-width: 400px; text-align: center; line-height: 1.6; position: relative; z-index: 1; }
        .right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 48px; background: #f8f9fa; }
        .form-card { width: 100%; max-width: 400px; }
        .form-card h2 { font-size: 28px; font-weight: 800; margin-bottom: 8px; color: #1a1a2e; }
        .form-card .subtitle { font-size: 14px; color: #6c757d; margin-bottom: 32px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-size: 13px; font-weight: 600; color: #495057; margin-bottom: 6px; }
        .form-input { width: 100%; padding: 14px 16px; border-radius: 12px; border: 2px solid #e9ecef; font-size: 15px; background: white; transition: all .2s; outline: none; }
        .form-input:focus { border-color: #e8192c; box-shadow: 0 0 0 4px rgba(232,25,44,0.1); }
        .form-input.error { border-color: #dc2626; }
        .password-wrapper { position: relative; }
        .password-toggle { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 18px; color: #6c757d; }
        .btn { width: 100%; padding: 14px; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .2s; }
        .btn-primary { background: linear-gradient(135deg, #e8192c, #ff4757); color: white; box-shadow: 0 4px 16px rgba(232,25,44,0.3); }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(232,25,44,0.4); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .error-msg { background: #fef2f2; color: #dc2626; padding: 12px 16px; border-radius: 10px; font-size: 13px; margin-bottom: 20px; border: 1px solid #fecaca; }
        .links { text-align: center; margin-top: 24px; font-size: 14px; color: #6c757d; }
        .links a { color: #e8192c; text-decoration: none; font-weight: 600; }
        .links a:hover { text-decoration: underline; }
        .back { position: absolute; top: 24px; left: 24px; color: rgba(255,255,255,0.8); text-decoration: none; font-size: 14px; font-weight: 500; z-index: 10; display: flex; align-items: center; gap: 6px; }
        .divider { height: 1px; background: #e9ecef; margin: 24px 0; }
        @media (max-width: 768px) { .left { display: none; } .right { flex: 1; } }
      `}</style>

      <div className="left">
        <Link href="/home" className="back">← Voltar</Link>
        <h1>Bem-vindo ao<br/><span>Central Lanches</span></h1>
        <p>Acesse seu painel de gestão e acompanhe seu restaurante em tempo real.</p>
      </div>

      <div className="right">
        <div className="form-card">
          <h2>Entrar</h2>
          <p className="subtitle">Acesse sua conta para continuar</p>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input
                className={`form-input ${error ? "error" : ""}`}
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Senha</label>
              <div className="password-wrapper">
                <input
                  className={`form-input ${error ? "error" : ""}`}
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <div className="links">
            Não tem conta? <Link href="/register">Criar conta grátis</Link>
          </div>
          <div className="links" style={{ marginTop: 8 }}>
            <Link href="/home">← Voltar para o site</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
