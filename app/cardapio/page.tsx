"use client";

import { useEffect, useState } from "react";

type Product = { id: string; name: string; description: string; price: number; active: number; photo: string | null; category: string };

const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v / 100);

export default function CardapioPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/records?action=records&from=2000-01-01&to=2099-12-31")
      .then((r) => r.json())
      .then((d: any) => { setProducts(d.products.filter((p: Product) => p.active)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const categories = Array.from(new Set(products.map((p) => p.category)));

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "Arial" }}><p>Carregando cardápio…</p></div>;

  return (
    <div style={{ fontFamily: "Arial, sans-serif", background: "#f3f5f7", minHeight: "100vh" }}>
      <header style={{ background: "#d84416", color: "white", padding: "24px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 32, fontWeight: 900 }}>🍔 Central Lanches</div>
        <p style={{ margin: "4px 0 0", opacity: 0.9, fontSize: 14 }}>Confira nosso cardápio</p>
      </header>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "16px" }}>
        {categories.map((cat) => (
          <section key={cat} style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, color: "#d84416", borderBottom: "2px solid #d84416", paddingBottom: 8, marginBottom: 12 }}>{cat}</h2>
            {products.filter((p) => p.category === cat).map((p) => (
              <div key={p.id} style={{ background: "white", borderRadius: 12, padding: 16, marginBottom: 12, display: "flex", gap: 12, alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                {p.photo && <img src={p.photo} alt={p.name} style={{ width: 80, height: 80, borderRadius: 8, objectFit: "cover" }} />}
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 16 }}>{p.name}</strong>
                  {p.description && <p style={{ color: "#657184", fontSize: 13, margin: "2px 0" }}>{p.description}</p>}
                  <span style={{ color: "#d84416", fontWeight: 700, fontSize: 18 }}>{brl(p.price)}</span>
                </div>
              </div>
            ))}
          </section>
        ))}
        <p style={{ textAlign: "center", color: "#657184", fontSize: 12, padding: 20 }}>Peça ao atendente • Preços sujeitos a alteração</p>
      </main>
    </div>
  );
}
