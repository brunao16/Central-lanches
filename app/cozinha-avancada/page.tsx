"use client";

import { useEffect, useState } from "react";
import { ChefHat, Clock, AlertTriangle, CheckCircle2, Flame } from "lucide-react";

type Ticket = { id: string; items: string; status: string; priority: number; total: number; table_num: string; employee: string; created: string; started_at: string | null; ready_at: string | null; note: string | null };

const priorityMap: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: "Normal", color: "#657184", bg: "#f1f5f9" },
  1: { label: "Prioritário", color: "#f59e0b", bg: "#fffbeb" },
  2: { label: "URGENTE", color: "#c32626", bg: "#fef2f2" },
};

export default function CozinhaPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [timers, setTimers] = useState<Record<string, number>>({});

  async function refresh() {
    const r = await fetch("/api/services?action=tickets");
    const d = await r.json();
    setTickets(d.tickets || []);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);
  useEffect(() => { const i = setInterval(refresh, 5000); return () => clearInterval(i); }, []);

  useEffect(() => {
    const i = setInterval(() => {
      setTimers(prev => {
        const next = { ...prev };
        tickets.filter(t => t.status === "preparing" && t.started_at).forEach(t => {
          next[t.id] = Math.floor((Date.now() - new Date(t.started_at!).getTime()) / 1000);
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [tickets]);

  async function updateStatus(id: string, status: string) {
    await fetch("/api/services", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-ticket", id, status }),
    });
    refresh();
  }

  function formatTimer(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  const pending = tickets.filter(t => t.status === "pending").sort((a, b) => b.priority - a.priority);
  const preparing = tickets.filter(t => t.status === "preparing");
  const ready = tickets.filter(t => t.status === "ready");

  return (
    <div style={{ fontFamily: "Arial", background: "#1a1a2e", minHeight: "100vh", color: "white" }}>
      <header style={{ padding: "20px 24px", borderBottom: "1px solid #333" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ChefHat size={28} color="#d84416" />
            <strong style={{ fontSize: 22 }}>Cozinha</strong>
          </div>
          <div style={{ display: "flex", gap: 20, fontSize: 13 }}>
            <span>⏳ Pendentes: <strong style={{ color: "#f59e0b" }}>{pending.length}</strong></span>
            <span>🔥 Preparando: <strong style={{ color: "#d84416" }}>{preparing.length}</strong></span>
            <span>✅ Prontos: <strong style={{ color: "#16a34a" }}>{ready.length}</strong></span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, minHeight: "calc(100vh - 80px)" }}>
        {/* Pendentes */}
        <div>
          <h2 style={{ fontSize: 16, color: "#f59e0b", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><Clock size={18} /> Pedidos ({pending.length})</h2>
          {loading ? <p style={{ color: "#666" }}>Carregando...</p> : pending.length === 0 ? (
            <p style={{ color: "#555", fontSize: 14 }}>Nenhum pedido pendente</p>
          ) : pending.map(t => {
            const p = priorityMap[t.priority] || priorityMap[0];
            const items = JSON.parse(t.items) as any[];
            const createdMins = Math.floor((Date.now() - new Date(t.created).getTime()) / 60000);

            return (
              <div key={t.id} style={{ background: "#16213e", borderRadius: 12, padding: 14, marginBottom: 10, borderLeft: `4px solid ${p.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <strong style={{ fontSize: 14 }}>#{t.id.slice(-4).toUpperCase()}</strong>
                  <span style={{ background: p.bg, color: p.color, padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{p.label}</span>
                </div>
                {t.table_num && <span style={{ fontSize: 12, color: "#999" }}>Mesa {t.table_num}</span>}
                {t.note && <p style={{ fontSize: 12, color: "#f59e0b", marginTop: 4 }}>📝 {t.note}</p>}
                <div style={{ margin: "8px 0" }}>
                  {items.map((it: any, i: number) => (
                    <p key={i} style={{ fontSize: 13, padding: "2px 0" }}>{it.qty || 1}× {it.name}</p>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: "#666" }}>{createdMins}min atrás</span>
                  <button onClick={() => updateStatus(t.id, "preparing")} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#d84416", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>🔥 Iniciar</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Preparando */}
        <div>
          <h2 style={{ fontSize: 16, color: "#d84416", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><Flame size={18} /> Preparando ({preparing.length})</h2>
          {preparing.map(t => {
            const items = JSON.parse(t.items) as any[];
            const timer = timers[t.id] || 0;
            const isSlow = timer > 600;

            return (
              <div key={t.id} style={{ background: isSlow ? "#3d1a1a" : "#1a2332", borderRadius: 12, padding: 14, marginBottom: 10, borderLeft: `4px solid ${isSlow ? "#c32626" : "#3b82f6"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <strong style={{ fontSize: 14 }}>#{t.id.slice(-4).toUpperCase()}</strong>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {isSlow && <AlertTriangle size={14} color="#c32626" />}
                    <span style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: isSlow ? "#c32626" : "#3b82f6" }}>{formatTimer(timer)}</span>
                  </div>
                </div>
                {t.table_num && <span style={{ fontSize: 12, color: "#999" }}>Mesa {t.table_num}</span>}
                <div style={{ margin: "8px 0" }}>
                  {items.map((it: any, i: number) => (
                    <p key={i} style={{ fontSize: 13, padding: "2px 0" }}>{it.qty || 1}× {it.name}</p>
                  ))}
                </div>
                <button onClick={() => updateStatus(t.id, "ready")} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "none", background: "#16a34a", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>✅ Pronto!</button>
              </div>
            );
          })}
        </div>

        {/* Prontos */}
        <div>
          <h2 style={{ fontSize: 16, color: "#16a34a", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><CheckCircle2 size={18} /> Prontos ({ready.length})</h2>
          {ready.map(t => {
            const items = JSON.parse(t.items) as any[];
            return (
              <div key={t.id} style={{ background: "#0f2818", borderRadius: 12, padding: 14, marginBottom: 10, borderLeft: "4px solid #16a34a", opacity: 0.8 }}>
                <strong style={{ fontSize: 14 }}>#{t.id.slice(-4).toUpperCase()}</strong>
                {t.table_num && <span style={{ fontSize: 12, color: "#999", marginLeft: 8 }}>Mesa {t.table_num}</span>}
                <div style={{ margin: "6px 0" }}>
                  {items.map((it: any, i: number) => (
                    <p key={i} style={{ fontSize: 12, color: "#aaa" }}>{it.qty || 1}× {it.name}</p>
                  ))}
                </div>
                <button onClick={() => updateStatus(t.id, "delivered")} style={{ width: "100%", padding: "8px 14px", borderRadius: 8, border: "1px solid #16a34a", background: "transparent", color: "#16a34a", fontWeight: 600, cursor: "pointer", fontSize: 12 }}>Entregue</button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
