"use client";

import { useEffect, useState, useRef } from "react";
import { Clock, Check, ChefHat, Bell } from "lucide-react";

type Order = {
  id: string;
  created: string;
  items: string;
  status: string;
  total: number;
  table_num: string;
  note: string | null;
  ready_at: string | null;
  delivered_at: string | null;
};

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pendente", color: "#c32626", bg: "#fef2f2" },
  preparing: { label: "Preparando", color: "#d84416", bg: "#fff0e7" },
  ready: { label: "Pronto!", color: "#16a34a", bg: "#f0fdf4" },
  delivered: { label: "Entregue", color: "#657184", bg: "#f3f5f7" },
};

function playBell() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.3;
    osc.start();
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

export default function CozinhaPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const prevCount = useRef(0);

  async function refresh() {
    try {
      const r = await fetch("/api/orders");
      const d = await r.json();
      setOrders(d.orders || []);
      setLoading(false);

      if (prevCount.current > 0 && d.orders?.length > prevCount.current) {
        playBell();
      }
      prevCount.current = d.orders?.length || 0;
    } catch {}
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  async function updateStatus(id: string, status: string) {
    await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-status", id, status }),
    });
    refresh();
  }

  const pending = orders.filter((o) => o.status === "pending");
  const preparing = orders.filter((o) => o.status === "preparing");
  const ready = orders.filter((o) => o.status === "ready");

  return (
    <div style={{ fontFamily: "Arial, sans-serif", background: "#1d2532", minHeight: "100vh", color: "white" }}>
      <header style={{ padding: "20px 24px", borderBottom: "1px solid #333", display: "flex", alignItems: "center", gap: 12 }}>
        <ChefHat size={28} color="#d84416" />
        <div>
          <strong style={{ fontSize: 22 }}>Cozinha</strong>
          <p style={{ margin: 0, color: "#999", fontSize: 13 }}>Fila de pedidos</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 16, fontSize: 14 }}>
          <span>🔴 {pending.length} pendente{pending.length !== 1 ? "s" : ""}</span>
          <span>🟠 {preparing.length} preparando</span>
          <span>🟢 {ready.length} pronto{ready.length !== 1 ? "s" : ""}</span>
        </div>
      </header>

      {loading ? (
        <p style={{ textAlign: "center", padding: 40, color: "#999" }}>Carregando…</p>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: 80, color: "#666" }}>
          <Bell size={48} style={{ marginBottom: 16 }} />
          <h2>Nenhum pedido pendente</h2>
          <p>Os pedidos aparecerão aqui automaticamente</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, padding: 24 }}>
          {/* Pendentes */}
          <div>
            <h3 style={{ color: "#c32626", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#c32626", display: "inline-block" }} />
              Pendentes ({pending.length})
            </h3>
            {pending.map((o) => (
              <OrderCard key={o.id} order={o} onAdvance={() => updateStatus(o.id, "preparing")} />
            ))}
          </div>

          {/* Preparando */}
          <div>
            <h3 style={{ color: "#d84416", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#d84416", display: "inline-block" }} />
              Preparando ({preparing.length})
            </h3>
            {preparing.map((o) => (
              <OrderCard key={o.id} order={o} onAdvance={() => updateStatus(o.id, "ready")} />
            ))}
          </div>

          {/* Prontos */}
          <div>
            <h3 style={{ color: "#16a34a", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
              Prontos ({ready.length})
            </h3>
            {ready.map((o) => (
              <OrderCard key={o.id} order={o} onAdvance={() => updateStatus(o.id, "delivered")} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, onAdvance }: { order: Order; onAdvance: () => void }) {
  const items = JSON.parse(order.items);
  const created = new Date(order.created);
  const now = new Date();
  const mins = Math.floor((now.getTime() - created.getTime()) / 60000);

  return (
    <div style={{ background: "#2a3545", borderRadius: 12, padding: 16, marginBottom: 12, borderLeft: `4px solid ${statusMap[order.status]?.color || "#666"}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <strong style={{ fontSize: 16 }}>#{order.id.slice(-6).toUpperCase()}</strong>
        {order.table_num && <span style={{ background: "#3a4555", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>Mesa {order.table_num}</span>}
      </div>
      <div style={{ fontSize: 13, marginBottom: 8 }}>
        {items.map((item: any, i: number) => (
          <div key={i} style={{ padding: "2px 0" }}>
            <strong>{item.qty}×</strong> {item.name}
          </div>
        ))}
      </div>
      {order.note && <p style={{ fontSize: 12, color: "#fbbf24", marginBottom: 8 }}>📝 {order.note}</p>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#999", display: "flex", alignItems: "center", gap: 4 }}>
          <Clock size={12} /> {mins}min
        </span>
        <button onClick={onAdvance} style={{ background: statusMap[order.status]?.color || "#666", color: "white", border: "none", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
          {order.status === "pending" && "▶ Iniciar"}
          {order.status === "preparing" && "✓ Pronto"}
          {order.status === "ready" && "✓ Entregue"}
        </button>
      </div>
    </div>
  );
}
