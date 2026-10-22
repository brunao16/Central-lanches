"use client";

import { useEffect, useState } from "react";
import { formatCurrency, parseCurrencyToCents } from "@/lib/utils";
import { generatePixPayload } from "@/lib/pix";
import QRCode from "qrcode";
import {
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  X,
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

  // Carrinho com suporte a observações específicas por item
  const [cart, setCart] = useState<{ [id: string]: { item: MenuItem; qty: number; notes: string } }>({});
  const [cartOpen, setCartOpen] = useState(false);

  // Modal de personalização do item
  const [customizingProduct, setCustomizingProduct] = useState<MenuItem | null>(null);
  const [customNotes, setCustomNotes] = useState("");
  const [selectedAddons, setSelectedAddons] = useState<MenuItem[]>([]);

  // Checkout
  const [orderType, setOrderType] = useState<"RETIRADA" | "DELIVERY" | "MESA">("RETIRADA");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "DINHEIRO" | "DEBITO" | "CREDITO">("PIX");
  const [changeFor, setChangeFor] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finishedOrder, setFinishedOrder] = useState<any>(null);

  // Pix QR Code
  const [pixPayload, setPixPayload] = useState("");
  const [pixQrImage, setPixQrImage] = useState("");
  const [copiedPix, setCopiedPix] = useState(false);

  useEffect(() => {
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

  const addonsList = products.filter(
    (p) =>
      categories.find((c) => c.id === p.categoryId)?.name === "Adicionais" ||
      p.name.startsWith("Adicional:")
  );

  function openCustomizeModal(p: MenuItem) {
    setCustomizingProduct(p);
    setCustomNotes("");
    setSelectedAddons([]);
  }

  function toggleAddon(addon: MenuItem) {
    if (selectedAddons.find((a) => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  }

  function addQuickNote(text: string) {
    if (customNotes.includes(text)) {
      setCustomNotes(customNotes.replace(text, "").trim());
    } else {
      setCustomNotes((customNotes ? customNotes + ", " : "") + text);
    }
  }

  function confirmCustomizedItem() {
    if (!customizingProduct) return;

    let fullNotes = customNotes;
    if (selectedAddons.length > 0) {
      const addonNames = selectedAddons.map((a) => `+ ${a.name.replace("Adicional: ", "")}`).join(", ");
      fullNotes = fullNotes ? `${fullNotes} | ${addonNames}` : addonNames;
    }

    const extraPrice = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const customizedItem: MenuItem = {
      ...customizingProduct,
      price: customizingProduct.price + extraPrice,
    };

    const cartKey = `${customizingProduct.id}-${fullNotes || "padrao"}`;

    setCart((prev) => {
      const existing = prev[cartKey];
      return {
        ...prev,
        [cartKey]: {
          item: customizedItem,
          qty: existing ? existing.qty + 1 : 1,
          notes: fullNotes,
        },
      };
    });

    setCustomizingProduct(null);
  }

  function updateQty(key: string, delta: number) {
    setCart((prev) => {
      const next = { ...prev };
      if (!next[key]) return prev;
      const newQty = next[key].qty + delta;
      if (newQty <= 0) {
        delete next[key];
      } else {
        next[key].qty = newQty;
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
            productId: c.item.id.split("-")[0],
            productName: c.item.name,
            unitPrice: c.item.price,
            quantity: c.qty,
            notes: c.notes || undefined,
          })),
        }),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error);

      setFinishedOrder(d.order);
      setCart({});

      // Se pagou via PIX, gera BR Code
      if (paymentMethod === "PIX" && setting?.pixKey) {
        const payload = generatePixPayload({
          pixKey: setting.pixKey,
          merchantName: setting.restaurantName || "Central Lanches",
          merchantCity: "Fortaleza",
          amountCents: d.order.total,
          txId: d.order.code,
        });
        setPixPayload(payload);
        const qrUrl = await QRCode.toDataURL(payload, { width: 300, margin: 1 });
        setPixQrImage(qrUrl);
      }
    } catch (e: any) {
      alert("Erro ao enviar pedido: " + e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function copyPix() {
    if (!pixPayload) return;
    navigator.clipboard.writeText(pixPayload);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  }

  if (finishedOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 text-center space-y-4 shadow-xl border border-gray-100">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <h2 className="text-2xl font-black text-gray-900 leading-tight">Pedido Recebido com Sucesso!</h2>
          <p className="text-xs text-gray-500">
            A cozinha já foi notificada e seu pedido #{finishedOrder.code} começou a ser preparado!
          </p>

          {/* Se for PIX, exibe QR Code e Copia e Cola */}
          {paymentMethod === "PIX" && pixQrImage && (
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-center space-y-3">
              <div className="flex items-center justify-center gap-1.5 text-xs font-black text-emerald-800 uppercase tracking-wider">
                <QrCode size={16} />
                <span>Pague com Pix (Aprovação Imediata)</span>
              </div>
              <img src={pixQrImage} alt="QR Code Pix" className="w-48 h-48 mx-auto rounded-xl border border-emerald-100 bg-white p-2" />
              <div className="font-black text-emerald-900 text-base">
                Valor: {formatCurrency(finishedOrder.total)}
              </div>
              <button
                onClick={copyPix}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                {copiedPix ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedPix ? "Código Pix Copiado!" : "Copiar Chave Copia e Cola"}</span>
              </button>
            </div>
          )}

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left space-y-1">
            <div className="text-xs text-gray-400">Código de Acompanhamento:</div>
            <div className="text-2xl font-black text-primary">#{finishedOrder.code}</div>
          </div>

          <a
            href={`/pedido/${encodeURIComponent(finishedOrder.code)}`}
            className="block w-full py-3.5 bg-primary text-white font-black text-sm rounded-xl hover:bg-primary-hover active:scale-95 transition-all shadow-md shadow-red-200"
          >
            Acompanhar Status em Tempo Real
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
      {/* Topo da Lanchonete */}
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

        {/* Categorias horizontais */}
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
          const isLanche = categories.find((c) => c.id === p.categoryId)?.name === "Lanches";
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
                <button
                  onClick={() => openCustomizeModal(p)}
                  className="px-3.5 py-2 bg-primary text-white font-extrabold text-xs rounded-xl hover:bg-primary-hover active:scale-95 transition-all shadow-sm shadow-red-200 flex items-center gap-1"
                >
                  <Plus size={14} />
                  <span>{isLanche ? "Montar" : "Pedir"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </main>

      {/* Modal de Personalização do Lanche (Adicionais e Remover Ingredientes) */}
      {customizingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col justify-end md:justify-center p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-3xl max-w-lg w-full mx-auto max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-gray-900">{customizingProduct.name}</h3>
                <span className="text-xs font-bold text-primary">{formatCurrency(customizingProduct.price)}</span>
              </div>
              <button
                onClick={() => setCustomizingProduct(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-5 text-xs">
              {/* Opções rápidas de retirar */}
              <div>
                <span className="font-extrabold text-gray-800 block mb-2 uppercase tracking-wider text-[11px]">
                  Deseja retirar algo?
                </span>
                <div className="flex flex-wrap gap-2">
                  {["Sem cebola", "Sem tomate", "Sem alface", "Sem milho", "Sem maionese"].map((tag) => {
                    const active = customNotes.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => addQuickNote(tag)}
                        className={`px-3 py-1.5 rounded-full font-bold transition-all border ${
                          active
                            ? "bg-red-50 text-red-700 border-red-300"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {tag} {active ? "✓" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Adicionais disponíveis */}
              {addonsList.length > 0 && (
                <div>
                  <span className="font-extrabold text-gray-800 block mb-2 uppercase tracking-wider text-[11px]">
                    Turbinar com Adicionais:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {addonsList.map((addon) => {
                      const isSelected = !!selectedAddons.find((a) => a.id === addon.id);
                      return (
                        <button
                          type="button"
                          key={addon.id}
                          onClick={() => toggleAddon(addon)}
                          className={`p-2.5 rounded-xl border text-left flex justify-between items-center transition-all ${
                            isSelected
                              ? "bg-emerald-50 border-emerald-300 text-emerald-900 ring-1 ring-emerald-300"
                              : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <span className="font-bold">{addon.name.replace("Adicional: ", "")}</span>
                          <span className="font-black text-primary">+{formatCurrency(addon.price)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Observação Livre */}
              <div>
                <label className="font-extrabold text-gray-800 block mb-1 uppercase tracking-wider text-[11px]">
                  Observações para a cozinha
                </label>
                <textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Ex: ponto da carne, caprichar no molho..."
                  rows={2}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-medium"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase">Total do Item</div>
                <div className="text-base font-black text-gray-900">
                  {formatCurrency(
                    customizingProduct.price + selectedAddons.reduce((s, a) => s + a.price, 0)
                  )}
                </div>
              </div>
              <button
                onClick={confirmCustomizedItem}
                className="py-3 px-6 bg-primary hover:bg-primary-hover active:scale-95 text-white font-black text-xs rounded-xl shadow-md shadow-red-200 transition-all flex items-center gap-1.5"
              >
                <span>Adicionar à Sacola</span>
                <Check size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Modal de Finalização do Pedido */}
      {cartOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl max-w-lg w-full mx-auto max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-black text-base text-gray-900 flex items-center gap-2">
                <ShoppingBag size={18} className="text-primary" />
                <span>Sua Sacola</span>
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* Lista dos Itens no Carrinho */}
              <div className="divide-y divide-gray-100">
                {Object.entries(cart).map(([key, c]) => (
                  <div key={key} className="py-3 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-extrabold text-sm text-gray-900">{c.item.name}</div>
                      {c.notes && (
                        <div className="text-[11px] text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded mt-1 inline-block">
                          {c.notes}
                        </div>
                      )}
                      <div className="font-black text-primary text-xs mt-1">
                        {formatCurrency(c.item.price * c.qty)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-2 py-1">
                      <button onClick={() => updateQty(key, -1)} className="p-1 font-bold">
                        <Minus size={14} />
                      </button>
                      <span className="font-black">{c.qty}</span>
                      <button onClick={() => updateQty(key, 1)} className="p-1 font-bold">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Formulário de Envio */}
              <form onSubmit={handleSendOrder} className="space-y-3 pt-2 border-t border-gray-100">
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
                      <label className="font-bold text-gray-700">Seu Bairro (Taxa de Entrega)</label>
                      <select
                        onChange={(e) => {
                          const z = zones.find((item) => item.id === e.target.value);
                          if (z) setSelectedZone(z);
                        }}
                        className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-semibold"
                      >
                        {zones.map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.neighborhood} - {formatCurrency(z.fee)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-gray-700">Endereço Completo</label>
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
                  <label className="font-bold text-gray-700">Forma de Pagamento</label>
                  <div className="grid grid-cols-4 gap-1.5 mt-1">
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
                    <label className="font-bold text-gray-700">Troco para quanto?</label>
                    <input
                      type="text"
                      placeholder="Ex: 50,00"
                      value={changeFor}
                      onChange={(e) => setChangeFor(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                    />
                  </div>
                )}

                <div className="pt-2 border-t border-gray-200 space-y-1">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal:</span>
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
