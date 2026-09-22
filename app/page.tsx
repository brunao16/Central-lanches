"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { ConfirmProvider, useConfirm } from "@/components/ui/confirm";
import { Skeleton, SkeletonCard, SkeletonGrid } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { printComanda, printRecibo } from "@/lib/print";
import {
  ShoppingBag, Utensils, Receipt, ChartNoAxesCombined,
  Plus, Camera, Download, FileText, Trash2, Edit, Search,
  Lock, Users, Building2, BarChart3, Send, Package, Bell,
  Undo2, Printer,
} from "lucide-react";

type Product = { id: string; name: string; description: string; price: number; cost: number; active: number; photo: string | null; category: string; stock: number };
type Sale = { id: string; created: string; lines: string; payment: string; total: number; received: number; branch: string; employee: string; note: string | null };
type Expense = { id: string; day: string; merchant: string; amount: number; receipt: string | null; created: string; branch: string };
type User = { id: string; username: string; name: string; role: string; branch: string };
type Branch = { id: string; name: string };
type Data = { products: Product[]; sales: Sale[]; expenses: Expense[]; totals: { revenue: number; costs: number; count: number } };

const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v / 100);
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const cents = (s: string) => { const v = s.trim().replace(",", "."); return /^\d+(\.\d{1,2})?$/.test(v) ? Math.round(Number(v) * 100) : NaN; };

function playSound(type: "success" | "error") {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === "success") {
      osc.frequency.value = 880;
      gain.gain.value = 0.3;
      osc.start();
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.frequency.value = 300;
      gain.gain.value = 0.3;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch {}
}

function LoginScreen({ onLogin }: { onLogin: (u: User) => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", username: user, password: pass }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      localStorage.setItem("cl_user", JSON.stringify(d.user));
      onLogin(d.user);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f5f7" }}>
      <form onSubmit={handleLogin} className="panel" style={{ width: 380, textAlign: "center" }}>
        <div className="brand" style={{ margin: "0 auto 16px", width: 64, height: 64, fontSize: 28 }}>CL</div>
        <h1 style={{ fontSize: 22 }}>Central Lanches</h1>
        <p className="hint" style={{ marginBottom: 24 }}>Faça login para acessar</p>
        {error && <div className="error">{error}</div>}
        <label htmlFor="user">Usuário</label>
        <input id="user" value={user} onChange={(e) => setUser(e.target.value)} placeholder="admin" required />
        <label htmlFor="pass" style={{ marginTop: 12 }}>Senha</label>
        <input id="pass" type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••" required />
        <button style={{ marginTop: 20 }} disabled={loading}>{loading ? "Entrando…" : "Entrar"}</button>
      </form>
    </div>
  );
}

export default function Home() {
  return (
    <ToastProvider>
    <ConfirmProvider>
      <HomeInner />
    </ConfirmProvider>
    </ToastProvider>
  );
}

