"use client";

import { useEffect, useState } from "react";
import { Star, Award, TrendingUp, Gift } from "lucide-react";

type LoyaltyData = { id: string; customer_id: string; points: number; total_earned: number; total_redeemed: number; tier: string };
type Txn = { id: string; customer_id: string; type: string; points: number; description: string; created: string };

const tierConfig: Record<string, { label: string; color: string; bg: string; icon: any; discount: string }> = {
  bronze: { label: "Bronze", color: "#cd7f32", bg: "#fdf2e4", icon: Award, discount: "5%" },
  prata: { label: "Prata", color: "#94a3b8", bg: "#f1f5f9", icon: Star, discount: "10%" },
  gold: { label: "Ouro", color: "#f59e0b", bg: "#fffbeb", icon: TrendingUp, discount: "15%" },
};

export default function FidelidadePage() {
  const [loyaltyList, setLoyaltyList] = useState<LoyaltyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [addPoints, setAddPoints] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [redeemPoints, setRedeemPoints] = useState("");

  async function refresh() {
    const r = await fetch("/api/services?action=loyalty");
    const d = await r.json();
    setLoyaltyList(d.loyalty || []);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function loadDetails(customerId: string) {
    setSelected(customerId);
    const r = await fetch(`/api/services?action=loyalty&customerId=${customerId}`);
    const d = await r.json();
    setTxns(d.transactions || []);
  }

  async function addLoyaltyPoints() {
    if (!selected || !addPoints) return;
    await fetch("/api/services", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add-points", customerId: selected, points: parseInt(addPoints), description: addDesc || "Bônus" }),
    });
    setAddPoints(""); setAddDesc(""); refresh(); loadDetails(selected);
  }

  async function redeemLoyaltyPoints() {
    if (!selected || !redeemPoints) return;
    const r = await fetch("/api/services", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "redeem-points", customerId: selected, points: parseInt(redeemPoints), description: "Resgate de desconto" }),
    });
    const d = await r.json();
    if (!r.ok) return alert(d.error);
    setRedeemPoints(""); refresh(); loadDetails(selected);
  }

  const filtered = loyaltyList.filter(l => !search || l.customer_id.toLowerCase().includes(search.toLowerCase()));
  const selectedData = loyaltyList.find(l => l.customer_id === selected);

  return (
    <div style={{ fontFamily: "Arial", background: "#f3f5f7", minHeight: "100vh" }}>
      <header style={{ background: "#1d2532", color: "white", padding: "20px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <Star size={24} color="#f59e0b" />
          <strong style={{ fontSize: 20 }}>Fidelidade</strong>
          <span style={{ marginLeft: "auto", color: "#999", fontSize: 13 }}>{loyaltyList.length} clientes</span>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..." style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #dce2e8", fontSize: 14, marginBottom: 16 }} />

        {loading ? <p className="notice">Carregando...</p> : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#657184" }}><Star size={48} /><h2>Nenhum cliente ainda</h2><p>Os pontos são adicionados automaticamente nas vendas.</p></div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
            {filtered.map(l => {
              const tc = tierConfig[l.tier] || tierConfig.bronze;
              const Icon = tc.icon;
              return (
                <div key={l.id} onClick={() => loadDetails(l.customer_id)} style={{ background: "white", borderRadius: 12, padding: 16, cursor: "pointer", border: selected === l.customer_id ? `2px solid ${tc.color}` : "2px solid transparent", transition: "border .2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <strong style={{ fontSize: 16 }}>{l.customer_id}</strong>
                    <span style={{ background: tc.bg, color: tc.color, padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}><Icon size={12} style={{ display: "inline" }} /> {tc.label}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span>⭐ {l.points} pts</span>
                    <span>💰 {tc.discount} desconto</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                    Ganho: {l.total_earned} · Resgatado: {l.total_redeemed}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selected && selectedData && (
          <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 360, background: "white", boxShadow: "-4px 0 20px rgba(0,0,0,.15)", zIndex: 50, overflow: "auto", padding: 20 }}>
            <button onClick={() => setSelected(null)} style={{ border: "none", background: "none", fontSize: 14, color: "#d84416", cursor: "pointer", marginBottom: 16 }}>← Fechar</button>
            <h3>{selected}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: "#d84416" }}>{selectedData.points} pts</span>
              <span style={{ background: tierConfig[selectedData.tier]?.bg, color: tierConfig[selectedData.tier]?.color, padding: "4px 10px", borderRadius: 10, fontSize: 12, fontWeight: 600 }}>{tierConfig[selectedData.tier]?.label}</span>
            </div>

            <div style={{ marginTop: 16, padding: 12, background: "#f8fafc", borderRadius: 8 }}>
              <strong style={{ fontSize: 13 }}>Adicionar Pontos</strong>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input type="number" value={addPoints} onChange={e => setAddPoints(e.target.value)} placeholder="Pontos" style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #dce2e8" }} />
                <button onClick={addLoyaltyPoints} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#16a34a", color: "white", cursor: "pointer", fontWeight: 600 }}>+</button>
              </div>
              <input value={addDesc} onChange={e => setAddDesc(e.target.value)} placeholder="Motivo (opcional)" style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #dce2e8", marginTop: 8 }} />
            </div>

            <div style={{ marginTop: 12, padding: 12, background: "#f8fafc", borderRadius: 8 }}>
              <strong style={{ fontSize: 13 }}>Resgatar Pontos</strong>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input type="number" value={redeemPoints} onChange={e => setRedeemPoints(e.target.value)} placeholder="Pontos" style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #dce2e8" }} />
                <button onClick={redeemLoyaltyPoints} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#d84416", color: "white", cursor: "pointer", fontWeight: 600 }}><Gift size={14} /></button>
              </div>
            </div>

            <h4 style={{ marginTop: 20, marginBottom: 8 }}>Histórico</h4>
            {txns.map(t => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
                <div>
                  <span style={{ color: t.type === "earned" ? "#16a34a" : "#c32626" }}>{t.type === "earned" ? "+" : ""}{t.points} pts</span>
                  <span style={{ color: "#999", marginLeft: 8 }}>{t.description}</span>
                </div>
                <span style={{ color: "#999", fontSize: 11 }}>{new Date(t.created).toLocaleDateString("pt-BR")}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
