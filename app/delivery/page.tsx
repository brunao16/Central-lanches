"use client";

import { useEffect, useState } from "react";
import { Package, Clock, Truck, CheckCircle, MapPin, Phone, User } from "lucide-react";

type Delivery = {
  id: string; sale_id: string; customer_name: string; customer_phone: string;
  customer_address: string; status: string; driver: string; created: string;
  picked_at: string | null; delivered_at: string | null; note: string | null;
};

const statusMap: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending: { label: "Aguardando", icon: Clock, color: "#f59e0b", bg: "#fffbeb" },
  accepted: { label: "Aceito", icon: User, color: "#3b82f6", bg: "#eff6ff" },
  picked: { label: "Saiu para entrega", icon: Truck, color: "#d84416", bg: "#fff0e7" },
  delivered: { label: "Entregue", icon: CheckCircle, color: "#16a34a", bg: "#f0fdf4" },
};

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  async function refresh() {
    const params = new URLSearchParams({ action: "deliveries" });
    if (filter) params.set("status", filter);
    const r = await fetch("/api/services?" + params);
    const d = await r.json();
    setDeliveries(d.deliveries || []);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, [filter]);
  useEffect(() => { const i = setInterval(refresh, 10000); return () => clearInterval(i); }, [filter]);

  async function updateStatus(id: string, status: string) {
    await fetch("/api/services", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update-delivery", id, status }),
    });
    refresh();
  }

  return (
    <div style={{ fontFamily: "Arial", background: "#f3f5f7", minHeight: "100vh" }}>
      <header style={{ background: "#1d2532", color: "white", padding: "20px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <Truck size={24} color="#d84416" />
          <strong style={{ fontSize: 20 }}>Delivery</strong>
          <span style={{ marginLeft: "auto", color: "#999", fontSize: 13 }}>{deliveries.length} pedidos</span>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {["", "pending", "accepted", "picked", "delivered"].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: "8px 16px", borderRadius: 20, border: filter === s ? "2px solid #d84416" : "1px solid #dce2e8", background: filter === s ? "#fff0e7" : "white", cursor: "pointer", fontSize: 13, fontWeight: filter === s ? 700 : 400 }}>
              {s === "" ? "Todos" : statusMap[s]?.label}
            </button>
          ))}
        </div>

        {loading ? <p className="notice">Carregando…</p> : deliveries.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#657184" }}><Package size={48} /><h2>Nenhum delivery</h2></div>
        ) : deliveries.map(d => {
          const s = statusMap[d.status] || statusMap.pending;
          const Icon = s.icon;
          const created = new Date(d.created);
          const mins = Math.floor((Date.now() - created.getTime()) / 60000);

          return (
            <div key={d.id} style={{ background: "white", borderRadius: 12, padding: 16, marginBottom: 12, borderLeft: `4px solid ${s.color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Icon size={18} color={s.color} />
                    <strong style={{ color: s.color }}>{s.label}</strong>
                    <span style={{ color: "#999", fontSize: 12 }}>{mins}min</span>
                  </div>
                  <strong style={{ fontSize: 16 }}>{d.customer_name}</strong>
                </div>
                <span style={{ background: s.bg, color: s.color, padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>#{d.id.slice(-6).toUpperCase()}</span>
              </div>

              <div style={{ fontSize: 13, color: "#657184", marginBottom: 8 }}>
                <p><MapPin size={14} style={{ display: "inline" }} /> {d.customer_address}</p>
                {d.customer_phone && <p><Phone size={14} style={{ display: "inline" }} /> {d.customer_phone}</p>}
                {d.note && <p style={{ color: "#f59e0b" }}>📝 {d.note}</p>}
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {d.status === "pending" && <button onClick={() => updateStatus(d.id, "accepted")} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#3b82f6", color: "white", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Aceitar</button>}
                {d.status === "accepted" && <button onClick={() => updateStatus(d.id, "picked")} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#d84416", color: "white", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Saiu para entrega</button>}
                {d.status === "picked" && <button onClick={() => updateStatus(d.id, "delivered")} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#16a34a", color: "white", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Entregue</button>}
                {d.customer_phone && <a href={`https://wa.me/55${d.customer_phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #dce2e8", background: "white", cursor: "pointer", fontSize: 13, textDecoration: "none", color: "#1d2532" }}>WhatsApp</a>}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
