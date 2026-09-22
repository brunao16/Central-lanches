"use client";

import { useEffect, useState } from "react";
import { QrCode, Plus, Trash2, Edit3, Users } from "lucide-react";

type Table = { id: string; number: number; name: string; capacity: number; status: string; current_order: string | null; branch: string };

const statusColor: Record<string, string> = { available: "#16a34a", occupied: "#c32626", reserved: "#f59e0b", cleaning: "#3b82f6" };
const statusLabel: Record<string, string> = { available: "Livre", occupied: "Ocupada", reserved: "Reservada", cleaning: "Limpeza" };

export default function MesasPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [num, setNum] = useState("");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("4");
  const [qrTable, setQrTable] = useState<Table | null>(null);

  async function refresh() {
    const r = await fetch("/api/services?action=tables");
    const d = await r.json();
    setTables(d.tables || []);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function saveTable() {
    if (!num) return alert("Número obrigatório");
    if (editing) {
      await fetch("/api/services", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-table", id: editing, status: "available" }),
      });
    } else {
      await fetch("/api/services", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-table", number: parseInt(num), name: name || `Mesa ${num}`, capacity: parseInt(capacity) }),
      });
    }
    setShowForm(false); setEditing(null); setNum(""); setName(""); setCapacity("4");
    refresh();
  }

  async function deleteTable(id: string) {
    if (!confirm("Excluir mesa?")) return;
    await fetch("/api/services", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete-table", id }),
    });
    refresh();
  }

  function showQR(t: Table) {
    setQrTable(t);
  }

  const tableUrl = (t: Table) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/pedido?table=${t.number}`;
  };

  return (
    <div style={{ fontFamily: "Arial", background: "#f3f5f7", minHeight: "100vh" }}>
      <header style={{ background: "#1d2532", color: "white", padding: "20px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <QrCode size={24} color="#d84416" />
            <strong style={{ fontSize: 20 }}>Mesas</strong>
          </div>
          <button onClick={() => { setShowForm(true); setEditing(null); setNum(""); setName(""); setCapacity("4"); }} style={{ background: "#d84416", color: "white", border: "none", padding: "8px 16px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={16} /> Nova Mesa
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {tables.map(t => (
            <div key={t.id} style={{ background: "white", borderRadius: 12, padding: 16, border: `2px solid ${statusColor[t.status] || "#dce2e8"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <strong style={{ fontSize: 20 }}>#{t.number}</strong>
                <span style={{ background: statusColor[t.status], color: "white", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{statusLabel[t.status]}</span>
              </div>
              <p style={{ color: "#657184", fontSize: 13 }}>{t.name}</p>
              <p style={{ fontSize: 12, color: "#999" }}><Users size={12} style={{ display: "inline" }} /> {t.capacity} lugares</p>
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                <button onClick={() => showQR(t)} style={{ flex: 1, padding: "6px 8px", borderRadius: 6, border: "1px solid #dce2e8", background: "white", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>QR Code</button>
                <button onClick={() => { setEditing(t.id); setNum(String(t.number)); setName(t.name); setCapacity(String(t.capacity)); setShowForm(true); }} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #dce2e8", background: "white", cursor: "pointer" }}><Edit3 size={14} /></button>
                <button onClick={() => deleteTable(t.id)} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #fecaca", background: "#fef2f2", cursor: "pointer" }}><Trash2 size={14} color="#c32626" /></button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setShowForm(false)}>
          <div style={{ background: "white", borderRadius: 12, padding: 24, width: "90%", maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>{editing ? "Editar" : "Nova"} Mesa</h3>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Número</label>
            <input type="number" value={num} onChange={e => setNum(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #dce2e8", marginBottom: 12 }} />
            <label style={{ fontSize: 13, fontWeight: 600 }}>Nome</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Varanda" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #dce2e8", marginBottom: 12 }} />
            <label style={{ fontSize: 13, fontWeight: 600 }}>Capacidade</label>
            <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #dce2e8", marginBottom: 16 }} />
            <button onClick={saveTable} style={{ width: "100%", padding: 12, borderRadius: 8, border: "none", background: "#d84416", color: "white", fontWeight: 700, cursor: "pointer" }}>Salvar</button>
          </div>
        </div>
      )}

      {qrTable && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setQrTable(null)}>
          <div style={{ background: "white", borderRadius: 12, padding: 32, textAlign: "center", width: "90%", maxWidth: 350 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 8 }}>Mesa #{qrTable.number}</h3>
            <p style={{ color: "#657184", fontSize: 13, marginBottom: 16 }}>Escaneie para ver o cardápio e pedir</p>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(tableUrl(qrTable))}`} alt="QR Code" style={{ borderRadius: 8, marginBottom: 16 }} />
            <p style={{ fontSize: 11, color: "#999", wordBreak: "break-all" }}>{tableUrl(qrTable)}</p>
            <button onClick={() => { navigator.clipboard.writeText(tableUrl(qrTable)); alert("Link copiado!"); }} style={{ marginTop: 12, padding: "8px 16px", borderRadius: 8, border: "1px solid #dce2e8", background: "white", cursor: "pointer", fontSize: 13 }}>Copiar Link</button>
          </div>
        </div>
      )}
    </div>
  );
}
