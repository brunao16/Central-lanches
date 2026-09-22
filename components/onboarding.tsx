"use client";

import { useState } from "react";

type Props = { onComplete: () => void };

const CATEGORIES = ["Lanches", "Bebidas", "Porções", "Sobremesas", "Combos"];

const SUGGESTIONS: Record<string, { name: string; price: string; cost: string; desc: string }[]> = {
  "Lanches": [
    { name: "X-Burger", price: "22,90", cost: "8,00", desc: "Pão, hambúrguer, queijo, alface, tomate" },
    { name: "X-Salada", price: "24,90", cost: "9,00", desc: "Pão, hambúrguer, queijo, salada" },
    { name: "X-Bacon", price: "27,90", cost: "10,00", desc: "Pão, hambúrguer, queijo, bacon crocante" },
    { name: "Hot Dog", price: "18,90", cost: "6,00", desc: "Pão salsicha, purê, milho, batata palha" },
  ],
  "Bebidas": [
    { name: "Coca-Cola 350ml", price: "6,00", cost: "3,00", desc: "Lata gelada" },
    { name: "Suco Natural", price: "8,00", cost: "3,50", desc: "Laranja, limão ou maracujá" },
    { name: "Água Mineral", price: "4,00", cost: "1,50", desc: "500ml com ou sem gás" },
  ],
  "Porções": [
    { name: "Porção de Fritas", price: "32,90", cost: "10,00", desc: "Batata frita crocante para dividir" },
    { name: "Porção de Onions Rings", price: "34,90", cost: "12,00", desc: "Anéis de cebola empanados" },
  ],
  "Sobremesas": [
    { name: "Brownie c/ Sorvete", price: "18,90", cost: "6,00", desc: "Brownie quente com sorvete de creme" },
    { name: "Petit Gateau", price: "22,90", cost: "8,00", desc: "Bolinho de chocolate com sorvete" },
  ],
  "Combos": [
    { name: "Combo X-Burger", price: "34,90", cost: "12,00", desc: "X-Burger + Refri + Batata" },
    { name: "Combo Family", price: "89,90", cost: "35,00", desc: "4 lanches + 4 refris + batata grande" },
  ],
};

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantType, setRestaurantType] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Lanches", "Bebidas"]);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  };

  const toggleProduct = (key: string) => {
    setSelectedProducts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  async function handleFinish() {
    setSaving(true);
    const products: { name: string; price: string; cost: string; category: string; description: string; stock: string }[] = [];

    selectedCategories.forEach((cat) => {
      (SUGGESTIONS[cat] || []).forEach((p) => {
        const key = `${cat}:${p.name}`;
        if (selectedProducts[key]) {
          products.push({ name: p.name, price: p.price, cost: p.cost, description: p.desc, category: cat, stock: "-1" });
        }
      });
    });

    for (const p of products) {
      await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-product", ...p, active: 1 }),
      });
    }

    localStorage.setItem("cl_onboarded", "1");
    setSaving(false);
    onComplete();
  }

  const TYPE_LABELS: Record<string, string> = {
    burger: "Hamburgeria",
    pizzaria: "Pizzaria",
    lanchonete: "Lanchonete",
    restaurante: "Restaurante",
    bar: "Bar / Pub",
    padaria: "Padaria / Confeitaria",
    outro: "Outro",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 50%, #2d1b69 100%)", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <style jsx>{`
        .card { background: white; border-radius: 24px; padding: 48px; width: 560px; max-width: 95vw; box-shadow: 0 24px 80px rgba(0,0,0,.3); position: relative; }
        .step-indicator { display: flex; gap: 8px; margin-bottom: 32px; }
        .step-dot { width: 8px; height: 8px; border-radius: 50%; background: #e9ecef; transition: all .3s; }
        .step-dot.active { background: #e8192c; width: 24px; border-radius: 4px; }
        .step-dot.done { background: #16a34a; }
        h2 { font-size: 24px; font-weight: 800; margin-bottom: 8px; color: #1a1a2e; }
        .subtitle { font-size: 14px; color: #6c757d; margin-bottom: 32px; line-height: 1.5; }
        .type-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .type-btn { padding: 16px 12px; border-radius: 12px; border: 2px solid #e9ecef; background: white; cursor: pointer; text-align: center; transition: all .2s; font-size: 13px; font-weight: 600; }
        .type-btn:hover { border-color: #e8192c; }
        .type-btn.selected { border-color: #e8192c; background: #fff0f0; color: #e8192c; }
        .type-emoji { font-size: 28px; display: block; margin-bottom: 6px; }
        .cat-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .cat-chip { padding: 8px 16px; border-radius: 100px; border: 2px solid #e9ecef; background: white; cursor: pointer; font-size: 13px; font-weight: 600; transition: all .2s; }
        .cat-chip:hover { border-color: #e8192c; }
        .cat-chip.selected { border-color: #e8192c; background: #e8192c; color: white; }
        .products-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-height: 300px; overflow-y: auto; padding: 4px; }
        .product-chip { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 10px; border: 2px solid #e9ecef; background: white; cursor: pointer; transition: all .15s; }
        .product-chip:hover { border-color: #e8192c; }
        .product-chip.selected { border-color: #16a34a; background: #f0fdf4; }
        .product-chip .check { width: 20px; height: 20px; border-radius: 6px; border: 2px solid #d1d5db; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; transition: all .15s; }
        .product-chip.selected .check { background: #16a34a; border-color: #16a34a; color: white; }
        .product-chip .info { flex: 1; min-width: 0; }
        .product-chip .name { font-size: 13px; font-weight: 600; }
        .product-chip .price { font-size: 11px; color: #6c757d; }
        .form-input { width: 100%; padding: 14px 16px; border-radius: 12px; border: 2px solid #e9ecef; font-size: 15px; transition: all .2s; outline: none; }
        .form-input:focus { border-color: #e8192c; box-shadow: 0 0 0 4px rgba(232,25,44,0.1); }
        .btn { width: 100%; padding: 14px; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; transition: all .2s; }
        .btn-primary { background: linear-gradient(135deg, #e8192c, #ff4757); color: white; box-shadow: 0 4px 16px rgba(232,25,44,0.3); }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(232,25,44,0.4); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .btn-outline { background: white; color: #e8192c; border: 2px solid #e8192c; }
        .btn-outline:hover { background: #fff0f0; }
        .btn-ghost { background: transparent; color: #6c757d; margin-top: 8px; }
        .actions { display: flex; gap: 12; margin-top: 24px; }
        .skip { text-align: center; margin-top: 12px; }
        .skip button { background: none; border: none; color: #6c757d; font-size: 13px; cursor: pointer; }
        .skip button:hover { color: #1a1a2e; }
        .success-icon { font-size: 64px; text-align: center; margin-bottom: 16px; }
        .success h2 { text-align: center; }
        .success p { text-align: center; }
        .input-group { margin-bottom: 20px; }
        .input-group label { display: block; font-size: 13px; font-weight: 600; color: #495057; margin-bottom: 6px; }
        @media (max-width: 600px) { .card { padding: 32px 24px; } .type-grid { grid-template-columns: repeat(2, 1fr); } .products-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="card">
        <div className="step-indicator">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`step-dot ${i === step ? "active" : i < step ? "done" : ""}`} />
          ))}
        </div>

        {step === 0 && (
          <>
            <h2>Bem-vindo ao Central Lanches! 👋</h2>
            <p className="subtitle">Vamos configurar seu restaurante em poucos passos.</p>
            <div className="input-group">
              <label>Nome do restaurante</label>
              <input className="form-input" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} placeholder="Ex.: Burguer House" autoFocus />
            </div>
            <button className="btn btn-primary" disabled={!restaurantName.trim()} onClick={() => setStep(1)}>Continuar</button>
          </>
        )}

        {step === 1 && (
          <>
            <h2>Que tipo de restaurante é?</h2>
            <p className="subtitle">Isso ajuda a personalizar seu cardápio.</p>
            <div className="type-grid">
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <button key={key} className={`type-btn ${restaurantType === key ? "selected" : ""}`} onClick={() => setRestaurantType(key)}>
                  <span className="type-emoji">{{ burger: "🍔", pizzaria: "🍕", lanchonete: "🥪", restaurante: "🍽️", bar: "🍺", padaria: "🥐", outro: "🏪" }[key]}</span>
                  {label}
                </button>
              ))}
            </div>
            <div className="actions">
              <button className="btn btn-ghost" onClick={() => setStep(0)}>← Voltar</button>
              <button className="btn btn-primary" disabled={!restaurantType} onClick={() => setStep(2)}>Continuar</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2>Quais categorias você usa?</h2>
            <p className="subtitle">Selecione as categorias do seu cardápio.</p>
            <div className="cat-chips">
              {CATEGORIES.map((cat) => (
                <button key={cat} className={`cat-chip ${selectedCategories.includes(cat) ? "selected" : ""}`} onClick={() => toggleCategory(cat)}>{cat}</button>
              ))}
            </div>
            <div className="actions">
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Voltar</button>
              <button className="btn btn-primary" disabled={!selectedCategories.length} onClick={() => {
                const preselected: Record<string, boolean> = {};
                selectedCategories.forEach((cat) => {
                  (SUGGESTIONS[cat] || []).forEach((p) => { preselected[`${cat}:${p.name}`] = true; });
                });
                setSelectedProducts(preselected);
                setStep(3);
              }}>Continuar</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2>Seu cardápio inicial</h2>
            <p className="subtitle">Desmarque o que não quer incluir. Você pode editar depois.</p>
            <div className="products-grid">
              {selectedCategories.flatMap((cat) =>
                (SUGGESTIONS[cat] || []).map((p) => {
                  const key = `${cat}:${p.name}`;
                  return (
                    <div key={key} className={`product-chip ${selectedProducts[key] ? "selected" : ""}`} onClick={() => toggleProduct(key)}>
                      <div className="check">{selectedProducts[key] ? "✓" : ""}</div>
                      <div className="info">
                        <div className="name">{p.name}</div>
                        <div className="price">{p.desc} · R$ {p.price}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="actions">
              <button className="btn btn-ghost" onClick={() => setStep(2)}>← Voltar</button>
              <button className="btn btn-primary" disabled={saving} onClick={handleFinish}>
                {saving ? "Criando…" : `Começar a usar`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
