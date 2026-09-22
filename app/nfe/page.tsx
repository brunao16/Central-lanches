"use client";

import { useEffect, useState } from "react";
import { FileText, Search, Printer } from "lucide-react";

type NFe = { id: string; sale_id: string; number: number; cpf_cnpj: string; created: string; status: string };

export default function NFePage() {
  const [nfes, setNfes] = useState<NFe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saleId, setSaleId] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const r = await fetch("/api/services?action=nfes");
    const d = await r.json();
    setNfes(d.nfes || []);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function emitNfe() {
    if (!saleId) return alert("ID da venda obrigatório");
    setBusy(true);
    const r = await fetch("/api/services", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "emit-nfe", saleId, cpfCnpj }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return alert(d.error);
    alert(`NF-e #${d.number} emitida com sucesso!`);
    setSaleId(""); setCpfCnpj(""); refresh();
  }

  const filtered = nfes.filter(n => !search || n.number.toString().includes(search) || n.sale_id.includes(search) || n.cpf_cnpj.includes(search));

  return (
    <div style={{ fontFamily: "Arial", background: "#f3f5f7", minHeight: "100vh" }}>
      <header style={{ background: "#1d2532", color: "white", padding: "20px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <FileText size={24} color="#d84416" />
          <strong style={{ fontSize: 20 }}>Nota Fiscal</strong>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
        <div style={{ background: "white", borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h3 style={{ marginBottom: 12 }}>Emitir NF-e</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>ID da Venda</label>
              <input value={saleId} onChange={e => setSaleId(e.target.value)} placeholder="UUID da venda" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #dce2e8", fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>CPF/CNPJ (opcional)</label>
              <input value={cpfCnpj} onChange={e => setCpfCnpj(e.target.value)} placeholder="000.000.000-00" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #dce2e8", fontSize: 13 }} />
            </div>
          </div>
          <button onClick={emitNfe} disabled={busy || !saleId} style={{ marginTop: 12, padding: "10px 20px", borderRadius: 8, border: "none", background: "#d84416", color: "white", fontWeight: 700, cursor: "pointer" }}>{busy ? "Emitindo..." : "Emitir NF-e"}</button>
        </div>

        <div style={{ position: "relative", marginBottom: 12 }}>
          <Search size={16} style={{ position: "absolute", left: 10, top: 11, color: "#999" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar NF-e..." style={{ width: "100%", padding: "10px 10px 10px 34px", borderRadius: 8, border: "1px solid #dce2e8", fontSize: 14 }} />
        </div>

        {loading ? <p className="notice">Carregando...</p> : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#657184" }}><FileText size={40} /><h2>Nenhuma NF-e</h2></div>
        ) : (
          <div style={{ background: "white", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ background: "#f8fafc" }}>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>Nº</th>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>Venda</th>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>CPF/CNPJ</th>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>Data</th>
                <th style={{ padding: "10px 12px", textAlign: "left" }}>Status</th>
              </tr></thead>
              <tbody>
                {filtered.map(n => (
                  <tr key={n.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700 }}>#{String(n.number).padStart(6, "0")}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#657184" }}>{n.sale_id.slice(0, 8)}...</td>
                    <td style={{ padding: "10px 12px" }}>{n.cpf_cnpj || "—"}</td>
                    <td style={{ padding: "10px 12px" }}>{new Date(n.created).toLocaleDateString("pt-BR")}</td>
                    <td style={{ padding: "10px 12px" }}><span style={{ background: "#f0fdf4", color: "#16a34a", padding: "2px 8px", borderRadius: 8, fontSize: 11 }}>{n.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
