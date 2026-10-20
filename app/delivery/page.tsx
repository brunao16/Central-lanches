"use client";

import { useEffect, useState } from "react";
import { Package, Clock, Truck, CheckCircle, MapPin, Phone, User } from "lucide-react";

type Delivery = {
  id: string; saleId: string; customerName: string; customerPhone: string;
  customerAddress: string; status: string; driver: string; created: string;
  pickedAt: string | null; deliveredAt: string | null; note: string | null;
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

  function printDeliverySlip(d: Delivery) {
    const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Canhoto Delivery #${d.id.slice(-6).toUpperCase()}</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; width: 72mm; margin: 4mm auto; color: #000; font-size: 13px; line-height: 1.3; }
    .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
    .title { font-size: 18px; font-weight: 900; }
    .box { border: 1px solid #000; padding: 8px; border-radius: 4px; margin: 8px 0; }
    .badge { display: inline-block; background: #000; color: #fff; font-size: 14px; font-weight: 800; padding: 2px 6px; border-radius: 4px; }
    .footer { text-align: center; font-size: 11px; margin-top: 10px; border-top: 1px dashed #000; padding-top: 6px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">🛵 CENTRAL LANCHES</div>
    <div style="font-weight: bold; font-size: 14px;">CANHOTO DE ENTREGA</div>
    <div class="badge">#${d.id.slice(-6).toUpperCase()}</div>
    <div style="font-size: 11px; margin-top: 4px;">Data: ${now}</div>
  </div>

  <div class="box">
    <div style="font-size: 11px; text-transform: uppercase; color: #555;">Destinatário:</div>
    <div style="font-size: 15px; font-weight: bold;">${d.customerName}</div>
    <div style="font-size: 13px; margin-top: 4px;">📞 ${d.customerPhone || "Sem telefone"}</div>
    <div style="margin-top: 6px; font-size: 13px; font-weight: bold;">📍 Endereço:</div>
    <div style="font-size: 14px;">${d.customerAddress}</div>
    ${d.note ? `<div style="margin-top: 6px; color: #000; font-style: italic;">📝 Obs: ${d.note}</div>` : ""}
  </div>

  <div style="margin-top: 12px; font-size: 12px;">
    Assinatura do Recebedor:<br><br>
    __________________________________
  </div>

  <div class="footer">
    Bom trabalho e dirija com cuidado! 🏍️
  </div>
  <script>
    window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
  </script>
</body>
</html>`;
    const win = window.open("", "_blank", "width=380,height=500");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
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
                  <strong style={{ fontSize: 16 }}>{d.customerName}</strong>
                </div>
                <span style={{ background: s.bg, color: s.color, padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>#{d.id.slice(-6).toUpperCase()}</span>
              </div>

              <div style={{ fontSize: 13, color: "#657184", marginBottom: 8 }}>
                <p><MapPin size={14} style={{ display: "inline" }} /> {d.customerAddress}</p>
                {d.customerPhone && <p><Phone size={14} style={{ display: "inline" }} /> {d.customerPhone}</p>}
                {d.note && <p style={{ color: "#f59e0b" }}>📝 {d.note}</p>}
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <button onClick={() => printDeliverySlip(d)} title="Imprimir canhoto do motoboy" style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #1d2532", background: "white", color: "#1d2532", cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                  🖨️ Canhoto
                </button>
                {d.status === "pending" && <button onClick={() => updateStatus(d.id, "accepted")} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#3b82f6", color: "white", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Aceitar</button>}
                {d.status === "accepted" && <button onClick={() => updateStatus(d.id, "picked")} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#d84416", color: "white", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Saiu para entrega</button>}
                {d.status === "picked" && <button onClick={() => updateStatus(d.id, "delivered")} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#16a34a", color: "white", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Entregue</button>}
                {d.customerPhone && <a href={`https://wa.me/55${d.customerPhone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #dce2e8", background: "white", cursor: "pointer", fontSize: 13, textDecoration: "none", color: "#1d2532" }}>WhatsApp</a>}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
