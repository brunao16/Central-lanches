"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, Plus, Minus, Send, Phone, MapPin } from "lucide-react";

type Product = { id: string; name: string; description: string; price: number; active: number; photo: string | null; category: string; stock: number };

const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v / 100);

export default function PedidoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [step, setStep] = useState<"menu" | "cart" | "info" | "done">("menu");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [tableNum, setTableNum] = useState("");
  const [orderType, setOrderType] = useState<"delivery" | "pickup" | "table">("table");
  const [busy, setBusy] = useState(false);
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("table");
    if (t) { setTableNum(t); setOrderType("table"); }
    fetch("/api/records?action=records&from=2000-01-01&to=2099-12-31")
      .then(r => r.json()).then((d: any) => { setProducts(d.products.filter((p: Product) => p.active)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const categories = Array.from(new Set(products.map(p => p.category)));
  const lines = Object.entries(cart).map(([id, qty]) => ({ p: products.find(p => p.id === id), qty })).filter(x => x.p) as { p: Product; qty: number }[];
  const total = lines.reduce((s, x) => s + x.p.price * x.qty, 0);

  function quantity(id: string, delta: number) {
    setCart(c => { const n = { ...c }; n[id] = Math.max(0, Math.min(99, (n[id] || 0) + delta)); if (!n[id]) delete n[id]; return n; });
  }

  async function sendOrder() {
    setBusy(true);
    try {
      const items = lines.map(x => ({ id: x.p.id, name: x.p.name, price: x.p.price, qty: x.qty }));
      const r = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-ticket", items, total, table_num: tableNum, note: note || null }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setOrderId(d.id);
      setStep("done");
    } catch (e) { alert((e as Error).message); }
    finally { setBusy(false); }
  }

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "Arial" }}><p>Carregando cardápio…</p></div>;

  if (step === "done") return (
    <div style={{ fontFamily: "Arial", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f5f7", padding: 20 }}>
      <div style={{ background: "white", borderRadius: 16, padding: 32, textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Pedido Enviado!</h1>
        <p style={{ color: "#657184", marginBottom: 16 }}>Seu pedido foi recebido e está sendo preparado.</p>
        <p style={{ fontSize: 14, color: "#657184" }}>Código: <strong>#{orderId.slice(-6).toUpperCase()}</strong></p>
        {tableNum && <p style={{ fontSize: 14, color: "#657184" }}>Mesa: <strong>{tableNum}</strong></p>}
        <button onClick={() => { setCart({}); setStep("menu"); setNote(""); }} style={{ marginTop: 20, background: "#d84416", color: "white", border: "none", padding: "12px 24px", borderRadius: 8, fontSize: 16, cursor: "pointer" }}>Novo Pedido</button>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "Arial", background: "#f3f5f7", minHeight: "100vh" }}>
      <header style={{ background: "#d84416", color: "white", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <strong style={{ fontSize: 18 }}>🍔 Central Lanches</strong>
        {lines.length > 0 && (
          <button onClick={() => setStep("cart")} style={{ background: "white", color: "#d84416", border: "none", padding: "8px 16px", borderRadius: 8, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <ShoppingBag size={18} /> {lines.length} itens · {brl(total)}
          </button>
        )}
      </header>

      {step === "menu" && (
        <main style={{ maxWidth: 600, margin: "0 auto", padding: 16 }}>
          {tableNum && <p style={{ background: "#fff0e7", padding: "8px 12px", borderRadius: 8, textAlign: "center", marginBottom: 12, fontSize: 14 }}>Mesa <strong>{tableNum}</strong></p>}
          {categories.map(cat => (
            <section key={cat} style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, color: "#d84416", marginBottom: 8 }}>{cat}</h2>
              {products.filter(p => p.category === cat).map(p => (
                <div key={p.id} style={{ background: "white", borderRadius: 12, padding: 12, marginBottom: 8, display: "flex", gap: 12, alignItems: "center" }}>
                  {p.photo && <img src={p.photo} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover" }} />}
                  <div style={{ flex: 1 }}>
                    <strong>{p.name}</strong>
                    {p.description && <p style={{ color: "#657184", fontSize: 12, margin: "2px 0" }}>{p.description}</p>}
                    <span style={{ color: "#d84416", fontWeight: 700 }}>{brl(p.price)}</span>
                    {p.stock >= 0 && p.stock < 5 && <span style={{ color: "#f59e0b", fontSize: 11, marginLeft: 8 }}>Últimas {p.stock}!</span>}
                  </div>
                  {cart[p.id] ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button onClick={() => quantity(p.id, -1)} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #dce2e8", background: "white", cursor: "pointer", fontSize: 18 }}>-</button>
                      <strong>{cart[p.id]}</strong>
                      <button onClick={() => quantity(p.id, 1)} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #dce2e8", background: "#d84416", color: "white", cursor: "pointer", fontSize: 18 }}>+</button>
                    </div>
                  ) : (
                    <button onClick={() => quantity(p.id, 1)} style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: "#d84416", color: "white", cursor: "pointer", fontSize: 20 }}>+</button>
                  )}
                </div>
              ))}
            </section>
          ))}
        </main>
      )}

      {step === "cart" && (
        <main style={{ maxWidth: 600, margin: "0 auto", padding: 16 }}>
          <button onClick={() => setStep("menu")} style={{ border: "none", background: "none", color: "#d84416", fontSize: 14, cursor: "pointer", marginBottom: 16 }}>← Voltar ao cardápio</button>
          <h2 style={{ fontSize: 20, marginBottom: 16 }}>Seu Pedido</h2>
          {lines.map(({ p, qty }) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #e9edf2" }}>
              <div><strong>{qty}× {p.name}</strong><br /><span style={{ color: "#657184", fontSize: 13 }}>{brl(p.price * qty)}</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => quantity(p.id, -1)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #dce2e8", background: "white", cursor: "pointer" }}>-</button>
                <strong>{qty}</strong>
                <button onClick={() => quantity(p.id, 1)} style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "#d84416", color: "white", cursor: "pointer" }}>+</button>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, fontSize: 20, fontWeight: 700 }}>
            <span>Total</span><span>{brl(total)}</span>
          </div>
          <label style={{ marginTop: 16, display: "block", fontSize: 13, fontWeight: 600 }}>Observação</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Ex.: Sem cebola, bem passado…" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #dce2e8", fontSize: 14, marginTop: 4, minHeight: 60 }} />
          <button onClick={() => setStep("info")} disabled={!lines.length} style={{ width: "100%", marginTop: 16, background: "#d84416", color: "white", border: "none", padding: 14, borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>Continuar</button>
        </main>
      )}

      {step === "info" && (
        <main style={{ maxWidth: 600, margin: "0 auto", padding: 16 }}>
          <button onClick={() => setStep("cart")} style={{ border: "none", background: "none", color: "#d84416", fontSize: 14, cursor: "pointer", marginBottom: 16 }}>← Voltar</button>
          <h2 style={{ fontSize: 20, marginBottom: 16 }}>Seus Dados</h2>

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {(["table", "pickup", "delivery"] as const).map(t => (
              <button key={t} onClick={() => setOrderType(t)} style={{ flex: 1, padding: "10px 8px", borderRadius: 8, border: orderType === t ? "2px solid #d84416" : "1px solid #dce2e8", background: orderType === t ? "#fff0e7" : "white", cursor: "pointer", fontSize: 13, fontWeight: orderType === t ? 700 : 400 }}>
                {t === "table" && "🍽️ Mesa"}
                {t === "pickup" && "🏃 Retirada"}
                {t === "delivery" && "🛵 Delivery"}
              </button>
            ))}
          </div>

          {orderType === "table" && !tableNum && (
            <><label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Número da Mesa</label>
            <input value={tableNum} onChange={e => setTableNum(e.target.value)} placeholder="Ex.: 5" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #dce2e8", fontSize: 14, marginBottom: 12 }} /></>
          )}

          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Seu nome</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #dce2e8", fontSize: 14, marginBottom: 12 }} />

          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}><Phone size={14} /> WhatsApp</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #dce2e8", fontSize: 14, marginBottom: 12 }} />

          {orderType === "delivery" && (
            <><label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}><MapPin size={14} /> Endereço</label>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número, bairro" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #dce2e8", fontSize: 14, marginBottom: 12 }} /></>
          )}

          <button onClick={() => void sendOrder()} disabled={busy || !name} style={{ width: "100%", marginTop: 8, background: "#d84416", color: "white", border: "none", padding: 14, borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
            {busy ? "Enviando…" : `Enviar Pedido · ${brl(total)}`}
          </button>
        </main>
      )}
    </div>
  );
}
