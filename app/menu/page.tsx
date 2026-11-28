"use client";

import { useEffect, useState, useMemo } from "react";
import { formatCurrency, createWhatsAppLink } from "@/lib/utils";
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
  Search,
  Clock,
  Phone,
  ChevronRight,
  Flame,
  Bike,
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
  const [setting, setSetting] = useState<any>(null);
  const [selectedCat, setSelectedCat] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Carrinho
  const [cart, setCart] = useState<{ [id: string]: { item: MenuItem; qty: number; notes: string } }>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // Modal de Personalização do Produto
  const [customizingProduct, setCustomizingProduct] = useState<MenuItem | null>(null);
  const [customNotes, setCustomNotes] = useState("");
  const [selectedAddons, setSelectedAddons] = useState<MenuItem[]>([]);
  const [itemQuantity, setItemQuantity] = useState(1);

  // Checkout
  const [orderType, setOrderType] = useState<"DELIVERY" | "RETIRADA" | "MESA">("DELIVERY");
  const [tableNumber, setTableNumber] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "DINHEIRO" | "DEBITO" | "CREDITO">("PIX");
  const [changeFor, setChangeFor] = useState("");
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
    if (mesa) {
      setOrderType("MESA");
      setTableNumber(mesa);
    }

    try {
      const savedName = localStorage.getItem("cl_customer_name");
      const savedPhone = localStorage.getItem("cl_customer_phone");
      const savedAddress = localStorage.getItem("cl_customer_address");
      if (savedName) setCustomerName(savedName);
      if (savedPhone) setCustomerPhone(savedPhone);
      if (savedAddress) setDeliveryAddress(savedAddress);
    } catch (e) { }

    fetch("/api/public/menu")
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories || []);
        setProducts(d.products || []);
        setSetting(d.setting);
        if (d.categories && d.categories.length > 0) {
          setSelectedCat(d.categories[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const addonsList = useMemo(() => {
    return products.filter(
      (p) =>
        categories.find((c) => c.id === p.categoryId)?.name === "Adicionais" ||
        p.name.startsWith("Adicional:")
    );
  }, [products, categories]);

  // Produtos sugeridos para Upsell (Batatas e Bebidas)
  const upsellProducts = useMemo(() => {
    return products.filter((p) => {
      const name = p.name.toLowerCase();
      const cat = categories.find((c) => c.id === p.categoryId)?.name?.toLowerCase() || "";
      const isSideOrDrink =
        name.includes("batata") ||
        name.includes("coca") ||
        name.includes("guaraná") ||
        name.includes("suco") ||
        cat.includes("bebida") ||
        cat.includes("porç");
      return isSideOrDrink;
    }).slice(0, 4);
  }, [products, categories]);

  function showToast(msg: string) {
    setAddedToast(msg);
    setTimeout(() => setAddedToast(null), 2200);
  }

  function openCustomizeModal(p: MenuItem) {
    setCustomizingProduct(p);
    setCustomNotes("");
    setSelectedAddons([]);
    setItemQuantity(1);
  }

  function toggleAddon(addon: MenuItem) {
    if (selectedAddons.find((a) => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  }

  function toggleQuickTag(tag: string) {
    if (customNotes.includes(tag)) {
      setCustomNotes(
        customNotes
          .replace(tag, "")
          .replace(/,\s*,/, ",")
          .replace(/^,\s*/, "")
          .replace(/,\s*$/, "")
          .trim()
      );
    } else {
      setCustomNotes(customNotes ? `${customNotes}, ${tag}` : tag);
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
          qty: existing ? existing.qty + itemQuantity : itemQuantity,
          notes: fullNotes,
        },
      };
    });

    showToast(`${customizingProduct.name} adicionado à sacola!`);
    setCustomizingProduct(null);
  }

  function quickAdd(p: MenuItem) {
    const isLanche = categories.find((c) => c.id === p.categoryId)?.name?.toLowerCase().includes("lanche");
    if (isLanche) {
      openCustomizeModal(p);
      return;
    }

    const cartKey = `${p.id}-padrao`;
    setCart((prev) => {
      const existing = prev[cartKey];
      return {
        ...prev,
        [cartKey]: {
          item: p,
          qty: existing ? existing.qty + 1 : 1,
          notes: "",
        },
      };
    });
    showToast(`${p.name} adicionado!`);
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
  const totalItemsCount = cartList.reduce((acc, c) => acc + c.qty, 0);
  const subtotal = cartList.reduce((acc, c) => acc + c.item.price * c.qty, 0);
  const deliveryFee = orderType === "DELIVERY" ? (setting?.deliveryFee ?? 500) : 0;
  const discountAmount = appliedCoupon ? Math.min(subtotal, appliedCoupon.discountCents) : 0;
  const total = Math.max(0, subtotal - discountAmount + deliveryFee);

  function applyCoupon() {
    setCouponError("");
    const clean = couponCode.trim().toUpperCase();
    if (!clean) return;

    if (clean === "PRIMEIRACOMPRA" || clean === "BEMVINDO") {
      setAppliedCoupon({
        code: clean,
        discountCents: 500,
        description: "R$ 5,00 OFF de Boas-Vindas",
      });
    } else if (clean === "LANCHE10" || clean === "DESCONTO10") {
      setAppliedCoupon({
        code: clean,
        discountCents: 1000,
        description: "R$ 10,00 OFF no pedido",
      });
    } else if (clean === "FRETEGRATIS") {
      setAppliedCoupon({
        code: clean,
        discountCents: deliveryFee,
        description: "Frete Grátis ativado",
      });
    } else {
      setCouponError("Cupom inválido ou expirado.");
    }
  }

  async function handleSubmitOrder(e: React.FormEvent) {
    e.preventDefault();
    if (cartList.length === 0) return alert("Sua sacola está vazia.");
    if (!customerName.trim() || !customerPhone.trim()) {
      return alert("Por favor, preencha seu nome e WhatsApp.");
    }
    if (orderType === "DELIVERY" && !deliveryAddress.trim()) {
      return alert("Por favor, informe seu endereço completo para entrega.");
    }

    try {
      localStorage.setItem("cl_customer_name", customerName);
      localStorage.setItem("cl_customer_phone", customerPhone);
      if (deliveryAddress) localStorage.setItem("cl_customer_address", deliveryAddress);
    } catch (e) { }

    setSubmitting(true);
    try {
      const itemsPayload = cartList.map((c) => ({
        productId: c.item.id,
        productName: c.item.name,
        unitPrice: c.item.price,
        quantity: c.qty,
        notes: c.notes || undefined,
      }));

      const payload = {
        type: orderType,
        tableNumber: orderType === "MESA" && tableNumber ? Number(tableNumber) : undefined,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress: orderType === "DELIVERY" ? deliveryAddress.trim() : undefined,
        deliveryFee,
        discount: discountAmount,
        paymentMethod,
        amountReceived:
          paymentMethod === "DINHEIRO" && changeFor ? Math.round(parseFloat(changeFor.replace(",", ".")) * 100) : undefined,
        items: itemsPayload,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Erro ao registrar pedido.");

      setFinishedOrder(d.order);
      setCart({});
      setCartOpen(false);

      if (customerPhone) {
        const orderUrl = `${window.location.origin}/pedido/${d.order.code}`;
        const itemsList = cartList
          .map((c) => `• ${c.qty}x ${c.item.name}${c.notes ? ` (${c.notes})` : ""}`)
          .join("\n");
        const waMsg = `Olá, ${customerName}! 🍔\nSeu pedido *#${d.order.code}* na *Central Lanches* foi recebido com sucesso!\n\n*Resumo:*\n${itemsList}\n\n*Total:* ${formatCurrency(d.order.total)}\n*Pagamento:* ${paymentMethod}\n\nAcompanhe o status ao vivo aqui:\n${orderUrl}`;
        const waLink = createWhatsAppLink(customerPhone, waMsg);

        setTimeout(() => {
          window.open(waLink, "_blank");
        }, 1200);
      }

      if (paymentMethod === "PIX" && setting?.pixKey) {
        const pixCode = generatePixPayload({
          pixKey: setting.pixKey,
          merchantName: setting.restaurantName || "Central Lanches",
          merchantCity: "Fortaleza",
          amountCents: d.order.total,
          txId: d.order.code,
        });
        setPixPayload(pixCode);
        const qrUrl = await QRCode.toDataURL(pixCode, { width: 280, margin: 1 });
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

  // TELA DE SUCESSO DARK
  if (finishedOrder) {
    return (
      <div className="min-h-screen bg-[#0c0d0e] text-zinc-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#16181a] rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-2xl border border-zinc-800">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl font-black">
            ✓
          </div>

          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Pedido Confirmado
            </span>
            <h2 className="text-2xl font-black text-white mt-3 leading-tight">
              Pedido #{finishedOrder.code} Recebido!
            </h2>
            <p className="text-xs text-zinc-400 mt-1.5">
              Nossa cozinha já foi notificada e seu pedido está sendo preparado na chapa.
            </p>
          </div>

          {paymentMethod === "PIX" && pixQrImage && (
            <div className="p-5 bg-[#1f2226] rounded-2xl border border-zinc-700/80 text-center space-y-3">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center justify-center gap-1.5">
                <QrCode size={16} className="text-red-500" />
                Pagar com Pix
              </span>
              <div className="bg-white p-3 rounded-2xl inline-block shadow-md">
                <img src={pixQrImage} alt="QR Code Pix" className="w-48 h-48 rounded-xl" />
              </div>
              <div className="font-black text-white text-base">
                Total: {formatCurrency(finishedOrder.total)}
              </div>
              <button
                onClick={copyPix}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-red-600/30"
              >
                {copiedPix ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedPix ? "Código Pix Copiado!" : "Copiar Chave Pix Copia e Cola"}</span>
              </button>
            </div>
          )}

          <div className="p-4 bg-[#1f2226] rounded-2xl border border-zinc-800 flex items-center justify-between text-left">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Status</span>
              <div className="text-sm font-black text-white">Em Preparo na Chapa 🍔</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Total</span>
              <div className="text-base font-black text-red-500">{formatCurrency(finishedOrder.total)}</div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <a
              href={`/pedido/${encodeURIComponent(finishedOrder.code)}`}
              className="block w-full py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs rounded-xl active:scale-95 transition-all border border-zinc-700"
            >
              Acompanhar Pedido ao Vivo
            </a>
            <button
              onClick={() => {
                setFinishedOrder(null);
                window.location.reload();
              }}
              className="block w-full py-3 text-xs font-bold text-zinc-400 hover:text-white"
            >
              Voltar ao Cardápio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtragem
  const filteredProducts = products.filter((p) => {
    const matchesCat = search ? true : (!selectedCat || p.categoryId === selectedCat);
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0d0e10] text-zinc-100 font-sans pb-28 selection:bg-red-600 selection:text-white">
      {/* Toast Feedback */}
      {addedToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-800 text-white text-xs font-bold py-2.5 px-4 rounded-full shadow-2xl flex items-center gap-2 border border-zinc-700 animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{addedToast}</span>
        </div>
      )}

      {/* HEADER DARK PREMIUM & CLEAN */}
      <header className="bg-[#141619] border-b border-zinc-800/80 sticky top-0 z-30 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            {/* Estabelecimento */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-black text-base shadow-lg shadow-red-600/20 flex-shrink-0">
                CL
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-black text-base md:text-lg text-white tracking-tight leading-none">
                    {setting?.restaurantName || "Central Lanches"}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Aberto
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="text-zinc-500" />
                    30-45 min
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Bike size={12} className="text-zinc-500" />
                    Entrega {formatCurrency(setting?.deliveryFee ?? 500)}
                  </span>
                </div>
              </div>
            </div>

            {/* Sacola Topo */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 text-white transition-all active:scale-95 flex items-center gap-2 border border-zinc-700/80"
              title="Abrir Sacola"
            >
              <ShoppingBag size={20} />
              {totalItemsCount > 0 && (
                <span className="w-5 h-5 bg-red-600 text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-md shadow-red-600/40">
                  {totalItemsCount}
                </span>
              )}
            </button>
          </div>

          {/* Campo de Busca Dark */}
          <div className="mt-3 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar lanche, porção, bebida..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-[#1b1e22] text-white rounded-xl text-xs font-semibold placeholder:text-zinc-500 focus:outline-none focus:bg-[#202428] focus:ring-1 focus:ring-red-500/40 border border-zinc-800 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* NAVEGAÇÃO DE CATEGORIAS FIXA DARK */}
        {!search && (
          <div className="border-t border-zinc-800/80 bg-[#141619]">
            <div className="max-w-4xl mx-auto px-4 flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar">
              {categories.map((c) => {
                const isActive = selectedCat === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCat(c.id);
                      const el = document.getElementById(`cat-${c.id}`);
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${isActive
                        ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                        : "bg-[#1b1e22] text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800"
                      }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* LISTAGEM DE PRODUTOS DIRETA NO MODO DARK */}
      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-6">
        {loading ? (
          <div className="py-20 text-center text-xs text-zinc-500 font-bold">
            Carregando o cardápio...
          </div>
        ) : (
          (search
            ? [{ id: "search", name: `Resultados para "${search}"` }]
            : categories
          ).map((cat) => {
            const catProducts = filteredProducts.filter((p) =>
              search ? true : p.categoryId === cat.id
            );
            if (catProducts.length === 0) return null;

            return (
              <section key={cat.id} id={`cat-${cat.id}`} className="space-y-3">
                <div className="flex items-center justify-between pt-2">
                  <h2 className="text-base font-black text-white tracking-tight">
                    {cat.name}
                  </h2>
                  <span className="text-[11px] text-zinc-500 font-bold">
                    {catProducts.length} {catProducts.length === 1 ? "item" : "itens"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {catProducts.map((p) => {
                    const isLanche = categories.find((c) => c.id === p.categoryId)?.name?.toLowerCase().includes("lanche");

                    return (
                      <div
                        key={p.id}
                        onClick={() => (isLanche ? openCustomizeModal(p) : quickAdd(p))}
                        className="bg-[#141619] rounded-2xl p-3.5 border border-zinc-800/80 hover:border-zinc-700 shadow-sm transition-all cursor-pointer flex gap-3.5 items-center justify-between group active:scale-[0.99]"
                      >
                        <div className="flex-1 min-w-0 pr-1 space-y-1">
                          <h3 className="font-extrabold text-sm text-white group-hover:text-red-400 transition-colors line-clamp-1 leading-snug">
                            {p.name}
                          </h3>
                          <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                            {p.description || "Ingredientes selecionados e receita exclusiva da Central Lanches."}
                          </p>
                          <div className="pt-1 flex items-center justify-between">
                            <span className="font-black text-white text-sm">
                              {formatCurrency(p.price)}
                            </span>
                          </div>
                        </div>

                        {/* Imagem do Produto com Dimensão Fixa Rígida */}
                        <div
                          className="relative rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800 border border-zinc-800"
                          style={{ width: "90px", height: "90px", minWidth: "90px", minHeight: "90px" }}
                        >
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              style={{ width: "90px", height: "90px" }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl bg-red-950/40 text-red-500 font-black">
                              🍔
                            </div>
                          )}
                          <div className="absolute bottom-1 right-1 w-6 h-6 rounded-lg bg-zinc-900/90 border border-zinc-700 shadow-md flex items-center justify-center text-white group-hover:bg-red-600 transition-colors">
                            <Plus size={14} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}

        {filteredProducts.length === 0 && !loading && (
          <div className="py-20 text-center space-y-2">
            <span className="text-3xl block">🔍</span>
            <p className="text-sm font-bold text-zinc-300">Nenhum lanche encontrado</p>
            <p className="text-xs text-zinc-500">Tente buscar por outro nome ou limpe o campo de busca.</p>
          </div>
        )}
      </main>

      {/* BARRA FIXA INFERIOR DA SACOLA */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom duration-200">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full py-3.5 px-5 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-2xl shadow-2xl shadow-red-600/40 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-white/20 text-white text-xs font-black flex items-center justify-center">
                {totalItemsCount}
              </span>
              <span className="text-xs font-black uppercase tracking-wider">Ver Minha Sacola</span>
            </div>
            <div className="flex items-center gap-1 font-black text-sm">
              <span>{formatCurrency(subtotal)}</span>
              <ChevronRight size={16} />
            </div>
          </button>
        </div>
      )}

      {/* MODAL DARK DE PERSONALIZAÇÃO DO LANCHE */}
      {customizingProduct && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex flex-col justify-end md:justify-center p-0 md:p-4 animate-in fade-in duration-150">
          <div className="bg-[#141619] text-zinc-100 rounded-t-3xl md:rounded-3xl max-w-md w-full mx-auto max-h-[85vh] flex flex-col shadow-2xl border border-zinc-800 overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Topo do Modal */}
            <div className="p-4 border-b border-zinc-800 flex items-start justify-between">
              <div>
                <h3 className="font-black text-base text-white leading-tight">
                  {customizingProduct.name}
                </h3>
                <span className="text-xs font-black text-red-500">
                  {formatCurrency(customizingProduct.price)}
                </span>
              </div>
              <button
                onClick={() => setCustomizingProduct(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="p-4 overflow-y-auto space-y-5 text-xs">
              {customizingProduct.imageUrl && (
                <div className="w-full h-36 rounded-2xl overflow-hidden bg-zinc-800 border border-zinc-800">
                  <img
                    src={customizingProduct.imageUrl}
                    alt={customizingProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Ingredientes a Remover */}
              <div className="space-y-2">
                <span className="font-extrabold text-zinc-200 block text-xs">
                  Deseja retirar algo? (Opcional)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {["Sem Cebola", "Sem Maionese", "Sem Salada", "Sem Tomate", "Sem Milho"].map((tag) => {
                    const active = customNotes.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleQuickTag(tag)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${active
                            ? "bg-red-600 text-white shadow-xs"
                            : "bg-[#1b1e22] text-zinc-400 hover:bg-zinc-800 border border-zinc-800"
                          }`}
                      >
                        {active ? `✕ ${tag}` : tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Adicionais Pagos */}
              {addonsList.length > 0 && (
                <div className="space-y-2">
                  <span className="font-extrabold text-zinc-200 block text-xs">
                    Adicionais no lanche:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {addonsList.map((addon) => {
                      const selected = selectedAddons.some((a) => a.id === addon.id);
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => toggleAddon(addon)}
                          className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${selected
                              ? "bg-red-950/40 border-red-500 text-white font-bold"
                              : "bg-[#1b1e22] border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                            }`}
                        >
                          <span className="text-xs truncate">
                            {selected ? "✓ " : "+ "}
                            {addon.name.replace("Adicional: ", "")}
                          </span>
                          <span className="text-[11px] font-black text-emerald-400 mt-1">
                            +{formatCurrency(addon.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Observação Livre */}
              <div className="space-y-1.5">
                <span className="font-extrabold text-zinc-200 block text-xs">
                  Alguma outra observação?
                </span>
                <input
                  type="text"
                  placeholder="Ex: carne bem passada, caprichar no molho..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-[#1b1e22] border border-zinc-800 text-white rounded-xl focus:border-red-500 focus:outline-none placeholder:text-zinc-500"
                />
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 border-t border-zinc-800 bg-[#16181b] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 bg-[#1b1e22] border border-zinc-800 rounded-xl p-1">
                <button
                  onClick={() => setItemQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white rounded-lg"
                >
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-xs font-black text-white">{itemQuantity}</span>
                <button
                  onClick={() => setItemQuantity((q) => q + 1)}
                  className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white rounded-lg"
                >
                  <Plus size={14} />
                </button>
              </div>

              <button
                type="button"
                onClick={confirmCustomizedItem}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-xs rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-between"
              >
                <span>Adicionar</span>
                <span>
                  {formatCurrency(
                    (customizingProduct.price +
                      selectedAddons.reduce((sum, a) => sum + a.price, 0)) *
                    itemQuantity
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL / DRAWER DA SACOLA E CHECKOUT DARK */}
      {cartOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex justify-end animate-in fade-in duration-150">
          <div className="bg-[#141619] text-zinc-100 w-full max-w-md h-full flex flex-col shadow-2xl border-l border-zinc-800 animate-in slide-in-from-right duration-200">
            {/* Topo da Sacola */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-red-500" />
                <h3 className="font-black text-base text-white">Sua Sacola</h3>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Itens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cartList.length === 0 ? (
                <div className="py-20 text-center text-zinc-500 text-xs">
                  Sua sacola está vazia. Adicione lanches deliciosos!
                </div>
              ) : (
                cartList.map((item) => {
                  const key = `${item.item.id}-${item.notes || "padrao"}`;
                  return (
                    <div
                      key={key}
                      className="p-3 bg-[#1b1e22] rounded-2xl border border-zinc-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-xs text-white truncate">
                          {item.item.name}
                        </h4>
                        {item.notes && (
                          <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                            {item.notes}
                          </p>
                        )}
                        <span className="font-black text-xs text-white mt-1 block">
                          {formatCurrency(item.item.price * item.qty)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-[#141619] border border-zinc-700/80 rounded-xl p-1">
                        <button
                          onClick={() => updateQty(key, -1)}
                          className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white rounded"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-5 text-center text-xs font-black text-white">{item.qty}</span>
                        <button
                          onClick={() => updateQty(key, 1)}
                          className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white rounded"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Sugestões de Acompanhamento (Upsell) */}
              {cartList.length > 0 && upsellProducts.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] font-black text-zinc-400 uppercase tracking-wide mb-2 flex items-center justify-between">
                    <span>🍟 Que tal acompanhar?</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {upsellProducts.map((p) => {
                      const alreadyInCart = cartList.some((c) => c.item.id === p.id);
                      return (
                        <div
                          key={p.id}
                          className="p-2 rounded-xl bg-[#1a1c20] border border-zinc-800/80 flex items-center justify-between gap-1.5"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">{p.name}</div>
                            <div className="text-[11px] font-black text-red-500">{formatCurrency(p.price)}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => quickAdd(p)}
                            className="p-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black text-xs shrink-0 active:scale-95 transition-all shadow-xs"
                            title="Adicionar ao pedido"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cupom de Desconto */}
              {cartList.length > 0 && (
                <div className="pt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Código do cupom..."
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 bg-[#1b1e22] border border-zinc-800 text-white rounded-xl text-xs font-bold uppercase focus:outline-none focus:border-red-500 placeholder:text-zinc-500"
                    />
                    <button
                      onClick={applyCoupon}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-black active:scale-95 transition-all border border-zinc-700"
                    >
                      Aplicar
                    </button>
                  </div>
                  {appliedCoupon && (
                    <div className="text-[11px] font-bold text-emerald-400 mt-1">
                      ✓ {appliedCoupon.description}
                    </div>
                  )}
                  {couponError && (
                    <div className="text-[11px] font-bold text-red-500 mt-1">
                      ✕ {couponError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Formulário de Envio */}
            {cartList.length > 0 && (
              <form onSubmit={handleSubmitOrder} className="p-4 border-t border-zinc-800 bg-[#16181b] space-y-3">
                {/* Tipo de Pedido */}
                <div className="grid grid-cols-3 gap-1.5 bg-[#1b1e22] p-1 rounded-xl text-xs border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setOrderType("DELIVERY")}
                    className={`py-1.5 rounded-lg font-black transition-all ${orderType === "DELIVERY"
                        ? "bg-red-600 text-white shadow-xs"
                        : "text-zinc-400 hover:text-white"
                      }`}
                  >
                    Entrega
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType("RETIRADA")}
                    className={`py-1.5 rounded-lg font-black transition-all ${orderType === "RETIRADA"
                        ? "bg-red-600 text-white shadow-xs"
                        : "text-zinc-400 hover:text-white"
                      }`}
                  >
                    Retirada
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType("MESA")}
                    className={`py-1.5 rounded-lg font-black transition-all ${orderType === "MESA"
                        ? "bg-red-600 text-white shadow-xs"
                        : "text-zinc-400 hover:text-white"
                      }`}
                  >
                    Mesa
                  </button>
                </div>

                {/* Campos */}
                <div className="space-y-1.5">
                  <input
                    type="text"
                    required
                    placeholder="Seu Nome completo"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-[#1b1e22] border border-zinc-800 text-white rounded-xl focus:border-red-500 focus:outline-none placeholder:text-zinc-500"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="WhatsApp com DDD"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-[#1b1e22] border border-zinc-800 text-white rounded-xl focus:border-red-500 focus:outline-none placeholder:text-zinc-500"
                  />
                  {orderType === "DELIVERY" && (
                    <input
                      type="text"
                      required
                      placeholder="Endereço (Rua, Número, Bairro)"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-[#1b1e22] border border-zinc-800 text-white rounded-xl focus:border-red-500 focus:outline-none placeholder:text-zinc-500"
                    />
                  )}
                  {orderType === "MESA" && (
                    <input
                      type="number"
                      required
                      placeholder="Número da Mesa"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-[#1b1e22] border border-zinc-800 text-white rounded-xl focus:border-red-500 focus:outline-none placeholder:text-zinc-500"
                    />
                  )}
                </div>

                {/* Pagamento */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">
                    Pagamento
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["PIX", "DINHEIRO", "DEBITO", "CREDITO"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-black border transition-all ${paymentMethod === m
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-[#1b1e22] text-zinc-400 border-zinc-800 hover:text-white"
                          }`}
                      >
                        {m === "DINHEIRO" ? "Dinheiro" : m === "DEBITO" ? "Débito" : m === "CREDITO" ? "Crédito" : "Pix"}
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === "DINHEIRO" && (
                  <input
                    type="text"
                    placeholder="Troco para quanto? (Ex: 50,00)"
                    value={changeFor}
                    onChange={(e) => setChangeFor(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-[#1b1e22] border border-zinc-800 text-white rounded-xl focus:border-red-500 focus:outline-none placeholder:text-zinc-500"
                  />
                )}

                {/* Totais */}
                <div className="pt-2 border-t border-zinc-800 space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {orderType === "DELIVERY" && (
                    <div className="flex justify-between text-zinc-400">
                      <span>Taxa de Entrega:</span>
                      <span>{formatCurrency(deliveryFee)}</span>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Desconto:</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-white pt-1">
                    <span>Total:</span>
                    <span className="text-red-500">{formatCurrency(total)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-xs rounded-xl shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? "Confirmando pedido..." : "Confirmar e Enviar Pedido"}
                  <ChevronRight size={16} />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
