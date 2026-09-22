"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlanBadge } from "@/components/plan-gate";

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("cl_user");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      setName(u.name || "");
      setEmail(u.email || "");
    }
    setLoading(false);
  }, []);

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, sans-serif" }}>Carregando…</div>;

  async function handleSave() {
    setSaving(true);
    setMsg("");
    try {
      const token = localStorage.getItem("cl_token");
      await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-profile", name, email, token }),
      });
      const updated = { ...user, name, email };
      localStorage.setItem("cl_user", JSON.stringify(updated));
      setUser(updated);
      setMsg("Perfil atualizado!");
    } catch {
      setMsg("Erro ao salvar.");
    }
    setSaving(false);
  }

  function handleLogout() {
    localStorage.removeItem("cl_user");
    localStorage.removeItem("cl_token");
    localStorage.removeItem("cl_onboarded");
    document.cookie = "cl_token=; path=/; max-age=0";
    window.location.href = "/login";
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ user }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `central-lanches-conta-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <style jsx>{`
        .header { background: white; border-bottom: 1px solid #e9ecef; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
        .header h1 { font-size: 18px; font-weight: 700; }
        .container { max-width: 600px; margin: 0 auto; padding: 32px 24px; }
        .card { background: white; border-radius: 16px; padding: 28px; border: 1px solid #e9ecef; margin-bottom: 20px; }
        .card h3 { font-size: 16px; font-weight: 700; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f3f4f6; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 13px; font-weight: 600; color: #495057; margin-bottom: 6px; }
        .form-input { width: 100%; padding: 12px 14px; border-radius: 10px; border: 2px solid #e9ecef; font-size: 14px; transition: all .2s; outline: none; }
        .form-input:focus { border-color: #e8192c; box-shadow: 0 0 0 3px rgba(232,25,44,0.1); }
        .btn { padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; border: none; transition: all .2s; text-decoration: none; display: inline-block; }
        .btn-primary { background: linear-gradient(135deg, #e8192c, #ff4757); color: white; }
        .btn-primary:hover { transform: translateY(-1px); }
        .btn-outline { background: white; color: #e8192c; border: 2px solid #e8192c; }
        .btn-outline:hover { background: #fff0f0; }
        .btn-danger { background: white; color: #dc2626; border: 2px solid #fecaca; }
        .btn-danger:hover { background: #fef2f2; }
        .btn-ghost { background: transparent; color: #6c757d; padding: 12px 16px; }
        .btn-ghost:hover { color: #1a1a2e; }
        .msg { padding: 10px 16px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; }
        .msg-ok { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .msg-err { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .actions { display: flex; gap: 12; flex-wrap: wrap; }
        .row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
        .row:last-child { border: none; }
        .row-info h4 { font-size: 14px; font-weight: 600; }
        .row-info p { font-size: 12px; color: #6c757d; }
        .danger-zone { border-color: #fecaca; }
        .danger-zone h3 { color: #dc2626; }
      `}</style>

      <div className="header">
        <Link href="/" style={{ textDecoration: "none", color: "inherit" }}><h1>← Central Lanches</h1></Link>
        <PlanBadge plan={user?.plan || "basico"} />
      </div>

      <div className="container">
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Minha Conta</h1>
        <p style={{ fontSize: 14, color: "#6c757d", marginBottom: 32 }}>Gerencie seu perfil e configurações.</p>

        <div className="card">
          <h3>Perfil</h3>
          {msg && <div className={`msg ${msg.includes("Erro") ? "msg-err" : "msg-ok"}`}>{msg}</div>}
          <div className="form-group">
            <label>Nome</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>

        <div className="card">
          <h3>Assinatura</h3>
          <div className="row">
            <div className="row-info">
              <h4>Plano atual</h4>
              <p>{(user?.plan || "basico").charAt(0).toUpperCase() + (user?.plan || "basico").slice(1)}</p>
            </div>
            <Link href="/billing" className="btn btn-outline" style={{ fontSize: 13, padding: "8px 16px" }}>Gerenciar</Link>
          </div>
          <div className="row">
            <div className="row-info">
              <h4>Status</h4>
              <p>Ativo</p>
            </div>
            <span style={{ color: "#16a34a", fontSize: 13, fontWeight: 600 }}>● Ativo</span>
          </div>
        </div>

        <div className="card">
          <h3>Dados</h3>
          <div className="row">
            <div className="row-info">
              <h4>Exportar meus dados</h4>
              <p>Baixe uma cópia de todos os seus dados</p>
            </div>
            <button className="btn btn-outline" style={{ fontSize: 13, padding: "8px 16px" }} onClick={exportData}>Exportar</button>
          </div>
        </div>

        <div className="card danger-zone">
          <h3>Zona de perigo</h3>
          <div className="row">
            <div className="row-info">
              <h4>Sair da conta</h4>
              <p>Desconectar deste dispositivo</p>
            </div>
            <button className="btn btn-danger" style={{ fontSize: 13, padding: "8px 16px" }} onClick={handleLogout}>Sair</button>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link href="/" style={{ color: "#6c757d", fontSize: 14, textDecoration: "none" }}>← Voltar para o painel</Link>
        </div>
      </div>
    </div>
  );
}
