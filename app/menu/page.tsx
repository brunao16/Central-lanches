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
  MessageCircle,
  Flame,
  Search,
} from "lucide-react";
import { createWhatsAppLink } from "@/lib/utils";

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
  const [selectedCat, setSelectedCat] = useState("");
  const [search, setSearch] = useState("");

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

  // Cupom de Desconto
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountCents: number; description: string } | null>(null);
  const [couponError, setCouponError] = useState("");

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
        const cats = d.categories || [];
        setCategories(cats);
        setProducts(d.products || []);
        setZones(d.zones || []);
        setSetting(d.setting);
        if (cats.length > 0) setSelectedCat(cats[0].id);
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
  const discountAmount = appliedCoupon ? Math.min(subtotal, appliedCoupon.discountCents) : 0;
  const total = Math.max(0, subtotal - discountAmount + deliveryFee);

  function applyCoupon() {
    setCouponError("");
    const clean = couponCode.trim().toUpperCase();
    if (!clean) return;

    if (clean === "PRIMEIRACOMPRA" || clean === "PRIMEIRO10") {
      setAppliedCoupon({
        code: clean,
        discountCents: 1000, // R$ 10,00 OFF
        description: "R$ 10,00 OFF na Primeira Compra",
      });
    } else if (clean === "CENTRAL5" || clean === "LANCHE5") {
      setAppliedCoupon({
        code: clean,
        discountCents: 500, // R$ 5,00 OFF
        description: "R$ 5,00 OFF no pedido",
      });
    } else if (clean === "FRETEGRATIS") {
      setAppliedCoupon({
        code: clean,
        discountCents: deliveryFee,
        description: "Frete Grátis aplicado",
      });
    } else {
      setCouponError("Cupom inválido ou expirado.");
    }
  }

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
          discount: discountAmount,
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

      // Notificação Automática no WhatsApp do Cliente
      if (customerPhone) {
        const orderUrl = `${window.location.origin}/pedido/${encodeURIComponent(d.order.code)}`;
        const itemsList = cartList
          .map((c) => `• ${c.qty}x ${c.item.name}${c.notes ? ` (${c.notes})` : ""}`)
          .join("\n");
        const waMsg = `Olá, ${customerName}! 🍔\nSeu pedido *#${d.order.code}* na *Central Lanches* foi confirmado com sucesso!\n\n*Resumo do Pedido:*\n${itemsList}\n\n*Total:* ${formatCurrency(d.order.total)}\n*Pagamento:* ${paymentMethod}\n\nAcompanhe o preparo em tempo real aqui:\n${orderUrl}\n\nAgradecemos a sua preferência!`;
        const waLink = createWhatsAppLink(customerPhone, waMsg);

        setTimeout(() => {
          window.open(waLink, "_blank");
        }, 1200);
      }

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
      <div className="min-h-screen bg-[#0d0f12] text-gray-100 flex items-center justify-center p-4">
        <div className="bg-[#161a22] rounded-3xl max-w-md w-full p-6 md:p-8 text-center space-y-4 shadow-2xl border border-gray-800">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold shadow-lg shadow-emerald-500/10">
            ✓
          </div>
          <h2 className="text-2xl font-black text-white leading-tight">Pedido Recebido com Sucesso!</h2>
          <p className="text-xs text-gray-400">
            A cozinha já foi notificada e seu pedido #{finishedOrder.code} começou a ser preparado!
          </p>

          {/* Pix no tema Dark */}
          {paymentMethod === "PIX" && pixQrImage && (
            <div className="p-4 bg-emerald-950/30 rounded-2xl border border-emerald-800/40 text-center space-y-3">
              <div className="flex items-center justify-center gap-1.5 text-xs font-black text-emerald-400 uppercase tracking-wider">
                <QrCode size={16} />
                <span>Pague com Pix (Aprovação Imediata)</span>
              </div>
              <img src={pixQrImage} alt="QR Code Pix" className="w-48 h-48 mx-auto rounded-xl border border-gray-700 bg-white p-2 shadow-md" />
              <div className="font-black text-emerald-300 text-base">
                Valor: {formatCurrency(finishedOrder.total)}
              </div>
              <button
                onClick={copyPix}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/40"
              >
                {copiedPix ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedPix ? "Código Pix Copiado!" : "Copiar Chave Copia e Cola"}</span>
              </button>
            </div>
          )}

          <div className="p-4 bg-[#0d0f12] rounded-2xl border border-gray-800 text-left space-y-1">
            <div className="text-xs text-gray-500">Código de Acompanhamento:</div>
            <div className="text-2xl font-black text-red-500">#{finishedOrder.code}</div>
          </div>

          {finishedOrder.customerPhone && (
            <a
              href={createWhatsAppLink(
                finishedOrder.customerPhone,
                `Olá, ${finishedOrder.customerName || "Cliente"}! Seu pedido #${finishedOrder.code} na Central Lanches está confirmado no valor de ${formatCurrency(finishedOrder.total)}. Acompanhe em tempo real: ${typeof window !== "undefined" ? window.location.origin : ""}/pedido/${finishedOrder.code}`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-emerald-950"
            >
              <MessageCircle size={18} />
              <span>Receber Atualizações no WhatsApp</span>
            </a>
          )}

          <a
            href={`/pedido/${encodeURIComponent(finishedOrder.code)}`}
            className="block w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-black text-sm rounded-xl active:scale-95 transition-all shadow-lg shadow-red-950"
          >
            Acompanhar Status em Tempo Real
          </a>
        </div>
      </div>
    );
  }

  const filteredProducts = products.filter((p) => {
    const matchesCat = search ? true : (!selectedCat || p.categoryId === selectedCat);
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0d0f12] text-gray-100 pb-28 selection:bg-red-600 selection:text-white">
      {/* Topo da Lanchonete Premium Dark */}
      <header className="bg-[#141820]/90 backdrop-blur-md border-b border-gray-800/80 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-red-600/20">
              <Flame size={24} />
            </div>
            <div>
              <h1 className="text-base font-black text-white leading-tight flex items-center gap-1.5">
                <span>{setting?.restaurantName || "Central Lanches"}</span>
                <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full font-bold">
                  CARDÁPIO
                </span>
              </h1>
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Aberto agora para pedidos
              </span>
            </div>
          </div>
        </div>

        {/* Busca rápida */}
        <div className="max-w-3xl mx-auto px-4 pb-2.5">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar lanches, porções, adicionais..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#1b2029] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/40 transition-all"
            />
          </div>
        </div>

        {/* Categorias horizontais estilo Cyber/Dark */}
        <div className="max-w-3xl mx-auto px-4 pb-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${
                selectedCat === c.id
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "bg-[#1b2029] text-gray-400 hover:text-white hover:bg-[#252c38] border border-gray-800"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </header>

      {/* Lista de Produtos Cards Dark */}
      <main className="max-w-3xl mx-auto p-4 space-y-3">
        {filteredProducts.map((p) => {
          const isLanche = categories.find((c) => c.id === p.categoryId)?.name === "Lanches";
          return (
            <div
              key={p.id}
              className="bg-[#141820] hover:bg-[#181d26] p-3.5 rounded-2xl border border-gray-800/80 shadow-md transition-all flex gap-3.5 items-center justify-between group"
            >
              <div className="flex-1 space-y-1">
                <h3 className="font-extrabold text-sm text-gray-100 group-hover:text-red-400 transition-colors">
                  {p.name}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>
                <div className="font-black text-red-500 text-sm pt-1 tracking-tight">
                  {formatCurrency(p.price)}
                </div>
              </div>

              {p.imageUrl ? (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-900 border border-gray-800">
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl bg-red-950/30 border border-red-900/30 flex items-center justify-center text-red-400 text-2xl flex-shrink-0">
                  🍔
                </div>
              )}

              <div className="flex-shrink-0 pl-1">
                <button
                  onClick={() => openCustomizeModal(p)}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-red-600/30 flex items-center gap-1"
                >
                  <Plus size={14} />
                  <span>{isLanche ? "Montar" : "Pedir"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </main>

      {/* Modal de Personalização do Lanche (Tema Dark) */}
      {customizingProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex flex-col justify-end md:justify-center p-0 md:p-4 animate-in fade-in duration-150">
          <div className="bg-[#141820] text-gray-100 rounded-t-3xl md:rounded-3xl max-w-lg w-full mx-auto max-h-[85vh] flex flex-col shadow-2xl border border-gray-800 animate-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-white">{customizingProduct.name}</h3>
                <span className="text-xs font-bold text-red-500">{formatCurrency(customizingProduct.price)}</span>
              </div>
              <button
                onClick={() => setCustomizingProduct(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-5 text-xs">
              {/* Opções de retirar */}
              <div>
                <span className="font-extrabold text-gray-300 block mb-2 uppercase tracking-wider text-[11px]">
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
                            ? "bg-red-500/20 text-red-400 border-red-500/50"
                            : "bg-[#1b2029] text-gray-400 border-gray-800 hover:text-white hover:border-gray-700"
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
                  <span className="font-extrabold text-gray-300 block mb-2 uppercase tracking-wider text-[11px]">
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
                              ? "bg-emerald-950/30 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500"
                              : "bg-[#1b2029] border-gray-800 text-gray-300 hover:border-gray-700"
                          }`}
                        >
                          <span className="font-bold">{addon.name.replace("Adicional: ", "")}</span>
                          <span className="font-black text-red-400">+{formatCurrency(addon.price)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Observação Livre */}
              <div>
                <label className="font-extrabold text-gray-300 block mb-1 uppercase tracking-wider text-[11px]">
                  Observações para a cozinha
                </label>
                <textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Ex: carne bem passada, caprichar na batata..."
                  rows={2}
                  className="w-full p-2.5 bg-[#1b2029] border border-gray-800 rounded-xl focus:outline-none focus:border-red-500 font-medium text-white placeholder-gray-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-800 bg-[#0d0f12] flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase">Total do Item</div>
                <div className="text-base font-black text-white">
                  {formatCurrency(
                    customizingProduct.price + selectedAddons.reduce((s, a) => s + a.price, 0)
                  )}
                </div>
              </div>
              <button
                onClick={confirmCustomizedItem}
                className="py-3 px-6 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-xs rounded-xl shadow-lg shadow-red-950 transition-all flex items-center gap-1.5"
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
            className="w-full py-3.5 px-5 bg-gradient-to-r from-red-600 to-amber-600 text-white rounded-2xl font-black text-sm flex items-center justify-between shadow-2xl shadow-red-950 active:scale-[0.98] transition-all border border-red-500/30"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} />
              <span>Ver Sacola ({cartList.reduce((a, b) => a + b.qty, 0)})</span>
            </div>
            <span>{formatCurrency(total)}</span>
          </button>
        </div>
      )}

      {/* Modal de Finalização do Pedido (Tema Dark) */}
      {cartOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex flex-col justify-end">
          <div className="bg-[#141820] text-gray-100 rounded-t-3xl max-w-lg w-full mx-auto max-h-[90vh] flex flex-col shadow-2xl border border-gray-800 animate-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="font-black text-base text-white flex items-center gap-2">
                <ShoppingBag size={18} className="text-red-500" />
                <span>Sua Sacola</span>
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* Lista dos Itens no Carrinho */}
              <div className="divide-y divide-gray-800/80">
                {Object.entries(cart).map(([key, c]) => (
                  <div key={key} className="py-3 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-extrabold text-sm text-gray-100">{c.item.name}</div>
                      {c.notes && (
                        <div className="text-[11px] text-amber-300 font-black uppercase bg-amber-950/60 border border-amber-600/50 px-2 py-1 rounded-md mt-1 inline-block tracking-wide">
                          OBS: {c.notes.toUpperCase()}
                        </div>
                      )}
                      <div className="font-black text-red-500 text-xs mt-1">
                        {formatCurrency(c.item.price * c.qty)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-[#1b2029] border border-gray-800 rounded-xl px-2 py-1">
                      <button onClick={() => updateQty(key, -1)} className="p-1 font-bold text-gray-400 hover:text-white">
                        <Minus size={14} />
                      </button>
                      <span className="font-black text-white">{c.qty}</span>
                      <button onClick={() => updateQty(key, 1)} className="p-1 font-bold text-gray-400 hover:text-white">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Compre Junto: Sugestões Inteligentes para Aumentar o Ticket Médio */}
              {products.filter((p) => {
                const catName = categories.find((c) => c.id === p.categoryId)?.name?.toLowerCase() || "";
                return catName.includes("bebida") || catName.includes("porç") || p.name.toLowerCase().includes("batata") || p.name.toLowerCase().includes("coca");
              }).slice(0, 3).length > 0 && (
                <div className="bg-[#1b2029] p-3 rounded-2xl border border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[11px] text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🍟🥤 Que tal acompanhar com?</span>
                    </span>
                    <span className="text-[10px] text-gray-500 font-semibold">+ Vendidos</span>
                  </div>
                  <div className="space-y-2">
                    {products
                      .filter((p) => {
                        const catName = categories.find((c) => c.id === p.categoryId)?.name?.toLowerCase() || "";
                        return (catName.includes("bebida") || catName.includes("porç") || p.name.toLowerCase().includes("batata") || p.name.toLowerCase().includes("coca")) && !cart[p.id];
                      })
                      .slice(0, 3)
                      .map((sug) => (
                        <div key={sug.id} className="flex items-center justify-between bg-[#141820] p-2 rounded-xl border border-gray-800/80">
                          <div className="flex items-center gap-2">
                            {sug.imageUrl ? (
                              <img src={sug.imageUrl} alt={sug.name} className="w-8 h-8 rounded-lg object-cover bg-gray-800" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-red-950/40 text-red-400 flex items-center justify-center text-xs">
                                🥤
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-gray-200 text-xs">{sug.name}</div>
                              <div className="text-[10px] text-red-400 font-black">{formatCurrency(sug.price)}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCart((prev) => ({
                                ...prev,
                                [sug.id]: {
                                  item: sug,
                                  qty: (prev[sug.id]?.qty || 0) + 1,
                                  notes: "",
                                },
                              }));
                            }}
                            className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 rounded-lg text-[10px] font-black active:scale-95 transition-all"
                          >
                            + Adicionar
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Formulário de Envio */}
              <form onSubmit={handleSendOrder} className="space-y-3 pt-2 border-t border-gray-800">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType("RETIRADA")}
                    className={`flex-1 py-2 font-black rounded-xl border transition-all ${
                      orderType === "RETIRADA"
                        ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-950"
                        : "bg-[#1b2029] text-gray-400 border-gray-800 hover:text-white"
                    }`}
                  >
                    Retirar no Balcão
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType("DELIVERY")}
                    className={`flex-1 py-2 font-black rounded-xl border transition-all ${
                      orderType === "DELIVERY"
                        ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-950"
                        : "bg-[#1b2029] text-gray-400 border-gray-800 hover:text-white"
                    }`}
                  >
                    Entrega em Casa
                  </button>
                </div>

                <div>
                  <label className="font-bold text-gray-300">Seu Nome</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Silva"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-[#1b2029] border border-gray-800 rounded-xl focus:outline-none focus:border-red-500 text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-300">Seu WhatsApp</label>
                  <input
                    type="tel"
                    required
                    placeholder="(85) 99999-9999"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-[#1b2029] border border-gray-800 rounded-xl focus:outline-none focus:border-red-500 text-white font-semibold"
                  />
                </div>

                {orderType === "DELIVERY" && (
                  <>
                    <div>
                      <div className="flex justify-between items-center">
                        <label className="font-bold text-gray-300">Seu Bairro (Taxa de Entrega)</label>
                        <span className="text-[11px] font-bold text-emerald-400">⏱️ Entrega em 35-50 min</span>
                      </div>
                      <select
                        onChange={(e) => {
                          const z = zones.find((item) => item.id === e.target.value);
                          if (z) setSelectedZone(z);
                        }}
                        className="w-full mt-1 px-3 py-2 bg-[#1b2029] border border-gray-800 rounded-xl focus:outline-none focus:border-red-500 text-white font-semibold"
                      >
                        {zones.map((z) => (
                          <option key={z.id} value={z.id} className="bg-[#141820] text-white">
                            {z.neighborhood} - {formatCurrency(z.fee)} (Estimativa: ~40min)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-gray-300">Endereço Completo</label>
                      <input
                        type="text"
                        required
                        placeholder="Rua, número, complemento e ponto de referência"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-[#1b2029] border border-gray-800 rounded-xl focus:outline-none focus:border-red-500 text-white"
                      />
                    </div>
                  </>
                )}

                {/* Forma de Pagamento */}
                <div>
                  <label className="font-bold text-gray-300">Forma de Pagamento</label>
                  <div className="grid grid-cols-4 gap-1.5 mt-1">
                    {(["PIX", "DINHEIRO", "DEBITO", "CREDITO"] as const).map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setPaymentMethod(m)}
                        className={`py-2 text-[11px] font-bold rounded-lg border transition-all ${
                          paymentMethod === m
                            ? "bg-red-600 text-white border-red-600 shadow-sm"
                            : "bg-[#1b2029] text-gray-400 border-gray-800 hover:text-white"
                        }`}
                      >
                        {m === "DINHEIRO" ? "Dinheiro" : m}
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === "DINHEIRO" && (
                  <div>
                    <label className="font-bold text-gray-300">Troco para quanto?</label>
                    <input
                      type="text"
                      placeholder="Ex: 50,00"
                      value={changeFor}
                      onChange={(e) => setChangeFor(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-[#1b2029] border border-gray-800 rounded-xl focus:outline-none focus:border-red-500 text-white"
                    />
                  </div>
                )}

                {/* Campo de Cupom de Desconto */}
                <div className="pt-2 border-t border-gray-800 space-y-1.5">
                  <label className="font-bold text-gray-300 block text-xs">Tem um Cupom de Desconto?</label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl">
                      <div>
                        <div className="font-black text-emerald-400 text-xs tracking-wider">
                          ✓ {appliedCoupon.code}
                        </div>
                        <div className="text-[11px] text-gray-400">{appliedCoupon.description}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponCode("");
                        }}
                        className="text-[11px] text-red-400 hover:text-red-300 font-bold px-2 py-1"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Ex: PRIMEIRACOMPRA ou CENTRAL5"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 px-3 py-2 bg-[#1b2029] border border-gray-800 rounded-xl focus:outline-none focus:border-red-500 text-white uppercase font-bold text-xs"
                      />
                      <button
                        type="button"
                        onClick={applyCoupon}
                        className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl text-xs active:scale-95 transition-all"
                      >
                        Aplicar
                      </button>
                    </div>
                  )}
                  {couponError && <p className="text-[11px] text-red-400 font-semibold">{couponError}</p>}
                </div>

                <div className="pt-2 border-t border-gray-800 space-y-1">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Desconto ({appliedCoupon?.code}):</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  {orderType === "DELIVERY" && (
                    <div className="flex justify-between text-gray-400">
                      <span>Taxa de entrega:</span>
                      <span>{formatCurrency(deliveryFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-white pt-1">
                    <span>Total do Pedido:</span>
                    <span className="text-red-500">{formatCurrency(total)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-sm active:scale-[0.98] transition-all shadow-lg shadow-red-950 disabled:opacity-50"
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
