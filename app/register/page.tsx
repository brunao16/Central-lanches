"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", restaurantName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }
    if (form.password.length < 6) {
      setError("Senha deve ter no mínimo 6 caracteres.");
      setLoading(false);
      return;
    }

    try {
      const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", ...form }),
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

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [field]: e.target.value });

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <style jsx>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .left { flex: 1; background: linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 50%, #2d1b69 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; padding: 48px; position: relative; overflow: hidden; }
        .left::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(232,25,44,0.15) 0%, transparent 60%); animation: pulse 8s ease-in-out infinite; }
        @keyframes pulse { 0%,100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 0.8; } }
        .left h1 { font-size: 42px; font-weight: 800; margin-bottom: 16px; position: relative; z-index: 1; }
        .left h1 span { background: linear-gradient(135deg, #e8192c, #ff6b35); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .left p { font-size: 16px; color: rgba(255,255,255,0.7); max-width: 400px; text-align: center; line-height: 1.6; position: relative; z-index: 1; }
        .benefits { list-style: none; margin-top: 32px; position: relative; z-index: 1; }
        .benefits li { padding: 10px 0; font-size: 15px; display: flex; align-items: center; gap: 10px; }
        .benefits li::before { content: "✓"; width: 24px; height: 24px; background: rgba(22,163,74,0.2); color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; }
        .right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px; background: #f8f9fa; overflow-y: auto; }
        .form-card { width: 100%; max-width: 440px; }
        .form-card h2 { font-size: 28px; font-weight: 800; margin-bottom: 8px; color: #1a1a2e; }
        .form-card .subtitle { font-size: 14px; color: #6c757d; margin-bottom: 28px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 13px; font-weight: 600; color: #495057; margin-bottom: 6px; }
        .form-input { width: 100%; padding: 12px 14px; border-radius: 10px; border: 2px solid #e9ecef; font-size: 14px; background: white; transition: all .2s; outline: none; }
        .form-input:focus { border-color: #e8192c; box-shadow: 0 0 0 3px rgba(232,25,44,0.1); }
        .form-input.error { border-color: #dc2626; }
        .password-wrapper { position: relative; }
        .password-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 16px; color: #6c757d; }
        .btn { width: 100%; padding: 14px; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .2s; }
        .btn-primary { background: linear-gradient(135deg, #e8192c, #ff4757); color: white; box-shadow: 0 4px 16px rgba(232,25,44,0.3); }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(232,25,44,0.4); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .error-msg { background: #fef2f2; color: #dc2626; padding: 12px 16px; border-radius: 10px; font-size: 13px; margin-bottom: 16px; border: 1px solid #fecaca; }
        .links { text-align: center; margin-top: 20px; font-size: 14px; color: #6c757d; }
        .links a { color: #e8192c; text-decoration: none; font-weight: 600; }
        .links a:hover { text-decoration: underline; }
        .back { position: absolute; top: 24px; left: 24px; color: rgba(255,255,255,0.8); text-decoration: none; font-size: 14px; font-weight: 500; z-index: 10; display: flex; align-items: center; gap: 6px; }
        .trial-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 8px; background: rgba(22,163,74,0.1); color: #16a34a; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
        @media (max-width: 768px) { .left { display: none; } .right { flex: 1; padding: 32px 24px; } }
      `}</style>

      <div className="left">
        <Link href="/home" className="back">← Voltar</Link>
        <h1>Comece seu<br/><span>teste grátis</span></h1>
        <p>7 dias de acesso completo. Sem cartão de crédito. Cancele quando quiser.</p>
        <ul className="benefits">
          <li>Setup completo em 5 minutos</li>
          <li>Migração de dados inclusa</li>
          <li>Suporte por WhatsApp</li>
          <li>Sem taxas de setup</li>
        </ul>
      </div>

      <div className="right">
        <div className="form-card">
          <div className="trial-badge">🎁 Teste grátis por 7 dias</div>
          <h2>Criar conta</h2>
          <p className="subtitle">Comece gratuitamente. Sem compromisso.</p>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Seu nome</label>
              <input className="form-input" type="text" placeholder="Nome completo" value={form.name} onChange={update("name")} required autoFocus />
            </div>

            <div className="form-group">
              <label>Nome do restaurante</label>
              <input className="form-input" type="text" placeholder="Ex.: Burguer House" value={form.restaurantName} onChange={update("restaurantName")} required />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input className="form-input" type="email" placeholder="seu@email.com" value={form.email} onChange={update("email")} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Senha</label>
                <div className="password-wrapper">
                  <input className="form-input" type={showPassword ? "text" : "password"} placeholder="Mín. 6 caracteres" value={form.password} onChange={update("password")} required />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Confirmar senha</label>
                <input className="form-input" type="password" placeholder="Repita a senha" value={form.confirmPassword} onChange={update("confirmPassword")} required />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Criando conta…" : "Criar conta grátis"}
            </button>
          </form>

          <div className="links">
            Já tem conta? <Link href="/login">Entrar</Link>
          </div>
          <div className="links" style={{ marginTop: 8 }}>
            <Link href="/home">← Voltar para o site</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
