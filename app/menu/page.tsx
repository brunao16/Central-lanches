"use client";

import { useEffect, useState } from "react";
import { formatCurrency, parseCurrencyToCents } from "@/lib/utils";
import {
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
  Phone,
  User,
  MapPin,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
}

export default function PublicMenuPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [setting, setSetting] = useState<any>(null);
  const [selectedCat, setSelectedCat] = useState("all");
  const [cart, setCart] = useState<{ [id: string]: { item: MenuItem; qty: number; notes: string } }>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [orderType, setOrderType] = useState<"RETIRADA" | "DELIVERY" | "MESA">("RETIRADA");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "DINHEIRO" | "DEBITO" | "CREDITO">("PIX");
  const [changeFor, setChangeFor] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finishedCode, setFinishedCode] = useState<string | null>(null);

  useEffect(() => {
    // Pega parâmetro de mesa se houver (?mesa=3)
    const params = new URLSearchParams(window.location.search);
    const mesa = params.get("mesa");
    if (mesa) setOrderType("MESA");

    fetch("/api/public/menu")
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories || []);
        setProducts(d.products || []);
        setZones(d.zones || []);
        setSetting(d.setting);
        if (d.zones?.[0]) setSelectedZone(d.zones[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  function addToCart(p: MenuItem) {
    setCart((prev) => {
      const existing = prev[p.id];
      return {
        ...prev,
        [p.id]: {
          item: p,
          qty: existing ? existing.qty + 1 : 1,
          notes: existing ? existing.notes : "",
        },
      };
    });
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) => {
      const next = { ...prev };
      if (!next[id]) return prev;
      const newQty = next[id].qty + delta;
      if (newQty <= 0) {
        delete next[id];
      } else {
        next[id].qty = newQty;
      }
      return next;
    });
  }

  const cartList = Object.values(cart);
  const subtotal = cartList.reduce((acc, c) => acc + c.item.price * c.qty, 0);
  const deliveryFee = orderType === "DELIVERY" ? (selectedZone?.fee || setting?.deliveryFee || 500) : 0;
  const total = subtotal + deliveryFee;

  async function handleSendOrder(e: React.FormEvent) {
    e.preventDefault();
    if (cartList.length === 0) return alert("Adicione produtos à sacola.");
    if (!customerName || !customerPhone) return alert("Preencha seu nome e telefone WhatsApp.");
    if (orderType === "DELIVERY" && !deliveryAddress) return alert("Informe seu endereço completo.");

    setSubmitting(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const tableNum = params.get("mesa") ? parseInt(params.get("mesa")!, 10) : undefined;

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: orderType,
          tableNumber: tableNum,
          customerName,
          customerPhone,
          deliveryAddress: orderType === "DELIVERY" ? deliveryAddress : undefined,
          deliveryFee,
          paymentMethod,
          amountReceived: paymentMethod === "DINHEIRO" && changeFor ? parseCurrencyToCents(changeFor) : undefined,
          items: cartList.map((c) => ({
            productId: c.item.id,
            productName: c.item.name,
            unitPrice: c.item.price,
            quantity: c.qty,
            notes: c.notes || undefined,
          })),
        }),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error);

      setFinishedCode(d.order.code);
      setCart({});
    } catch (e: any) {
      alert("Erro ao enviar pedido: " + e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (finishedCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-sm w-full p-8 text-center space-y-4 shadow-xl border border-gray-100">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <h2 className="text-2xl font-black text-gray-900">Pedido Confirmado!</h2>
          <p className="text-sm text-gray-500">
            Seu pedido foi enviado direto para a nossa cozinha e já está sendo preparado.
          </p>
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left space-y-1">
            <div className="text-xs text-gray-400">Código de Acompanhamento:</div>
            <div className="text-xl font-black text-primary">{finishedCode}</div>
          </div>
          <a
            href={`/pedido/${encodeURIComponent(finishedCode)}`}
            className="block w-full py-3 bg-primary text-white font-extrabold text-sm rounded-xl hover:bg-primary-hover active:scale-95 transition-all shadow-md shadow-red-200"
          >
            Acompanhar Status
          </a>
        </div>
      </div>
    );
  }

  const filteredProducts = products.filter(
    (p) => selectedCat === "all" || p.categoryId === selectedCat
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Banner Superior da Lanchonete */}
      <header className="bg-white border-b border-gray-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-xl shadow-md shadow-red-200">
              CL
            </div>
            <div>
              <h1 className="text-base font-black text-gray-900 leading-tight">
                {setting?.restaurantName || "Central Lanches"}
              </h1>
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                ● Aberto agora para pedidos
              </span>
            </div>
          </div>
        </div>

        {/* Categorias horizontais com rolagem suave */}
        <div className="max-w-3xl mx-auto px-4 pb-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSelectedCat("all")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedCat === "all"
                ? "bg-primary text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Todos
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCat === c.id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </header>

      {/* Lista de Produtos */}
      <main className="max-w-3xl mx-auto p-4 space-y-3">
        {filteredProducts.map((p) => {
          const inCart = cart[p.id];
          return (
            <div
              key={p.id}
              className="bg-white p-3.5 rounded-2xl border border-gray-200/70 shadow-sm flex gap-3.5 items-center justify-between"
            >
              <div className="flex-1 space-y-1">
                <h3 className="font-extrabold text-sm text-gray-900">{p.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-2">{p.description}</p>
                <div className="font-black text-primary text-sm pt-1">
                  {formatCurrency(p.price)}
                </div>
              </div>

              {p.imageUrl ? (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl bg-red-50 flex items-center justify-center text-primary text-2xl flex-shrink-0">
                  🍔
                </div>
              )}

              <div className="flex-shrink-0 pl-1">
                {inCart ? (
                  <div className="flex items-center gap-2 bg-red-50 text-primary border border-red-200 rounded-xl px-2 py-1">
                    <button onClick={() => updateQty(p.id, -1)} className="p-1 font-bold">
                      <Minus size={14} />
                    </button>
                    <span className="text-xs font-black">{inCart.qty}</span>
                    <button onClick={() => updateQty(p.id, 1)} className="p-1 font-bold">
                      <Plus size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(p)}
                    className="px-3.5 py-2 bg-primary text-white font-extrabold text-xs rounded-xl hover:bg-primary-hover active:scale-95 transition-all shadow-sm shadow-red-200"
                  >
                    Adicionar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </main>

      {/* Botão Flutuante de Ver Sacola */}
      {cartList.length > 0 && !cartOpen && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-lg mx-auto">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full py-3.5 px-5 bg-primary text-white rounded-2xl font-black text-sm flex items-center justify-between shadow-xl shadow-red-400/40 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} />
              <span>Ver Sacola ({cartList.reduce((a, b) => a + b.qty, 0)})</span>
            </div>
            <span>{formatCurrency(total)}</span>
          </button>
        </div>
      )}

      {/* Modal / Gaveta de Finalização do Pedido */}
      {cartOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl max-w-lg w-full mx-auto max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-black text-base text-gray-900">Sua Sacola</h2>
              <button
                onClick={() => setCartOpen(false)}
                className="text-xs font-bold text-gray-400 hover:text-gray-700"
              >
                Voltar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Itens */}
              <div className="space-y-2">
                {cartList.map((c) => (
                  <div key={c.item.id} className="p-3 bg-gray-50 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center text-sm font-bold text-gray-900">
                      <span>{c.item.name}</span>
                      <span>{formatCurrency(c.item.price * c.qty)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        placeholder="Observações (ex: sem tomate)"
                        value={c.notes}
                        onChange={(e) => {
                          const n = e.target.value;
                          setCart((prev) => ({
                            ...prev,
                            [c.item.id]: { ...prev[c.item.id], notes: n },
                          }));
                        }}
                        className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-lg w-3/5 focus:outline-none focus:border-primary"
                      />
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(c.item.id, -1)} className="p-1 text-gray-500">
                          <Minus size={14} />
                        </button>
                        <span className="text-xs font-bold">{c.qty}</span>
                        <button onClick={() => updateQty(c.item.id, 1)} className="p-1 text-gray-500">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Formulário de Identificação */}
              <form onSubmit={handleSendOrder} className="space-y-3 text-xs">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType("RETIRADA")}
                    className={`flex-1 py-2 font-bold rounded-xl border ${
                      orderType === "RETIRADA"
                        ? "bg-primary text-white border-primary"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    Retirar no Balcão
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType("DELIVERY")}
                    className={`flex-1 py-2 font-bold rounded-xl border ${
                      orderType === "DELIVERY"
                        ? "bg-primary text-white border-primary"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    Entrega em Casa
                  </button>
                </div>

                <div>
                  <label className="font-bold text-gray-700">Seu Nome</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Silva"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700">Seu WhatsApp</label>
                  <input
                    type="tel"
                    required
                    placeholder="(85) 99999-9999"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-semibold"
                  />
                </div>

                {orderType === "DELIVERY" && (
                  <>
                    <div>
                      <label className="font-bold text-gray-700">Seu Bairro (para cálculo da taxa)</label>
                      <select
                        onChange={(e) => {
                          const z = zones.find((item) => item.id === e.target.value);
                          if (z) setSelectedZone(z);
                        }}
                        className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                      >
                        {zones.map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.neighborhood} - {formatCurrency(z.fee)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-gray-700">Endereço Completo de Entrega</label>
                      <input
                        type="text"
                        required
                        placeholder="Rua, número, complemento e ponto de referência"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                      />
                    </div>
                  </>
                )}

                {/* Forma de Pagamento */}
                <div>
                  <label className="font-bold text-gray-700">Como vai pagar?</label>
                  <div className="grid grid-cols-3 gap-1.5 mt-1">
                    {(["PIX", "DINHEIRO", "DEBITO", "CREDITO"] as const).map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setPaymentMethod(m)}
                        className={`py-2 text-[11px] font-bold rounded-lg border ${
                          paymentMethod === m
                            ? "bg-gray-900 text-white border-gray-900"
                            : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {m === "DINHEIRO" ? "Dinheiro" : m}
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === "DINHEIRO" && (
                  <div>
                    <label className="font-bold text-gray-700">Precisa de troco para quanto?</label>
                    <input
                      type="text"
                      placeholder="Ex: 50,00 (ou deixe em branco se não precisa)"
                      value={changeFor}
                      onChange={(e) => setChangeFor(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                    />
                  </div>
                )}

                {/* Resumo de Valores */}
                <div className="pt-2 border-t border-gray-200 space-y-1">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal dos itens:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {orderType === "DELIVERY" && (
                    <div className="flex justify-between text-gray-500">
                      <span>Taxa de entrega:</span>
                      <span>{formatCurrency(deliveryFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-gray-900 pt-1">
                    <span>Total do Pedido:</span>
                    <span className="text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-primary text-white rounded-xl font-black text-sm hover:bg-primary-hover active:scale-[0.98] transition-all shadow-md shadow-red-200 disabled:opacity-50"
                >
                  {submitting ? "Enviando Pedido..." : "Confirmar e Enviar Pedido"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