function HomeInner() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tab, setTab] = useState("caixa");
  const [data, setData] = useState<Data>({ products: [], sales: [], expenses: [], totals: { revenue: 0, costs: 0, count: 0 } });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [from, setFrom] = useState(today().slice(0, 7) + "-01");
  const [to, setTo] = useState(today());
  const [cart, setCart] = useState<Record<string, number>>({});
  const [payment, setPayment] = useState("Pix");
  const [received, setReceived] = useState("");
  const [product, setProduct] = useState({ id: "", name: "", description: "", price: "", category: "Geral", stock: "-1", cost: "" });
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDay, setExpenseDay] = useState(today());
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [saleNote, setSaleNote] = useState("");
  const [tip, setTip] = useState("");
  const [split, setSplit] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(50000);
  const [editSaleId, setEditSaleId] = useState("");
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", name: "", role: "caixa" });
  const [showNewBranch, setShowNewBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [undoSale, setUndoSale] = useState<any>(null);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);

  const toastHook = useToast();
  const confirmHook = useConfirm();

  const photoInput = useRef<HTMLInputElement>(null);
  const productPhotoInput = useRef<HTMLInputElement>(null);
  const saleId = useRef("");
  const expenseId = useRef("");
  const productId = useRef("");
  const lock = useRef(false);
  const loadSeq = useRef(0);

  const refresh = useCallback(async () => {
    const n = ++loadSeq.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to, search, page: String(page) });
      if (selectedBranch) params.set("branch", selectedBranch);
      const r = await fetch("/api/records?action=records&" + params);
      const d: any = await r.json();
      if (!r.ok) throw Error(d.error);
      if (n === loadSeq.current) { setData(d); setError(""); }
    } catch (e) { if (n === loadSeq.current) setError((e as Error).message); }
    finally { if (n === loadSeq.current) setLoading(false); }
  }, [from, to, search, page, selectedBranch]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { if (!photo) { setPhotoUrl(""); return; } const u = URL.createObjectURL(photo); setPhotoUrl(u); return () => URL.revokeObjectURL(u); }, [photo]);

  useEffect(() => {
    const saved = localStorage.getItem("cl_user");
    if (saved) setCurrentUser(JSON.parse(saved));
    const dark = localStorage.getItem("cl_dark");
    if (dark === "true") { setDarkMode(true); document.documentElement.classList.add("dark"); }
    fetch("/api/records?action=branches").then(r => r.json()).then((d: any) => setBranches(d.branches || [])).catch(() => {});
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === "F2") { e.preventDefault(); setTab("caixa"); }
      if (e.key === "F3") { e.preventDefault(); setTab("lanches"); }
      if (e.key === "F4") { e.preventDefault(); setTab("gastos"); }
      if (e.key === "F5") { e.preventDefault(); setTab("gestao"); }
      if (e.key === "F6") { e.preventDefault(); setTab("dashboard"); }
      if (e.key === "Escape") { e.preventDefault(); setSaleNote(""); setTip(""); setDiscount(0); setCouponCode(""); setSplit(1); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function toggleDark() {
    setDarkMode((d) => { const next = !d; localStorage.setItem("cl_dark", String(next)); document.documentElement.classList.toggle("dark", next); return next; });
  }

  async function save(payload: object | FormData) {
    const isForm = payload instanceof FormData;
    const r = await fetch("/api/records", { method: "POST", headers: isForm ? undefined : { "Content-Type": "application/json" }, body: isForm ? payload : JSON.stringify(payload) });
    const d: any = await r.json();
    if (!r.ok) throw Error(d.error);
    return d;
  }

  async function run(fn: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setSuccess("");
    try { await fn(); await refresh(); toastHook.toast("success", "Ação realizada com sucesso!"); }
    catch (e) { setError((e as Error).message); toastHook.toast("error", (e as Error).message); }
    finally { lock.current = false; setBusy(false); }
  }

  const lines = Object.entries(cart).map(([id, qty]) => ({ p: data.products.find((p) => p.id === id), qty })).filter((x) => x.p) as { p: Product; qty: number }[];
  const total = lines.reduce((s, x) => s + x.p.price * x.qty, 0);

  function quantity(id: string, delta: number) {
    if (busy) return;
    saleId.current = "";
    setCart((c) => { const n = { ...c }; n[id] = Math.max(0, Math.min(999, (n[id] || 0) + delta)); if (!n[id]) delete n[id]; return n; });
  }

  async function checkout() {
    await run(async () => {
      if (!lines.length || lines.some((x) => !x.p.active)) throw Error("Confira os lanches do pedido.");
      const tipValue = tip ? cents(tip) : 0;
      const finalTotal = total - discount + tipValue;
      if (finalTotal < 0) throw Error("Desconto maior que o total.");
      if (payment === "Dinheiro" && (!Number.isFinite(cents(received)) || cents(received) < finalTotal))
        throw Error("Informe o valor recebido.");
      saleId.current ||= crypto.randomUUID();
      await save({ action: "sale", id: saleId.current, items: lines.map((x) => ({ id: x.p.id, qty: x.qty })), payment, received: payment === "Dinheiro" ? cents(received) : finalTotal, expectedTotal: total, branch: selectedBranch || "principal", employee: currentUser?.name || "", note: saleNote || null, tip: tipValue, discount, coupon: couponCode || null, split });
      playSound("success");
      try { await fetch("/api/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ saleId: saleId.current }) }); } catch {}
      setCart({}); setReceived(""); setSaleNote(""); setTip(""); setSplit(1); setCouponCode(""); setDiscount(0); saleId.current = "";
      setSuccess("Venda registrada com sucesso!");
    });
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    await run(async () => {
      const price = cents(product.price);
      if (!Number.isFinite(price) || price <= 0) throw Error("Preço inválido.");
      productId.current ||= product.id || crypto.randomUUID();
      await save({ action: "product", id: productId.current, name: product.name, description: product.description, price, category: product.category, stock: parseInt(product.stock) || -1, cost: cents(product.cost) || 0 });
      if (productPhotoInput.current?.files?.[0]) {
        const f = new FormData();
        f.set("action", "upload-product-photo");
        f.set("id", productId.current);
        f.set("photo", productPhotoInput.current.files[0]);
        await save(f);
      }
      setProduct({ id: "", name: "", description: "", price: "", category: "Geral", stock: "-1", cost: "" });
      productId.current = "";
      if (productPhotoInput.current) productPhotoInput.current.value = "";
      setSuccess("Lanche salvo!");
    });
  }

  async function saveExpense(e: React.FormEvent) {
    e.preventDefault();
    await run(async () => {
      const value = cents(amount);
      if (!Number.isFinite(value) || value <= 0) throw Error("Valor inválido.");
      expenseId.current ||= crypto.randomUUID();
      const f = new FormData();
      f.set("action", "upload-receipt");
      f.set("id", expenseId.current);
      f.set("merchant", merchant);
      f.set("amount", String(value));
      f.set("day", expenseDay);
      f.set("branch", selectedBranch || "principal");
      if (photo) f.set("receipt", photo);
      await save(f);
      setMerchant(""); setAmount(""); setPhoto(null);
      if (photoInput.current) photoInput.current.value = "";
      expenseId.current = "";
      setSuccess("Gasto registrado!");
    });
  }

  async function deleteSale(id: string) {
    const ok = await confirmHook.confirm({ title: "Excluir venda?", message: "Tem certeza que deseja excluir esta venda? Você pode desfazer em 5 segundos.", confirmText: "Excluir", variant: "danger" });
    if (!ok) return;
    const sale = data.sales.find((s: any) => s.id === id);
    setUndoSale(sale);
    toastHook.toast("warning", "Venda excluída. Desfazer em 5s?", 5000);
    if (undoTimeout) clearTimeout(undoTimeout);
    const t = setTimeout(() => { setUndoSale(null); }, 5000);
    setUndoTimeout(t);
    await run(async () => { await save({ action: "delete-sale", id }); });
  }

  async function undoDelete() {
    if (!undoSale) return;
    if (undoTimeout) clearTimeout(undoTimeout);
    await run(async () => {
      const items = JSON.parse(undoSale.lines);
      await save({ action: "sale", id: undoSale.id, items: items.map((it: any) => ({ id: it.id, qty: it.qty })), payment: undoSale.payment, received: undoSale.received, expectedTotal: undoSale.total, branch: undoSale.branch, employee: undoSale.employee, note: undoSale.note });
    });
    setUndoSale(null);
    toastHook.toast("success", "Venda restaurada!");
  }

  async function toggleProduct(p: Product) {
    await run(async () => {
      await save({ action: "toggle", id: p.id, active: !p.active });
      setSuccess(p.active ? "Lanche pausado." : "Lanche ativado.");
    });
  }

  async function deleteProduct(id: string) {
    if (!confirm("Excluir este lanche permanentemente?")) return;
    await run(async () => { await save({ action: "delete-product", id }); setSuccess("Lanche excluído."); });
  }

  function selectPhoto(f: File | undefined) {
    setError("");
    if (!f) { setPhoto(null); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type) || f.size > 8 * 1024 * 1024) { setError("Use JPG, PNG ou WebP até 8 MB."); return; }
    setPhoto(f);
  }

  function logout() { localStorage.removeItem("cl_user"); setCurrentUser(null); }

  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} />;

  const categories = Array.from(new Set(data.products.map((p) => p.category)));

  return (
    <main className="shell">
      <header>
        <div className="brand">CL</div>
        <div><strong>Central Lanches</strong><p>CAIXA E GESTÃO</p></div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          {branches.length > 1 && (
            <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #dce2e8", fontSize: 13 }}>
              <option value="">Todas filiais</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <span className="hint">{currentUser.name} ({currentUser.role})</span>
          <button className="small" onClick={toggleDark}>{darkMode ? "☀" : "🌙"}</button>
          <button className="small" onClick={logout}><Lock size={14} /> Sair</button>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="nav">
          <TabsTrigger value="caixa"><ShoppingBag /> Caixa</TabsTrigger>
          <TabsTrigger value="lanches"><Utensils /> Lanches</TabsTrigger>
          <TabsTrigger value="gastos"><Receipt /> Gastos</TabsTrigger>
          <TabsTrigger value="gestao"><ChartNoAxesCombined /> Gestão</TabsTrigger>
          <TabsTrigger value="dashboard"><BarChart3 /> Dashboard</TabsTrigger>
          {currentUser.role === "admin" && <TabsTrigger value="config"><Users /> Config</TabsTrigger>}
        </TabsList>
        <div style={{ display: "flex", gap: 6, padding: "8px 16px", overflow: "auto", background: "var(--panel)", borderBottom: "1px solid var(--border)" }}>
          <a href="/pedido" target="_blank" style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "white", fontSize: 12, textDecoration: "none", color: "var(--text)", whiteSpace: "nowrap", fontWeight: 600 }}>🍔 Cardápio Online</a>
          <a href="/cozinha" target="_blank" style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "white", fontSize: 12, textDecoration: "none", color: "var(--text)", whiteSpace: "nowrap", fontWeight: 600 }}>👨‍🍳 Cozinha</a>
          <a href="/cozinha-avancada" target="_blank" style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "white", fontSize: 12, textDecoration: "none", color: "var(--text)", whiteSpace: "nowrap", fontWeight: 600 }}>🔥 Cozinha Avanç.</a>
          <a href="/mesas" style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "white", fontSize: 12, textDecoration: "none", color: "var(--text)", whiteSpace: "nowrap", fontWeight: 600 }}>🍽️ Mesas</a>
          <a href="/delivery" style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "white", fontSize: 12, textDecoration: "none", color: "var(--text)", whiteSpace: "nowrap", fontWeight: 600 }}>🛵 Delivery</a>
          <a href="/fidelidade" style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "white", fontSize: 12, textDecoration: "none", color: "var(--text)", whiteSpace: "nowrap", fontWeight: 600 }}>⭐ Fidelidade</a>
          <a href="/ponto" target="_blank" style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "white", fontSize: 12, textDecoration: "none", color: "var(--text)", whiteSpace: "nowrap", fontWeight: 600 }}>⏰ Ponto</a>
          <a href="/nfe" style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "white", fontSize: 12, textDecoration: "none", color: "var(--text)", whiteSpace: "nowrap", fontWeight: 600 }}>📄 NF-e</a>
        </div>

        {error && <div className="error" role="alert">{error} <button className="small" onClick={() => void refresh()} disabled={busy}>Recarregar</button></div>}
        {success && <div className="success" role="status">{success}</div>}
        {undoSale && (
          <div style={{ background: "#fffbeb", border: "1px solid #f59e0b", borderRadius: 8, padding: "8px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ flex: 1, fontSize: 13 }}>Venda excluída</span>
            <button onClick={undoDelete} style={{ background: "#f59e0b", color: "white", border: "none", padding: "4px 12px", borderRadius: 6, fontWeight: 600, cursor: "pointer", fontSize: 12 }}>Desfazer</button>
          </div>
        )}
        {loading && <p role="status" className="notice">Atualizando…</p>}

        {/* === CAIXA === */}
        <TabsContent value="caixa">
          <div className="heading"><div><p>ATENDIMENTO</p><h1>Vamos abrir os trabalhos.</h1></div><span className="badge">Novo pedido</span></div>
          <div className="columns">
            <section className="panel">
              <h2>Seu cardápio</h2>
              {!data.products.some((p) => p.active) ? (
                <div className="empty"><Utensils size={40} /><h3>O primeiro lanche começa aqui</h3><p>Cadastre seus lanches para começar a vender.</p><button className="primary" onClick={() => setTab("lanches")}>Cadastrar primeiro lanche</button></div>
              ) : (
                <div className="grid">
                  {categories.map((cat) => (
                    <div key={cat}>
                      {categories.length > 1 && <h3 style={{ margin: "8px 0", color: "#657184" }}>{cat}</h3>}
                      <div className="grid">
                        {data.products.filter((p) => p.active && p.category === cat).map((p) => (
                          <button className="product" key={p.id} disabled={busy || loading || (p.stock === 0)} onClick={() => quantity(p.id, 1)}>
                            {p.photo && <img src={p.photo} alt={p.name} style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} />}
                            <strong>{p.name}</strong>
                            <span className="hint">{p.description || "Preparado na hora"}</span>
                            <b>{brl(p.price)}</b>
                            {p.stock >= 0 && <span className="hint" style={{ color: p.stock === 0 ? "#c32626" : p.stock < 5 ? "#f59e0b" : undefined, fontWeight: p.stock < 5 ? 600 : undefined }}>{p.stock === 0 ? "ESGOTADO" : `${p.stock} em estoque`}</span>}
                            <span className="hint">{p.stock === 0 ? "" : "+ Adicionar"}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <aside className="panel">
              <h2>Pedido atual</h2>
              {!lines.length && <p className="hint">Adicione os lanches do cliente.</p>}
              {lines.map(({ p, qty }) => (
                <div className="row" key={p.id}>
                  <div><strong>{p.name}</strong><small>{brl(p.price * qty)}</small></div>
                  <div className="controls">
                    <button className="small" disabled={busy} onClick={() => quantity(p.id, -1)}>−</button>
                    <span>{qty}</span>
                    <button className="small" disabled={busy} onClick={() => quantity(p.id, 1)}>+</button>
                  </div>
                </div>
              ))}
              <div className="total"><span>Total</span><strong>{brl(total)}</strong></div>

              {data.totals.revenue > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#657184", marginBottom: 4 }}>
                    <span>Meta diária</span>
                    <span>{brl(data.totals.revenue)} / {brl(dailyGoal)}</span>
                  </div>
                  <div style={{ background: "#e9edf2", borderRadius: 4, height: 8 }}>
                    <div style={{ background: data.totals.revenue >= dailyGoal ? "#16a34a" : "#d84416", height: 8, borderRadius: 4, width: `${Math.min(100, (data.totals.revenue / dailyGoal) * 100)}%`, transition: "width 0.3s" }} />
                  </div>
                </div>
              )}

              <label>Cupom de desconto</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="CÓDIGO" style={{ flex: 1, fontSize: 13, padding: "8px 10px", textTransform: "uppercase" }} />
                <button className="small" disabled={busy} onClick={async () => {
                  if (!couponCode) return;
                  try {
                    const r = await fetch("/api/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "apply-coupon", code: couponCode, subtotal: total }) });
                    const d = await r.json();
                    if (!r.ok) throw Error(d.error);
                    setDiscount(d.discount);
                    setSuccess(`Cupom aplicado! -${brl(d.discount)}`);
                  } catch (e) { setError((e as Error).message); }
                }}>Aplicar</button>
              </div>
              {discount > 0 && <p className="hint" style={{ color: "#16a34a" }}>Desconto: -{brl(discount)} <button className="small" onClick={() => { setDiscount(0); setCouponCode(""); }} style={{ padding: "2px 6px", fontSize: 11 }}>remover</button></p>}

              <label>Observação</label>
              <input value={saleNote} onChange={(e) => setSaleNote(e.target.value)} placeholder="Ex.: Sem cebola" style={{ fontSize: 13, padding: "8px 10px" }} />

              <p id="payment-label" style={{ marginTop: 12 }}>Forma de pagamento</p>
              <div style={{ display: "flex", gap: 8, margin: "8px 0" }}>
                {["Pix", "Dinheiro", "Cartão"].map((v) => (
                  <button key={v} type="button" disabled={busy} onClick={() => { setPayment(v); saleId.current = ""; }}
                    style={{
                      flex: 1, padding: "12px 8px", borderRadius: 8, border: payment === v ? "2px solid #d84416" : "1px solid #dce2e8",
                      background: payment === v ? "#fff0e7" : "white", color: payment === v ? "#d84416" : "#1d2532",
                      fontWeight: payment === v ? 700 : 400, cursor: busy ? "not-allowed" : "pointer", fontSize: 14,
                      transition: "all .15s",
                    }}>
                    {v === "Pix" && "⚡ "}{v === "Dinheiro" && "💵 "}{v === "Cartão" && "💳 "}{v}
                  </button>
                ))}
              </div>

              {payment === "Dinheiro" && (<><label htmlFor="received" style={{ fontSize: 13, fontWeight: 600 }}>Valor recebido (R$)</label><input id="received" inputMode="decimal" value={received} disabled={busy} onChange={(e) => setReceived(e.target.value)} placeholder="0,00" style={{ fontSize: 16, padding: "10px 12px" }} /></>)}

              <div className="fieldgrid" style={{ marginTop: 8 }}>
                <div>
                  <label>Gorjeta (R$)</label>
                  <input inputMode="decimal" value={tip} disabled={busy} onChange={(e) => setTip(e.target.value)} placeholder="0,00" style={{ fontSize: 13, padding: "8px 10px" }} />
                </div>
                <div>
                  <label>Dividir entre</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button className="small" disabled={busy || split <= 1} onClick={() => setSplit((s) => s - 1)}>−</button>
                    <span style={{ fontWeight: 700, fontSize: 18 }}>{split}</span>
                    <button className="small" disabled={busy || split >= 20} onClick={() => setSplit((s) => s + 1)}>+</button>
                    <span className="hint">= {brl(Math.ceil((total - discount + (tip ? cents(tip) : 0)) / split))}</span>
                  </div>
                </div>
              </div>

              <button style={{ marginTop: 16 }} disabled={busy || !lines.length} onClick={() => void checkout()}>
                {busy ? "Finalizando…" : "Finalizar pedido"}
              </button>
            </aside>
          </div>
        </TabsContent>

        {/* === LANCHES === */}
        <TabsContent value="lanches">
          <div className="heading"><div><p>CARDÁPIO</p><h1>Seus lanches, do seu jeito.</h1></div>
            <div style={{ display: "flex", gap: 8 }}>
              <a href="/api/export?type=products" className="small" style={{ display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}><Download size={14} /> CSV</a>
              <span className="badge">{data.products.filter((p) => p.active).length} disponíveis</span>
            </div>
          </div>
          <div className="columns">
            <section className="panel">
              <h2>Lanches cadastrados</h2>
              {!data.products.length && <p className="hint">Nenhum lanche cadastrado.</p>}
              {data.products.map((p) => (
                <div className="row" key={p.id}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1 }}>
                    {p.photo && <img src={p.photo} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }} />}
                    <div>
                      <strong>{p.name}</strong> <small style={{ background: "#f3f5f7", padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>{p.category}</small>
                      <small>{p.description}</small>
                      <b>{brl(p.price)}</b>
                      <small>{p.active ? (p.stock >= 0 ? `Estoque: ${p.stock}` : "Disponível") : "Pausado"}</small>
                    </div>
                  </div>
                  <div className="controls">
                    <button className="small" disabled={busy} onClick={() => { setProduct({ ...p, price: (p.price / 100).toFixed(2).replace(".", ","), stock: String(p.stock), cost: p.cost ? (p.cost / 100).toFixed(2).replace(".", ",") : "" }); productId.current = p.id; }}><Edit size={14} /></button>
                    <button className="small" disabled={busy} onClick={() => void toggleProduct(p)}>{p.active ? "Pausar" : "Ativar"}</button>
                    <button className="small" disabled={busy} onClick={() => void deleteProduct(p.id)} style={{ color: "#c32626" }}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </section>

            <form className="panel" onSubmit={saveProduct}>
              <h2>{product.id ? "Editar lanche" : "Cadastrar lanche"}</h2>
              <label>Nome do lanche</label>
              <input required maxLength={150} disabled={busy} value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} placeholder="Ex.: X-salada" />
              <label>Ingredientes / descrição</label>
              <textarea maxLength={500} disabled={busy} value={product.description} onChange={(e) => setProduct({ ...product, description: e.target.value })} placeholder="Pão, hambúrguer, queijo…" />
              <label>Preço de venda (R$)</label>
              <input required inputMode="decimal" disabled={busy} value={product.price} onChange={(e) => setProduct({ ...product, price: e.target.value })} placeholder="18,50" />
              <label>Custo do lanche (R$) — para lucro</label>
              <input inputMode="decimal" disabled={busy} value={product.cost} onChange={(e) => setProduct({ ...product, cost: e.target.value })} placeholder="8,00" />
              <label>Categoria</label>
              <input disabled={busy} value={product.category} onChange={(e) => setProduct({ ...product, category: e.target.value })} placeholder="Ex.: Lanches, Bebidas, Porções" />
              <label>Estoque (-1 = ilimitado)</label>
              <input inputMode="numeric" disabled={busy} value={product.stock} onChange={(e) => setProduct({ ...product, stock: e.target.value })} placeholder="-1" />
              <label>Foto do lanche</label>
              <input ref={productPhotoInput} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} />
              <button style={{ marginTop: 16 }} disabled={busy}>{busy ? "Salvando…" : "Salvar lanche"}</button>
              {product.id && <button type="button" className="small" style={{ marginTop: 8 }} disabled={busy} onClick={() => { setProduct({ id: "", name: "", description: "", price: "", category: "Geral", stock: "-1", cost: "" }); productId.current = ""; }}>Cancelar</button>}
            </form>
          </div>
        </TabsContent>

        {/* === GASTOS === */}
        <TabsContent value="gastos">
          <div className="heading"><div><p>COMPRAS E DESPESAS</p><h1>Comprovante salvo. Gasto organizado.</h1></div>
            <div style={{ display: "flex", gap: 8 }}>
              <a href="/api/export?type=expenses" className="small" style={{ display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}><Download size={14} /> CSV</a>
              <span className="badge">{brl(data.totals.costs)} no período</span>
            </div>
          </div>
          <div className="columns">
            <form className="panel" onSubmit={saveExpense}>
              <h2>Registrar gasto</h2>
              <div className="fieldgrid">
                <div><label>Mercado / descrição</label><input required maxLength={150} disabled={busy} value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Ex.: Mercado do bairro" /></div>
                <div><label>Data da compra</label><input type="date" required disabled={busy} value={expenseDay} onChange={(e) => setExpenseDay(e.target.value)} /></div>
              </div>
              <label>Valor total (R$)</label>
              <input required inputMode="decimal" disabled={busy} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
              <label><Camera size={18} style={{ display: "inline" }} /> Foto do comprovante</label>
              <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={busy} onChange={(e) => selectPhoto(e.target.files?.[0])} />
              <p className="notice">JPG, PNG ou WebP, até 8 MB. Opcional.</p>
              {photoUrl && <img src={photoUrl} alt="Prévia" className="receipt" />}
              <button style={{ marginTop: 16 }} disabled={busy}>{busy ? "Salvando…" : "Salvar gasto"}</button>
            </form>
            <aside className="panel">
              <h2>Gastos no período</h2>
              <p className="notice">{from.split("-").reverse().join("/")} até {to.split("-").reverse().join("/")}</p>
              {!data.expenses.length && <p className="hint">Nenhum gasto no período.</p>}
              {data.expenses.map((e) => (
                <div className="row" key={e.id}>
                  <div>
                    <strong>{e.merchant}</strong>
                    <small>{e.day.split("-").reverse().join("/")}</small>
                    {e.receipt && <a href={"/api/receipt?id=" + e.id} target="_blank" rel="noopener noreferrer" style={{ color: "#d84416" }}>Ver comprovante</a>}
                  </div>
                  <b>{brl(e.amount)}</b>
                </div>
              ))}
            </aside>
          </div>
        </TabsContent>

        {/* === GESTÃO === */}
        <TabsContent value="gestao">
          <div className="heading"><div><p>VISÃO GERAL</p><h1>Seu negócio em números.</h1></div>
            <div style={{ display: "flex", gap: 8 }}>
              <a href={`/api/report?from=${from}&to=${to}`} target="_blank" className="small" style={{ display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}><FileText size={14} /> Relatório</a>
              <a href={`/api/export?type=sales&from=${from}&to=${to}`} className="small" style={{ display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}><Download size={14} /> CSV Vendas</a>
              <a href={`/api/export?type=expenses&from=${from}&to=${to}`} className="small" style={{ display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}><Download size={14} /> CSV Gastos</a>
            </div>
          </div>
          <section className="panel"><div className="fieldgrid">
            <div><label>De</label><input type="date" value={from} onChange={(e) => { if (e.target.value) setFrom(e.target.value); }} /></div>
            <div><label>Até</label><input type="date" value={to} onChange={(e) => { if (e.target.value) setTo(e.target.value); }} /></div>
          </div></section>
          <div className="stats">
            <section className="panel"><span className="summary-label">Vendas</span><strong>{brl(data.totals.revenue)}</strong><p className="hint">{data.totals.count} vendas</p></section>
            <section className="panel"><span className="summary-label">Gastos</span><strong>{brl(data.totals.costs)}</strong><p className="hint">{data.expenses.length} registros</p></section>
            <section className="panel" style={{ background: "#1d2532", color: "white" }}><span>Saldo</span><strong>{brl(data.totals.revenue - data.totals.costs)}</strong><p className="notice" style={{ color: "#c7d0de" }}>Vendas - Gastos</p></section>
          </div>

          <section className="panel history">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2>Histórico de vendas</h2>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar…" style={{ padding: "6px 10px", fontSize: 13, width: 160 }} />
                <span className="hint">Pág. {page}</span>
                {page > 1 && <button className="small" onClick={() => setPage((p) => p - 1)}>Anterior</button>}
                {data.sales.length >= 200 && <button className="small" onClick={() => setPage((p) => p + 1)}>Próxima</button>}
              </div>
            </div>
            {!data.sales.length && <p className="hint">Nenhuma venda no período.</p>}
            {data.sales.map((s) => (
              <div className="row" key={s.id}>
                <div>
                  <strong>{new Date(s.created).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</strong>
                  <small>{JSON.parse(s.lines).map((x: any) => `${x.qty}× ${x.name}`).join(" · ")}</small>
                  <small>{s.payment}{s.payment === "Dinheiro" ? ` · Troco ${brl(s.received - s.total)}` : ""}{s.employee ? ` · ${s.employee}` : ""}{s.note ? ` · ${s.note}` : ""}</small>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <b>{brl(s.total)}</b>
                  <button className="small" onClick={() => printRecibo(s)} title="Imprimir recibo" style={{ padding: "4px 8px" }}><Printer size={14} /></button>
                  <button className="small" onClick={() => void deleteSale(s.id)} style={{ color: "#c32626", padding: "4px 8px" }}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </section>
        </TabsContent>

        {/* === DASHBOARD === */}
        <TabsContent value="dashboard">
          <DashboardPanel from={from} to={to} branch={selectedBranch} />
        </TabsContent>

        {/* === CONFIG === */}
        {currentUser.role === "admin" && (
          <TabsContent value="config">
            <div className="heading"><div><p>CONFIGURAÇÕES</p><h1>Gerenciar sistema.</h1></div></div>
            <div className="stats">
              <section className="panel">
                <h2>Filiais</h2>
                {branches.map((b) => <div className="row" key={b.id}><strong>{b.name}</strong></div>)}
                {showNewBranch ? (
                  <div style={{ marginTop: 12 }}>
                    <input value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} placeholder="Nome da filial" />
                    <button style={{ marginTop: 8 }} onClick={async () => { await save({ action: "create-branch", name: newBranchName }); setShowNewBranch(false); setNewBranchName(""); const d = await fetch("/api/records?action=branches").then((r) => r.json()); setBranches(d.branches); setSuccess("Filial criada!"); }}>Salvar</button>
                  </div>
                ) : <button className="small" style={{ marginTop: 12 }} onClick={() => setShowNewBranch(true)}><Plus size={14} /> Nova filial</button>}
              </section>
              <section className="panel">
                <h2>Funcionários</h2>
                {showNewUser ? (
                  <div>
                    <label>Nome</label><input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
                    <label>Usuário</label><input value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
                    <label>Senha</label><input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                    <label>Cargo</label>
                    <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                      <option value="caixa">Caixa</option>
                      <option value="gerente">Gerente</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button style={{ marginTop: 12 }} onClick={async () => { await save({ action: "create-user", ...newUser }); setShowNewUser(false); setNewUser({ username: "", password: "", name: "", role: "caixa" }); setSuccess("Funcionário criado!"); }}>Salvar</button>
                  </div>
                ) : <button className="small" style={{ marginTop: 12 }} onClick={() => setShowNewUser(true)}><Plus size={14} /> Novo funcionário</button>}
              </section>
              <section className="panel">
                <h2>Senhas padrão</h2>
                <p className="hint">Admin: admin / admin123</p>
                <p className="hint">Altere a senha do admin após o primeiro login!</p>
              </section>
            </div>
            <div className="stats" style={{ marginTop: 16 }}>
              <section className="panel">
                <h2>Backup / Restore</h2>
                <p className="hint" style={{ marginBottom: 12 }}>Exporte todos os dados ou importe de um backup anterior.</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="small" onClick={async () => {
                    const r = await fetch("/api/records?action=records&from=2000-01-01&to=2099-12-31&limit=99999");
                    const d = await r.json();
                    const blob = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url; a.download = `central-lanches-backup-${today()}.json`; a.click();
                    URL.revokeObjectURL(url);
                    toastHook.toast("success", "Backup exportado!");
                  }}><Download size={14} /> Exportar JSON</button>
                  <label className="small" style={{ cursor: "pointer" }}>
                    <input type="file" accept=".json" style={{ display: "none" }} onChange={async (e) => {
                      const file = e.target.files?.[0]; if (!file) return;
                      const text = await file.text();
                      try { const d = JSON.parse(text); await fetch("/api/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "import", data: d }) }); toastHook.toast("success", "Backup restaurado!"); await refresh(); }
                      catch { toastHook.toast("error", "Arquivo inválido."); }
                    }} />
                    <Package size={14} /> Importar JSON
                  </label>
                </div>
              </section>
              <section className="panel">
                <h2>Atalhos de Teclado</h2>
                <div style={{ fontSize: 13, lineHeight: 2 }}>
                  <div><kbd>F2</kbd> Caixa</div>
                  <div><kbd>F3</kbd> Lanches</div>
                  <div><kbd>F4</kbd> Gastos</div>
                  <div><kbd>F5</kbd> Gestão</div>
                  <div><kbd>F6</kbd> Dashboard</div>
                  <div><kbd>Esc</kbd> Limpar campos</div>
                </div>
              </section>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </main>
  );
}

function DashboardPanel({ from, to, branch }: { from: string; to: string; branch: string }) {
  const [dash, setDash] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ action: "dashboard", from, to });
    if (branch) params.set("branch", branch);
    fetch("/api/records?" + params).then((r) => r.json()).then((d) => { setDash(d); setLoading(false); }).catch(() => setLoading(false));
  }, [from, to, branch]);

  if (loading) return <p className="notice">Carregando dashboard…</p>;
  if (!dash) return <p className="error">Erro ao carregar dashboard.</p>;

  const { totals, dailySales, paymentStats } = dash;

  return (
    <>
      <div className="heading"><div><p>DASHBOARD</p><h1>Visão completa do negócio.</h1></div></div>
      <div className="stats">
        <section className="panel"><span className="summary-label">Receita total</span><strong>{brl(totals.revenue)}</strong><p className="hint">{totals.count} vendas</p></section>
        <section className="panel"><span className="summary-label">Despesas</span><strong>{brl(totals.costs)}</strong></section>
        <section className="panel" style={{ background: "#1d2532", color: "white" }}><span>Lucro estimado</span><strong>{brl(totals.revenue - totals.costs)}</strong></section>
      </div>

      <div className="stats">
        <section className="panel">
          <h2>Vendas por dia</h2>
          {dailySales.length === 0 && <p className="hint">Sem dados no período.</p>}
          {dailySales.map((d: any) => (
            <div className="row" key={d.day}>
              <strong>{d.day.split("-").reverse().join("/")}</strong>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ background: "#d84416", height: 8, borderRadius: 4, width: `${Math.min(100, (d.total / Math.max(...dailySales.map((x: any) => x.total))) * 100)}%`, minWidth: 4 }} />
                <b>{brl(d.total)}</b>
                <span className="hint">{d.count} vendas</span>
              </div>
            </div>
          ))}
        </section>
        <section className="panel">
          <h2>Formas de pagamento</h2>
          {paymentStats.map((p: any) => (
            <div className="row" key={p.payment}>
              <strong>{p.payment}</strong>
              <div><b>{brl(p.total)}</b> <span className="hint">({p.count} vendas)</span></div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
