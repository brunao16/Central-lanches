"use client";

import { useEffect, useState, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ShoppingBag,
  Utensils,
  Receipt,
  ChartNoAxesCombined,
  Plus,
  Camera,
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  active: number;
};

type Sale = {
  id: string;
  created: string;
  lines: string;
  payment: string;
  total: number;
  received: number;
};

type Expense = {
  id: string;
  day: string;
  merchant: string;
  amount: number;
  receipt: string | null;
};

type Data = {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  totals: { revenue: number; costs: number; count: number };
};

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v / 100
  );

const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

const cents = (s: string) => {
  const v = s.trim().replace(",", ".");
  return /^\d+(\.\d{1,2})?$/.test(v) ? Math.round(Number(v) * 100) : NaN;
};

export default function Home() {
  const [tab, setTab] = useState("caixa");
  const [data, setData] = useState<Data>({
    products: [],
    sales: [],
    expenses: [],
    totals: { revenue: 0, costs: 0, count: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [from, setFrom] = useState(today().slice(0, 7) + "-01");
  const [to, setTo] = useState(today());
  const [cart, setCart] = useState<Record<string, number>>({});
  const [payment, setPayment] = useState("Pix");
  const [received, setReceived] = useState("");
  const [product, setProduct] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
  });
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDay, setExpenseDay] = useState(today());
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");

  const photoInput = useRef<HTMLInputElement>(null);
  const saleId = useRef("");
  const expenseId = useRef("");
  const productId = useRef("");
  const lock = useRef(false);
  const loadSeq = useRef(0);

  async function refresh() {
    const n = ++loadSeq.current;
    setLoading(true);
    try {
      const r = await fetch("/api/records?from=" + from + "&to=" + to);
      const d: any = await r.json();
      if (!r.ok) throw Error(d.error);
      if (n === loadSeq.current) {
        setData(d);
        setError("");
      }
    } catch (e) {
      if (n === loadSeq.current) setError((e as Error).message);
    } finally {
      if (n === loadSeq.current) setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [from, to]);

  useEffect(() => {
    if (!photo) {
      setPhotoUrl("");
      return;
    }
    const u = URL.createObjectURL(photo);
    setPhotoUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [photo]);

  async function save(payload: object | FormData) {
    const r = await fetch("/api/records", {
      method: "POST",
      headers:
        payload instanceof FormData
          ? undefined
          : { "Content-Type": "application/json" },
      body:
        payload instanceof FormData ? payload : JSON.stringify(payload),
    });
    const d: any = await r.json();
    if (!r.ok) throw Error(d.error);
    return d;
  }

  async function run(fn: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  const lines = Object.entries(cart)
    .map(([id, qty]) => ({
      p: data.products.find((p) => p.id === id),
      qty,
    }))
    .filter((x) => x.p) as { p: Product; qty: number }[];

  const total = lines.reduce((s, x) => s + x.p.price * x.qty, 0);

  function quantity(id: string, delta: number) {
    if (busy) return;
    saleId.current = "";
    setCart((c) => {
      const n = { ...c };
      n[id] = Math.max(0, Math.min(999, (n[id] || 0) + delta));
      if (!n[id]) delete n[id];
      return n;
    });
  }

  async function checkout() {
    await run(async () => {
      if (!lines.length || lines.some((x) => !x.p.active))
        throw Error("Confira os lanches do pedido.");
      if (
        payment === "Dinheiro" &&
        (!Number.isFinite(cents(received)) || cents(received) < total)
      )
        throw Error(
          "Informe o valor recebido, igual ou maior que o total."
        );
      saleId.current ||= crypto.randomUUID();
      await save({
        action: "sale",
        id: saleId.current,
        items: lines.map((x) => ({ id: x.p.id, qty: x.qty })),
        payment,
        received: payment === "Dinheiro" ? cents(received) : total,
        expectedTotal: total,
      });
      setCart({});
      setReceived("");
      saleId.current = "";
      setSuccess("Venda registrada com sucesso.");
    });
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    await run(async () => {
      const price = cents(product.price);
      if (!Number.isFinite(price) || price <= 0)
        throw Error(
          "Informe um preço válido, por exemplo 18,50."
        );
      productId.current ||= product.id || crypto.randomUUID();
      await save({
        action: "product",
        ...product,
        id: productId.current,
        price,
      });
      setProduct({ id: "", name: "", description: "", price: "" });
      productId.current = "";
      setSuccess("Lanche salvo no cardápio.");
    });
  }

  async function saveExpense(e: React.FormEvent) {
    e.preventDefault();
    await run(async () => {
      const value = cents(amount);
      if (!Number.isFinite(value) || value <= 0)
        throw Error("Informe o valor do comprovante.");
      expenseId.current ||= crypto.randomUUID();
      const f = new FormData();
      f.set("id", expenseId.current);
      f.set("merchant", merchant);
      f.set("amount", String(value));
      f.set("day", expenseDay);
      if (photo) f.set("receipt", photo);
      await save(f);
      setMerchant("");
      setAmount("");
      setPhoto(null);
      if (photoInput.current) photoInput.current.value = "";
      expenseId.current = "";
      setSuccess(
        "Gasto registrado. O resumo já foi atualizado."
      );
    });
  }

  function selectPhoto(f: File | undefined) {
    setError("");
    if (!f) {
      setPhoto(null);
      return;
    }
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(f.type) ||
      f.size > 8 * 1024 * 1024
    ) {
      setError("Use uma foto JPG, PNG ou WebP de até 8 MB.");
      return;
    }
    setPhoto(f);
  }

  return (
    <main className="shell">
      <header>
        <div className="brand">CL</div>
        <div>
          <strong>Central Lanches</strong>
          <p>CAIXA E GESTÃO</p>
        </div>
        <span className="store">Sua operação em um só lugar</span>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="nav">
          <TabsTrigger value="caixa">
            <ShoppingBag /> Caixa
          </TabsTrigger>
          <TabsTrigger value="lanches">
            <Utensils /> Lanches
          </TabsTrigger>
          <TabsTrigger value="gastos">
            <Receipt /> Gastos
          </TabsTrigger>
          <TabsTrigger value="gestao">
            <ChartNoAxesCombined /> Gestão
          </TabsTrigger>
        </TabsList>

        {error && (
          <div className="error" role="alert">
            {error}{" "}
            <button
              className="small"
              onClick={() => void refresh()}
              disabled={busy}
            >
              Recarregar
            </button>
          </div>
        )}
        {success && <div className="success" role="status">{success}</div>}
        {loading && (
          <p role="status" className="notice">
            Atualizando os registros…
          </p>
        )}

        <TabsContent value="caixa">
          <div className="heading">
            <div>
              <p>ATENDIMENTO</p>
              <h1>Vamos abrir os trabalhos.</h1>
            </div>
            <span className="badge">Novo pedido</span>
          </div>
          <div className="columns">
            <section className="panel">
              <h2>Seu cardápio</h2>
              {!data.products.some((p) => p.active) ? (
                <div className="empty">
                  <Utensils size={40} />
                  <h3>O primeiro lanche começa aqui</h3>
                  <p>Cadastre seus lanches e preços para começar a vender.</p>
                  <button
                    className="primary"
                    onClick={() => setTab("lanches")}
                  >
                    Cadastrar primeiro lanche
                  </button>
                </div>
              ) : (
                <div className="grid">
                  {data.products
                    .filter((p) => p.active)
                    .map((p) => (
                      <button
                        className="product"
                        key={p.id}
                        disabled={busy || loading}
                        onClick={() => quantity(p.id, 1)}
                      >
                        <strong>{p.name}</strong>
                        <span className="hint">
                          {p.description || "Preparado na hora"}
                        </span>
                        <b>{brl(p.price)}</b>
                        <span className="hint">+ Adicionar ao pedido</span>
                      </button>
                    ))}
                </div>
              )}
            </section>

            <aside className="panel">
              <h2>Pedido atual</h2>
              {!lines.length && (
                <p className="hint">Adicione os lanches do cliente.</p>
              )}
              {lines.map(({ p, qty }) => (
                <div className="row" key={p.id}>
                  <div>
                    <strong>{p.name}</strong>
                    <small>{brl(p.price * qty)}</small>
                  </div>
                  <div className="controls">
                    <button
                      className="small"
                      aria-label={"Remover uma unidade de " + p.name}
                      disabled={busy}
                      onClick={() => quantity(p.id, -1)}
                    >
                      −
                    </button>
                    <span>{qty}</span>
                    <button
                      className="small"
                      aria-label={"Adicionar uma unidade de " + p.name}
                      disabled={busy}
                      onClick={() => quantity(p.id, 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
              <div className="total">
                <span>Total</span>
                <strong>{brl(total)}</strong>
              </div>

              <p id="payment-label">Forma de pagamento</p>
              <RadioGroup
                className="payment"
                value={payment}
                disabled={busy}
                onValueChange={(v) => {
                  setPayment(v);
                  saleId.current = "";
                }}
                aria-labelledby="payment-label"
              >
                {["Pix", "Dinheiro", "Cartão"].map((v) => (
                  <div className="controls" key={v}>
                    <RadioGroupItem id={v} value={v} />
                    <label style={{ margin: 0 }} htmlFor={v}>
                      {v}
                    </label>
                  </div>
                ))}
              </RadioGroup>

              {payment === "Dinheiro" && (
                <>
                  <label htmlFor="received">Valor recebido (R$)</label>
                  <input
                    id="received"
                    inputMode="decimal"
                    value={received}
                    disabled={busy}
                    onChange={(e) => setReceived(e.target.value)}
                    placeholder="0,00"
                  />
                </>
              )}

              <button
                style={{ marginTop: 22 }}
                disabled={busy || !lines.length}
                onClick={() => void checkout()}
              >
                {busy ? "Finalizando…" : "Finalizar pedido"}
              </button>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="lanches">
          <div className="heading">
            <div>
              <p>CARDÁPIO</p>
              <h1>Seus lanches, do seu jeito.</h1>
            </div>
            <span className="badge">
              {data.products.filter((p) => p.active).length} disponíveis
            </span>
          </div>
          <div className="columns">
            <section className="panel">
              <h2>Lanches cadastrados</h2>
              {!data.products.length && (
                <p className="hint">Nenhum lanche cadastrado ainda.</p>
              )}
              {data.products.map((p) => (
                <div className="row" key={p.id}>
                  <div>
                    <strong>{p.name}</strong>
                    <small>{p.description}</small>
                    <b>{brl(p.price)}</b>
                    <small>
                      {p.active ? "Disponível para venda" : "Pausado"}
                    </small>
                  </div>
                  <div className="controls">
                    <button
                      className="small"
                      disabled={busy}
                      onClick={() => {
                        setProduct({
                          ...p,
                          price: (p.price / 100)
                            .toFixed(2)
                            .replace(".", ","),
                        });
                        productId.current = p.id;
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="small"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          await save({
                            action: "toggle",
                            id: p.id,
                            active: !p.active,
                          });
                          setSuccess(
                            p.active
                              ? "Lanche pausado."
                              : "Lanche disponível."
                          );
                        })
                      }
                    >
                      {p.active ? "Pausar" : "Ativar"}
                    </button>
                  </div>
                </div>
              ))}
            </section>

            <form className="panel" onSubmit={saveProduct}>
              <h2>{product.id ? "Editar lanche" : "Cadastrar lanche"}</h2>
              <label htmlFor="name">Nome do lanche</label>
              <input
                id="name"
                required
                maxLength={150}
                disabled={busy}
                value={product.name}
                onChange={(e) =>
                  setProduct({ ...product, name: e.target.value })
                }
                placeholder="Ex.: X-salada"
              />
              <label htmlFor="desc">Ingredientes / descrição</label>
              <textarea
                id="desc"
                maxLength={500}
                disabled={busy}
                value={product.description}
                onChange={(e) =>
                  setProduct({ ...product, description: e.target.value })
                }
                placeholder="Pão, hambúrguer, queijo, alface…"
              />
              <label htmlFor="price">Preço de venda (R$)</label>
              <input
                id="price"
                required
                inputMode="decimal"
                disabled={busy}
                value={product.price}
                onChange={(e) =>
                  setProduct({ ...product, price: e.target.value })
                }
                placeholder="18,50"
              />
              <button style={{ marginTop: 22 }} disabled={busy}>
                {busy ? "Salvando…" : "Salvar lanche"}
              </button>
              {product.id && (
                <button
                  type="button"
                  className="small"
                  style={{ marginTop: 10 }}
                  disabled={busy}
                  onClick={() => {
                    setProduct({
                      id: "",
                      name: "",
                      description: "",
                      price: "",
                    });
                    productId.current = "";
                  }}
                >
                  Cancelar edição
                </button>
              )}
            </form>
          </div>
        </TabsContent>

        <TabsContent value="gastos">
          <div className="heading">
            <div>
              <p>COMPRAS E DESPESAS</p>
              <h1>Comprovante salvo. Gasto organizado.</h1>
            </div>
            <span className="badge">{brl(data.totals.costs)} no período</span>
          </div>
          <div className="columns">
            <form className="panel" onSubmit={saveExpense}>
              <h2>Registrar gasto</h2>
              <div className="fieldgrid">
                <div>
                  <label htmlFor="merchant">
                    Mercado / descrição do gasto
                  </label>
                  <input
                    id="merchant"
                    required
                    maxLength={150}
                    disabled={busy}
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    placeholder="Ex.: Mercado do bairro"
                  />
                </div>
                <div>
                  <label htmlFor="expenseDay">Data da compra</label>
                  <input
                    id="expenseDay"
                    type="date"
                    required
                    disabled={busy}
                    value={expenseDay}
                    onChange={(e) => setExpenseDay(e.target.value)}
                  />
                </div>
              </div>
              <label htmlFor="amount">Valor total do comprovante (R$)</label>
              <input
                id="amount"
                required
                inputMode="decimal"
                disabled={busy}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
              />
              <label htmlFor="photo">
                <Camera size={18} style={{ display: "inline" }} /> Tirar foto
                ou anexar comprovante
              </label>
              <input
                id="photo"
                ref={photoInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                disabled={busy}
                onChange={(e) => selectPhoto(e.target.files?.[0])}
              />
              <p className="notice">
                Confira o total na foto e digite o valor acima. JPG, PNG ou
                WebP, até 8 MB. A foto é opcional.
              </p>
              {photoUrl && (
                <img
                  src={photoUrl}
                  alt="Prévia do comprovante selecionado"
                  className="receipt"
                />
              )}
              <button style={{ marginTop: 20 }} disabled={busy}>
                {busy ? "Salvando…" : "Salvar gasto"}
              </button>
            </form>

            <aside className="panel">
              <h2>Gastos no período</h2>
              <p className="notice">
                {from.split("-").reverse().join("/")} até{" "}
                {to.split("-").reverse().join("/")}. Altere o período na
                Gestão.
              </p>
              {!data.expenses.length && (
                <p className="hint">
                  Nenhum gasto registrado no período.
                </p>
              )}
              {data.expenses.map((e) => (
                <div className="row" key={e.id}>
                  <div>
                    <strong>{e.merchant}</strong>
                    <small>{e.day.split("-").reverse().join("/")}</small>
                    {e.receipt && (
                      <a
                        href={"/api/receipt?id=" + e.id}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver comprovante
                      </a>
                    )}
                  </div>
                  <b>{brl(e.amount)}</b>
                </div>
              ))}
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="gestao">
          <div className="heading">
            <div>
              <p>VISÃO GERAL</p>
              <h1>Seu negócio em números.</h1>
            </div>
          </div>
          <section className="panel">
            <div className="fieldgrid">
              <div>
                <label htmlFor="from">De</label>
                <input
                  id="from"
                  type="date"
                  value={from}
                  onChange={(e) => {
                    if (e.target.value) setFrom(e.target.value);
                  }}
                />
              </div>
              <div>
                <label htmlFor="to">Até</label>
                <input
                  id="to"
                  type="date"
                  value={to}
                  onChange={(e) => {
                    if (e.target.value) setTo(e.target.value);
                  }}
                />
              </div>
            </div>
          </section>

          <div className="stats">
            <section className="panel">
              <span className="summary-label">Vendas registradas</span>
              <strong>{brl(data.totals.revenue)}</strong>
              <p className="hint">
                {data.totals.count} vendas no período
              </p>
            </section>
            <section className="panel">
              <span className="summary-label">Gastos registrados</span>
              <strong>{brl(data.totals.costs)}</strong>
              <p className="hint">Compras e despesas informadas</p>
            </section>
            <section
              className="panel"
              style={{ background: "#1d2532", color: "white" }}
            >
              <span>Saldo do período</span>
              <strong>{brl(data.totals.revenue - data.totals.costs)}</strong>
              <p className="notice" style={{ color: "#c7d0de" }}>
                Vendas menos gastos registrados
              </p>
            </section>
          </div>
          <p className="notice">
            O saldo considera apenas os registros deste sistema; não
            representa o lucro contábil nem o dinheiro disponível na
            gaveta.
          </p>

          <section className="panel history">
            <h2>Histórico de vendas</h2>
            <p className="notice">
              Até 200 vendas mais recentes do período. Os totais consideram
              todas as vendas.
            </p>
            {!data.sales.length && (
              <p className="hint">As vendas finalizadas aparecerão aqui.</p>
            )}
            {data.sales.map((s) => (
              <div className="row" key={s.id}>
                <div>
                  <strong>
                    {new Date(s.created).toLocaleString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                    })}
                  </strong>
                  <small>
                    {JSON.parse(s.lines)
                      .map((x: any) => x.qty + "× " + x.name)
                      .join(" · ")}
                  </small>
                  <small>
                    {s.payment}
                    {s.payment === "Dinheiro"
                      ? " · Troco " + brl(s.received - s.total)
                      : ""}
                  </small>
                </div>
                <b>{brl(s.total)}</b>
              </div>
            ))}
          </section>
        </TabsContent>
      </Tabs>
    </main>
  );
}
