"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { formatCurrency, parseCurrencyToCents, createWhatsAppLink } from "@/lib/utils";
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
  ArrowRight,
  ShieldCheck,
  Truck,
  Leaf,
  Star,
  Clock,
  MapPin,
  Phone,
  ChevronRight,
  Heart,
  Utensils,
  Percent,
  SlidersHorizontal,
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
  const [selectedCat, setSelectedCat] = useState("");
  const [search, setSearch] = useState("");

  // Carrinho com observações específicas
  const [cart, setCart] = useState<{ [id: string]: { item: MenuItem; qty: number; notes: string } }>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // Modal de personalização
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
  const [wantSache, setWantSache] = useState<boolean | null>(null);
  const [sacheModalOpen, setSacheModalOpen] = useState(false);
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

    try {
      const savedName = localStorage.getItem("cl_customer_name");
      const savedPhone = localStorage.getItem("cl_customer_phone");
      const savedAddress = localStorage.getItem("cl_customer_address");
      if (savedName) setCustomerName(savedName);
      if (savedPhone) setCustomerPhone(savedPhone);
      if (savedAddress) setDeliveryAddress(savedAddress);
    } catch (e) {}

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

  const addonsList = useMemo(() => {
    return products.filter(
      (p) =>
        categories.find((c) => c.id === p.categoryId)?.name === "Adicionais" ||
        p.name.startsWith("Adicional:")
    );
  }, [products, categories]);

  // 4 Destaques principais idênticos ao layout da foto de referência (Pizza/Burger/Fritas/Bebida)
  const popularSpecials = useMemo(() => {
    if (products.length === 0) return [];
    
    // Procura por produtos emblemáticos ou seleciona os primeiros das categorias chave
    const burger = products.find((p) => p.name.toLowerCase().includes("bacon") || p.name.toLowerCase().includes("moda")) || products[0];
    const secondBurger = products.find((p) => p.id !== burger?.id && (p.name.toLowerCase().includes("salada") || p.name.toLowerCase().includes("california") || p.name.toLowerCase().includes("cheddar"))) || products[1];
    const porcao = products.find((p) => p.name.toLowerCase().includes("batata") || p.name.toLowerCase().includes("frita")) || products[2];
    const comboOrBarca = products.find((p) => p.name.toLowerCase().includes("barca") || p.name.toLowerCase().includes("combo") || p.name.toLowerCase().includes("refrigerante")) || products[3];

    return [
      {
        item: burger,
        tag: "Popular",
        tagColor: "bg-[#e8192c]",
        defaultImg: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
      },
      {
        item: secondBurger,
        tag: "Mais Vendido",
        tagColor: "bg-[#f59e0b] text-gray-950",
        defaultImg: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&auto=format&fit=crop&q=80",
      },
      {
        item: porcao,
        tag: "Crocante",
        tagColor: "bg-[#f59e0b] text-gray-950",
        defaultImg: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop&q=80",
      },
      {
        item: comboOrBarca,
        tag: "Especial",
        tagColor: "bg-[#10b981]",
        defaultImg: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80",
      },
    ].filter((s) => s.item != null);
  }, [products]);

  function showToast(msg: string) {
    setAddedToast(msg);
    setTimeout(() => setAddedToast(null), 2500);
  }

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
      setCustomNotes(customNotes.replace(text, "").replace(/,\s*,/, ",").trim());
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

    showToast(`"${customizingProduct.name}" adicionado à sacola!`);
    setCustomizingProduct(null);
  }

  function quickAddToCart(product: MenuItem) {
    const isLanche = categories.find((c) => c.id === product.categoryId)?.name?.toLowerCase().includes("lanche");
    if (isLanche) {
      openCustomizeModal(product);
      return;
    }

    const cartKey = `${product.id}-padrao`;
    setCart((prev) => {
      const existing = prev[cartKey];
      return {
        ...prev,
        [cartKey]: {
          item: product,
          qty: existing ? existing.qty + 1 : 1,
          notes: "",
        },
      };
    });
    showToast(`"${product.name}" adicionado!`);
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

    if (clean === "PRIMEIRACOMPRA" || clean === "PRIMEIRO10") {
      setAppliedCoupon({
        code: clean,
        discountCents: 1000,
        description: "R$ 10,00 OFF na Primeira Compra",
      });
    } else if (clean === "CENTRAL5" || clean === "LANCHE5") {
      setAppliedCoupon({
        code: clean,
        discountCents: 500,
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

  function handlePreSubmitOrder(e: React.FormEvent) {
    e.preventDefault();
    if (cartList.length === 0) return alert("Adicione produtos à sacola.");
    if (!customerName || !customerPhone) return alert("Preencha seu nome e telefone WhatsApp.");
    if (orderType === "DELIVERY" && !deliveryAddress) return alert("Informe seu endereço completo.");

    if (wantSache === null) {
      setSacheModalOpen(true);
      return;
    }

    executeOrderSubmission(wantSache);
  }

  async function executeOrderSubmission(withSache: boolean) {
    setSubmitting(true);
    setSacheModalOpen(false);
    try {
      const params = new URLSearchParams(window.location.search);
      const tableNum = params.get("mesa") ? parseInt(params.get("mesa")!, 10) : undefined;
      const sacheNote = withSache ? "COM KIT SACHÊ (Maionese/Ketchup/Mostarda)" : "SEM KIT SACHÊ";

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
          notes: sacheNote,
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
      setCartOpen(false);

      try {
        if (customerName) localStorage.setItem("cl_customer_name", customerName);
        if (customerPhone) localStorage.setItem("cl_customer_phone", customerPhone);
        if (deliveryAddress) localStorage.setItem("cl_customer_address", deliveryAddress);
      } catch (e) {}

      if (customerPhone) {
        const orderUrl = `${window.location.origin}/pedido/${encodeURIComponent(d.order.code)}`;
        const itemsList = cartList
          .map((c) => `• ${c.qty}x ${c.item.name}${c.notes ? ` (${c.notes})` : ""}`)
          .join("\n");
        const waMsg = `Olá, ${customerName}! 🍔\nSeu pedido *#${d.order.code}* na *Central Lanches* foi confirmado com sucesso!\n\n*Resumo do Pedido:*\n${itemsList}\n*Sachês:* ${withSache ? "Sim, enviar sachês" : "Não enviar sachês"}\n\n*Total:* ${formatCurrency(d.order.total)}\n*Pagamento:* ${paymentMethod}\n\nAcompanhe o preparo em tempo real aqui:\n${orderUrl}\n\nAgradecemos a sua preferência!`;
        const waLink = createWhatsAppLink(customerPhone, waMsg);

        setTimeout(() => {
          window.open(waLink, "_blank");
        }, 1200);
      }

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

  // Tela de Sucesso do Pedido
  if (finishedOrder) {
    return (
      <div className="min-h-screen bg-[#0e0c0b] text-gray-100 flex items-center justify-center p-4">
        <div className="bg-[#171412] rounded-3xl max-w-md w-full p-6 md:p-8 text-center space-y-5 shadow-2xl border border-amber-900/30">
          <div className="w-20 h-20 bg-amber-500/10 border-2 border-amber-500 text-amber-400 rounded-full flex items-center justify-center mx-auto text-3xl font-black shadow-lg shadow-amber-500/20">
            ✓
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 tracking-widest uppercase">Pedido Confirmado</span>
            <h2 className="text-2xl font-black text-white leading-tight mt-1">Já estamos preparando!</h2>
            <p className="text-xs text-gray-400 mt-1">
              A cozinha já recebeu seu pedido <b>#{finishedOrder.code}</b> e logo estará prontinho para você.
            </p>
          </div>

          {paymentMethod === "PIX" && pixQrImage && (
            <div className="p-5 bg-[#211b17] rounded-2xl border border-amber-500/30 text-center space-y-3.5 shadow-inner">
              <div className="flex items-center justify-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-wider">
                <QrCode size={18} />
                <span>Pague com Pix (Aprovação Instantânea)</span>
              </div>
              <div className="bg-white p-3 rounded-2xl inline-block shadow-md">
                <img src={pixQrImage} alt="QR Code Pix" className="w-44 h-44 rounded-xl" />
              </div>
              <div className="font-black text-amber-300 text-lg">
                Valor Total: {formatCurrency(finishedOrder.total)}
              </div>
              <button
                onClick={copyPix}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-gray-950 font-black text-xs rounded-full flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/30"
              >
                {copiedPix ? <Check size={18} /> : <Copy size={18} />}
                <span>{copiedPix ? "Código Pix Copiado com Sucesso!" : "Copiar Chave Pix Copia e Cola"}</span>
              </button>
            </div>
          )}

          <div className="p-4 bg-[#110f0e] rounded-2xl border border-amber-900/40 text-left flex items-center justify-between">
            <div>
              <div className="text-[11px] text-gray-400 font-medium">Código do Pedido</div>
              <div className="text-2xl font-black text-amber-400 tracking-tight">#{finishedOrder.code}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-gray-400 font-medium">Total</div>
              <div className="text-lg font-black text-white">{formatCurrency(finishedOrder.total)}</div>
            </div>
          </div>

          {finishedOrder.customerPhone && (
            <a
              href={createWhatsAppLink(
                finishedOrder.customerPhone,
                `Olá! Meu pedido #${finishedOrder.code} na Central Lanches está confirmado no valor de ${formatCurrency(finishedOrder.total)}. Acompanhe em tempo real: ${typeof window !== "undefined" ? window.location.origin : ""}/pedido/${finishedOrder.code}`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-black font-black text-xs rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-emerald-950"
            >
              <MessageCircle size={18} />
              <span>Receber Atualizações no WhatsApp</span>
            </a>
          )}

          <a
            href={`/pedido/${encodeURIComponent(finishedOrder.code)}`}
            className="block w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-sm rounded-full active:scale-95 transition-all shadow-lg shadow-amber-500/20"
          >
            Acompanhar Status em Tempo Real
          </a>
        </div>
      </div>
    );
  }

  const filteredProducts = products.filter((p) => {
    const matchesCat = search ? true : (!selectedCat || p.categoryId === selectedCat);
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="min-h-screen bg-[#fcfaf7] text-gray-900 selection:bg-amber-500 selection:text-white font-sans antialiased">
      {/* Toast Feedback flutuante */}
      {addedToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-950/95 text-white text-xs font-black py-2.5 px-5 rounded-full shadow-2xl flex items-center gap-2 border border-amber-500/40 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-250">
          <CheckCircle2 size={16} className="text-amber-400" />
          <span>{addedToast}</span>
        </div>
      )}

      {/* 1. Header / Navbar Idêntico ao Tasty Bites */}
      <header className="sticky top-0 z-40 bg-[#110e0c]/95 backdrop-blur-md border-b border-white/10 text-white transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Logo com ícone de chef */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection("hero")}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-gray-950 shadow-md shadow-amber-500/20">
              <Flame size={22} className="fill-current text-gray-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-white leading-tight">
                  {setting?.restaurantName || "Central Lanches"}
                </span>
              </div>
              <span className="text-[10px] font-extrabold text-amber-400/90 tracking-widest uppercase block">
                GOOD FOOD • HAPPY MOOD
              </span>
            </div>
          </div>

          {/* Links Centrais de Navegação */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-gray-300">
            <button onClick={() => scrollToSection("hero")} className="hover:text-amber-400 transition-colors">
              Início
            </button>
            <button onClick={() => scrollToSection("destaques")} className="hover:text-amber-400 transition-colors">
              Mais Pedidos
            </button>
            <button onClick={() => scrollToSection("cardapio")} className="hover:text-amber-400 transition-colors">
              Cardápio
            </button>
            <button onClick={() => scrollToSection("delivery-banner")} className="hover:text-amber-400 transition-colors">
              Delivery
            </button>
            <button onClick={() => scrollToSection("sobre")} className="hover:text-amber-400 transition-colors">
              Sobre Nós
            </button>
          </nav>

          {/* Lado Direito: Busca, Sacola e Botão "Order Now" */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => scrollToSection("cardapio")}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Buscar no cardápio"
            >
              <Search size={18} />
            </button>

            {/* Sacola com badge */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white transition-all flex items-center gap-2 active:scale-95 border border-white/10"
              title="Ver sacola"
            >
              <ShoppingBag size={18} />
              {totalItemsCount > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-gray-950 text-[11px] font-black rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {totalItemsCount}
                </span>
              ) : (
                <span className="hidden sm:inline text-[11px] text-gray-400 font-bold">0</span>
              )}
            </button>

            {/* Botão Order Now estilo pílula âmbar */}
            <button
              onClick={() => scrollToSection("cardapio")}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-gray-950 font-black text-xs rounded-full shadow-lg shadow-amber-500/25 flex items-center gap-1.5 transition-all"
            >
              <span>Order Now</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section Gourmet - Composição fiel à imagem de referência */}
      <section id="hero" className="relative bg-[#110e0c] text-white pt-10 pb-20 md:pt-16 md:pb-28 overflow-hidden">
        {/* Glows ambientais sutis */}
        <div className="absolute top-1/4 right-1/4 w-[32rem] h-[32rem] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Lado Esquerdo do Hero */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-black tracking-widest text-amber-400 uppercase">
              <span>FRESH</span>
              <span>•</span>
              <span>TASTY</span>
              <span>•</span>
              <span>DELICIOUS</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.06] text-white">
                Food
                <span className="block mt-1">
                  Made with{" "}
                  <span className="font-handwriting text-amber-400 font-bold inline-block text-5xl sm:text-6xl lg:text-7xl xl:text-8xl relative ml-1">
                    Love
                    {/* Desenho do coraçãozinho doodle como na referência */}
                    <span className="inline-block text-amber-400 text-3xl sm:text-4xl ml-2 align-middle select-none">
                      ♡
                    </span>
                  </span>
                </span>
              </h1>
            </div>

            <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              From cheesy pizzas to juicy burgers, we serve the best food made with fresh ingredients and a whole lot of love.
            </p>

            {/* Botão de Ação CTA */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => scrollToSection("cardapio")}
                className="w-full sm:w-auto px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-sm rounded-full shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <span>Order Now</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* 3 Selos de Valor (Ingredientes, Entrega, Higiene) */}
            <div className="pt-6 grid grid-cols-3 gap-3 border-t border-white/10 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <Leaf size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-200 leading-tight">Fresh Ingredients</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <Truck size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-200 leading-tight">Fast Delivery</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-200 leading-tight">Hygienic & Safe</div>
                </div>
              </div>
            </div>
          </div>

          {/* Lado Direito do Hero: Burger com tábua rústica e batatas */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            {/* Doodle "Best Burger in Town" idêntico à foto */}
            <div className="absolute -top-6 right-2 sm:right-6 z-20 hidden sm:flex flex-col items-center rotate-6 pointer-events-none select-none">
              <div className="text-amber-400 text-xs font-bold tracking-widest flex items-center gap-1">
                <span>\</span>
                <span className="font-handwriting text-xl text-amber-300">Best Burger</span>
                <span>/</span>
              </div>
              <div className="font-handwriting text-amber-300 text-lg font-bold -mt-1 flex items-center gap-1">
                <span>in Town</span>
                <span className="text-xl">⤴</span>
              </div>
            </div>

            {/* Imagem do Burger Gourmet em prato rústico */}
            <div className="relative w-full max-w-lg aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/10 group">
              <img
                src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1000&auto=format&fit=crop&q=80"
                alt="Signature Gourmet Burger Central Lanches"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6">
                <div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500 text-gray-950 inline-block mb-1">
                    Artesanal 160g
                  </span>
                  <div className="text-lg font-black text-white">Classic Cheeseburger & Crispy Fries</div>
                  <div className="text-xs text-amber-300 font-medium">Com molho da casa e pão brioche selado</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Curva Orgânica Inferior do Hero */}
        <div className="w-full overflow-hidden leading-none absolute bottom-0 left-0 right-0">
          <svg
            className="relative block w-full h-10 md:h-14 text-[#fcfaf7]"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M0,0 C200,80 400,-20 600,60 C800,140 1000,10 1200,50 L1200,120 L0,120 Z"></path>
          </svg>
        </div>
      </section>

      {/* 3. Seção "OUR SPECIALS — Popular Menu" (Idêntico ao Tasty Bites) */}
      <section id="destaques" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-amber-600 flex items-center gap-2 mb-1.5">
              <span>OUR SPECIALS</span>
              <span className="w-8 h-0.5 bg-amber-500 inline-block rounded-full" />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-950 tracking-tight">
              Popular Menu
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-lg">
              Explore our most loved dishes, crafted for your taste and happiness.
            </p>
          </div>

          <button
            onClick={() => scrollToSection("cardapio")}
            className="self-start sm:self-auto px-6 py-2.5 rounded-full border border-gray-300 hover:border-gray-900 text-gray-800 hover:text-gray-950 font-black text-xs flex items-center gap-2 transition-all hover:bg-white shadow-xs"
          >
            <span>View Full Menu</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Grid dos 4 Cards Populares Idênticos à Referência */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularSpecials.map((special, index) => {
            const p = special.item;
            const imgSrc = p.imageUrl || special.defaultImg;
            return (
              <div
                key={p.id}
                className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Foto com proporção e badge */}
                  <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-3.5">
                    <img
                      src={imgSrc}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span
                      className={`absolute top-3 left-3 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm ${special.tagColor}`}
                    >
                      {special.tag}
                    </span>
                  </div>

                  <h3 className="font-black text-gray-950 text-base group-hover:text-amber-600 transition-colors leading-snug">
                    {p.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed font-normal">
                    {p.description || "Ingredientes selecionados e receita artesanal exclusiva da Central Lanches."}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-gray-50 space-y-3">
                  <div className="font-black text-gray-950 text-base">
                    {formatCurrency(p.price)}
                  </div>
                  <button
                    onClick={() => quickAddToCart(p)}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-gray-950 font-black text-xs rounded-full shadow-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <ShoppingBag size={14} />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Banner Wavy "Crave It? We'll Deliver It!" (Fiel à Referência) */}
      <section id="delivery-banner" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[#0f1813] rounded-[2.5rem] md:rounded-[3rem] p-8 sm:p-12 md:p-16 text-white relative overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Efeitos decorativos de luz esmeralda */}
          <div className="absolute -top-12 -right-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="md:col-span-7 space-y-4 text-center md:text-left relative z-10">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 block">
              GOOD FOOD ALWAYS
            </span>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
              <span className="font-handwriting text-amber-400 font-bold block sm:inline text-4xl sm:text-5xl md:text-6xl">
                Crave It?
              </span>{" "}
              We'll Deliver It!
            </h2>

            <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto md:mx-0 leading-relaxed font-normal">
              Order your favorite food now and enjoy the perfect blend of taste and freshness delivered right to your door.
            </p>

            <div className="pt-2">
              <button
                onClick={() => scrollToSection("cardapio")}
                className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-xs sm:text-sm rounded-full shadow-xl shadow-amber-500/25 inline-flex items-center gap-2 active:scale-95 transition-all"
              >
                <span>Order Now</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="md:col-span-5 relative flex justify-center items-center">
            {/* Doodle "Good Food ♡ Good Vibes" como na referência */}
            <div className="absolute -top-4 right-2 sm:right-6 z-20 hidden sm:flex flex-col items-center rotate-6 pointer-events-none select-none">
              <div className="font-handwriting text-amber-300 text-lg font-bold flex items-center gap-1">
                <span>Good Food ♡ Good Vibes</span>
                <span className="text-base">↗</span>
              </div>
            </div>

            <div className="relative w-full max-w-md aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10">
              <img
                src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80"
                alt="Delivery Central Lanches"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-amber-400 border border-white/10 flex items-center gap-1">
                <Flame size={12} />
                <span>Quentinho & Rápido</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Cardápio Completo com Filtros em Pílulas e Busca */}
      <section id="cardapio" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-amber-600">
            EXPLORE O MENU
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-950 tracking-tight">
            Cardápio Completo
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Escolha sua categoria preferida ou busque pelo lanche, porção ou bebida desejada.
          </p>
        </div>

        {/* Barra de Busca Elegante */}
        <div className="max-w-md mx-auto">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar lanches, porções, adicionais..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Abas de Categorias em Pílula (Pill Tabs) */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-3 scrollbar-none">
          <button
            onClick={() => setSelectedCat("")}
            className={`px-6 py-2.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${
              selectedCat === ""
                ? "bg-gray-950 text-amber-400 shadow-md scale-105"
                : "bg-white text-gray-600 hover:text-gray-950 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            Todas as Seções
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-6 py-2.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${
                selectedCat === c.id
                  ? "bg-gray-950 text-amber-400 shadow-md scale-105"
                  : "bg-white text-gray-600 hover:text-gray-950 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Listagem dos Produtos Organizada por Seção */}
        <div className="space-y-14">
          {(selectedCat
            ? categories.filter((c) => c.id === selectedCat)
            : categories
          ).map((category) => {
            const categoryProducts = filteredProducts.filter((p) => p.categoryId === category.id);
            if (categoryProducts.length === 0) return null;

            const isLanchesCat = category.name.toLowerCase().includes("lanche");
            const isPorcoesCat = category.name.toLowerCase().includes("porç") || category.name.toLowerCase().includes("porco");
            const isBarcasCat = category.name.toLowerCase().includes("barca");
            const isBebidasCat = category.name.toLowerCase().includes("bebida");

            const icon = isLanchesCat
              ? "🍔"
              : isPorcoesCat
              ? "🍟"
              : isBarcasCat
              ? "⛵"
              : isBebidasCat
              ? "🥤"
              : "🍽️";

            return (
              <div key={category.id} className="space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <h3 className="text-xl font-black text-gray-950 uppercase tracking-tight">
                      {category.name}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded-full ml-auto shadow-xs">
                    {categoryProducts.length} {categoryProducts.length === 1 ? "opção" : "opções"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {categoryProducts.map((p) => {
                    const isLanche = isLanchesCat;
                    return (
                      <div
                        key={p.id}
                        className="bg-white rounded-3xl p-4 border border-gray-200/80 shadow-xs hover:shadow-lg transition-all flex gap-4 items-center justify-between group"
                      >
                        <div className="flex-1 min-w-0 pr-1 space-y-1">
                          <h4 className="font-black text-sm text-gray-950 group-hover:text-amber-600 transition-colors line-clamp-1">
                            {p.name}
                          </h4>
                          {p.description && (
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                              {p.description}
                            </p>
                          )}
                          <div className="font-black text-gray-950 text-sm pt-1">
                            {formatCurrency(p.price)}
                          </div>
                        </div>

                        {p.imageUrl ? (
                          <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-100">
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 text-2xl flex-shrink-0">
                            {icon}
                          </div>
                        )}

                        <div className="flex-shrink-0">
                          <button
                            onClick={() => (isLanche ? openCustomizeModal(p) : quickAddToCart(p))}
                            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-gray-950 font-black text-xs rounded-full shadow-xs flex items-center gap-1 transition-all"
                            title={isLanche ? "Personalizar lanche" : "Adicionar à sacola"}
                          >
                            <Plus size={14} />
                            <span>{isLanche ? "Montar" : "Pedir"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="text-center py-16 text-gray-500 text-xs">
              Nenhum produto encontrado nesta busca.
            </div>
          )}
        </div>
      </section>

      {/* 6. Barra de Confiança e Benefícios (Fiel à Foto) */}
      <section id="sobre" className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Leaf size={22} />
            </div>
            <div className="text-xs font-black text-gray-900">100% Fresh Ingredients</div>
            <div className="text-[11px] text-gray-500">Ingredientes selecionados</div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star size={22} className="fill-amber-500 text-amber-500" />
            </div>
            <div className="text-xs font-black text-gray-900">Top Rated by Customers</div>
            <div className="text-[11px] text-gray-500">Nota máxima em avaliações</div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Truck size={22} />
            </div>
            <div className="text-xs font-black text-gray-900">Fast & Reliable Delivery</div>
            <div className="text-[11px] text-gray-500">Chega quentinho e rápido</div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <div className="text-xs font-black text-gray-900">Secure Online Payment</div>
            <div className="text-[11px] text-gray-500">Pix com aprovação instantânea</div>
          </div>
        </div>
      </section>

      {/* 7. Footer Estilizado */}
      <footer className="bg-[#110e0c] text-white py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-gray-950 font-black">
                <Flame size={18} className="fill-current text-gray-950" />
              </div>
              <span className="font-black text-lg tracking-tight text-white">
                {setting?.restaurantName || "Central Lanches"}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {setting?.openingHours || "Terça a Domingo das 18h às 23h30"}
            </p>
            {setting?.address && (
              <p className="text-xs text-gray-500">{setting.address}</p>
            )}
          </div>

          <div className="text-xs text-gray-500">
            © {new Date().getFullYear()} {setting?.restaurantName || "Central Lanches"}. All rights reserved.
          </div>
        </div>
      </footer>

      {/* 8. Botão Flutuante de Sacola (Mobile & Desktop) */}
      {totalItemsCount > 0 && !cartOpen && (
        <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-8 z-30 flex justify-center animate-in slide-in-from-bottom duration-300">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full md:w-auto px-6 py-4 bg-gray-950 hover:bg-black text-white font-black text-sm rounded-full shadow-2xl flex items-center justify-between gap-6 border-2 border-amber-500 active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-amber-500 text-gray-950 text-xs font-black flex items-center justify-center">
                {totalItemsCount}
              </span>
              <span>Ver Minha Sacola</span>
            </div>
            <div className="font-black text-amber-400 text-base">
              {formatCurrency(subtotal)}
            </div>
          </button>
        </div>
      )}

      {/* 9. Modal de Personalização do Lanche */}
      {customizingProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col justify-end md:justify-center p-0 md:p-4 animate-in fade-in duration-200">
          <div className="bg-white text-gray-900 rounded-t-3xl md:rounded-[2.5rem] max-w-lg w-full mx-auto max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-250">
            <div className="relative p-5 bg-gradient-to-r from-amber-500/10 to-transparent border-b border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">
                  Personalizar Item
                </span>
                <h3 className="font-black text-lg text-gray-950">{customizingProduct.name}</h3>
                <span className="text-sm font-black text-amber-600">
                  {formatCurrency(customizingProduct.price)}
                </span>
              </div>
              <button
                onClick={() => setCustomizingProduct(null)}
                className="p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-6 text-xs">
              <div>
                <span className="font-extrabold text-gray-800 block mb-2 uppercase tracking-wider text-[11px]">
                  Deseja retirar algum ingrediente?
                </span>
                <div className="flex flex-wrap gap-2">
                  {["Sem cebola", "Sem tomate", "Sem alface", "Sem milho", "Sem maionese"].map((tag) => {
                    const active = customNotes.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => addQuickNote(tag)}
                        className={`px-3.5 py-1.5 rounded-full font-bold transition-all border ${
                          active
                            ? "bg-red-50 text-red-600 border-red-300 shadow-xs"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {tag} {active ? "✓" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>

              {addonsList.length > 0 && (
                <div>
                  <span className="font-extrabold text-gray-800 block mb-2 uppercase tracking-wider text-[11px]">
                    Turbinar com Adicionais:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {addonsList.map((addon) => {
                      const selected = selectedAddons.some((a) => a.id === addon.id);
                      return (
                        <button
                          type="button"
                          key={addon.id}
                          onClick={() => toggleAddon(addon)}
                          className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between gap-1 ${
                            selected
                              ? "bg-amber-50 border-amber-400 text-amber-950 font-bold shadow-xs"
                              : "bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <span className="font-bold text-xs">
                            {selected ? "✓ " : "+ "}
                            {addon.name.replace("Adicional: ", "")}
                          </span>
                          <span className="text-[11px] text-amber-700 font-black">
                            {formatCurrency(addon.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <span className="font-extrabold text-gray-800 block mb-1 uppercase tracking-wider text-[11px]">
                  Observações Extras:
                </span>
                <input
                  type="text"
                  placeholder="Ex: Ponto da carne bem passado, pouco molho..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase">Subtotal</span>
                <div className="text-base font-black text-gray-950">
                  {formatCurrency(
                    customizingProduct.price + selectedAddons.reduce((sum, a) => sum + a.price, 0)
                  )}
                </div>
              </div>
              <button
                onClick={confirmCustomizedItem}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-gray-950 font-black text-xs rounded-full shadow-md flex items-center gap-1.5 transition-all"
              >
                <span>Adicionar ao Pedido</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Drawer da Sacola de Compras */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#110e0c] text-white">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-amber-400" />
                <h3 className="font-black text-base tracking-tight">Sua Sacola</h3>
                <span className="text-xs bg-white/10 px-2.5 py-0.5 rounded-full font-bold text-amber-400">
                  {totalItemsCount} {totalItemsCount === 1 ? "item" : "itens"}
                </span>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {cartList.length === 0 ? (
                <div className="text-center py-20 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                    <ShoppingBag size={28} />
                  </div>
                  <h4 className="font-black text-base text-gray-900">Sua sacola está vazia</h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Adicione os mais deliciosos lanches e porções ao seu pedido para continuar.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {cartList.map((entry) => {
                      const key = `${entry.item.id}-${entry.notes || "padrao"}`;
                      return (
                        <div
                          key={key}
                          className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-start justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-black text-xs text-gray-900 leading-tight">
                              {entry.item.name}
                            </h4>
                            {entry.notes && (
                              <p className="text-[11px] text-amber-800 font-semibold mt-0.5 leading-snug">
                                {entry.notes}
                              </p>
                            )}
                            <div className="text-xs font-black text-gray-950 mt-1">
                              {formatCurrency(entry.item.price * entry.qty)}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-full border border-gray-200">
                            <button
                              onClick={() => updateQty(key, -1)}
                              className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-black font-bold"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-xs font-black w-4 text-center">{entry.qty}</span>
                            <button
                              onClick={() => updateQty(key, 1)}
                              className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-black font-bold"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/60 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-amber-800">
                      <Percent size={14} />
                      <span>Cupom de Desconto</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ex: PRIMEIRACOMPRA"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs uppercase font-bold focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={applyCoupon}
                        className="px-4 py-2 bg-gray-950 hover:bg-black text-amber-400 font-black text-xs rounded-xl transition-all"
                      >
                        Aplicar
                      </button>
                    </div>
                    {appliedCoupon && (
                      <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <Check size={12} />
                        <span>{appliedCoupon.description}</span>
                      </div>
                    )}
                    {couponError && (
                      <div className="text-[11px] font-bold text-red-600">{couponError}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                      Como deseja receber?
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setOrderType("DELIVERY")}
                        className={`py-2.5 px-2 rounded-2xl text-xs font-black border transition-all flex flex-col items-center gap-1 ${
                          orderType === "DELIVERY"
                            ? "bg-amber-50 border-amber-400 text-amber-900 shadow-xs"
                            : "bg-gray-50 border-gray-200 text-gray-600"
                        }`}
                      >
                        <Truck size={16} />
                        <span>Entrega</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOrderType("RETIRADA")}
                        className={`py-2.5 px-2 rounded-2xl text-xs font-black border transition-all flex flex-col items-center gap-1 ${
                          orderType === "RETIRADA"
                            ? "bg-amber-50 border-amber-400 text-amber-900 shadow-xs"
                            : "bg-gray-50 border-gray-200 text-gray-600"
                        }`}
                      >
                        <ShoppingBag size={16} />
                        <span>Retirar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOrderType("MESA")}
                        className={`py-2.5 px-2 rounded-2xl text-xs font-black border transition-all flex flex-col items-center gap-1 ${
                          orderType === "MESA"
                            ? "bg-amber-50 border-amber-400 text-amber-900 shadow-xs"
                            : "bg-gray-50 border-gray-200 text-gray-600"
                        }`}
                      >
                        <Utensils size={16} />
                        <span>Na Mesa</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-xs font-extrabold text-gray-800 uppercase tracking-wider block">
                      Seus Dados
                    </span>

                    <input
                      type="text"
                      placeholder="Seu Nome Completo"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
                    />

                    <input
                      type="tel"
                      placeholder="WhatsApp (com DDD)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
                    />

                    {orderType === "DELIVERY" && (
                      <textarea
                        rows={2}
                        placeholder="Endereço completo (Rua, Número, Bairro, Ponto de Ref.)"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                      Forma de Pagamento
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("PIX")}
                        className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                          paymentMethod === "PIX"
                            ? "bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs"
                            : "bg-gray-50 border-gray-200 text-gray-600"
                        }`}
                      >
                        <QrCode size={16} />
                        <span>Pix (Aprovação Imediata)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("DINHEIRO")}
                        className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                          paymentMethod === "DINHEIRO"
                            ? "bg-amber-50 border-amber-400 text-amber-900 shadow-xs"
                            : "bg-gray-50 border-gray-200 text-gray-600"
                        }`}
                      >
                        <span>💵 Dinheiro</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("DEBITO")}
                        className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                          paymentMethod === "DEBITO"
                            ? "bg-blue-50 border-blue-400 text-blue-900 shadow-xs"
                            : "bg-gray-50 border-gray-200 text-gray-600"
                        }`}
                      >
                        <span>💳 Cartão Débito</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("CREDITO")}
                        className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                          paymentMethod === "CREDITO"
                            ? "bg-blue-50 border-blue-400 text-blue-900 shadow-xs"
                            : "bg-gray-50 border-gray-200 text-gray-600"
                        }`}
                      >
                        <span>💳 Cartão Crédito</span>
                      </button>
                    </div>

                    {paymentMethod === "DINHEIRO" && (
                      <input
                        type="text"
                        placeholder="Precisa de troco para quanto? (Ex: 50)"
                        value={changeFor}
                        onChange={(e) => setChangeFor(e.target.value)}
                        className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 mt-2"
                      />
                    )}
                  </div>
                </>
              )}
            </div>

            {cartList.length > 0 && (
              <div className="p-5 border-t border-gray-100 bg-gray-50 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {orderType === "DELIVERY" && (
                    <div className="flex justify-between text-gray-500">
                      <span>Taxa de Entrega</span>
                      <span>{formatCurrency(deliveryFee)}</span>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Desconto</span>
                      <span>- {formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-gray-950 pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-amber-600">{formatCurrency(total)}</span>
                  </div>
                </div>

                <button
                  onClick={handlePreSubmitOrder}
                  disabled={submitting}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-400 active:scale-95 text-gray-950 font-black text-sm rounded-full shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <span>{submitting ? "Confirmando Pedido..." : "Finalizar Pedido Agora"}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 11. Modal Pergunta Sachês */}
      {sacheModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl font-black">
              🥫
            </div>
            <div>
              <h3 className="font-black text-base text-gray-950">Deseja sachês no pedido?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Ketchup, Maionese e Mostarda para acompanhar seu lanche.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => executeOrderSubmission(false)}
                className="py-3 px-4 rounded-full border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 active:scale-95 transition-all"
              >
                Não preciso
              </button>
              <button
                onClick={() => executeOrderSubmission(true)}
                className="py-3 px-4 rounded-full bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-xs active:scale-95 shadow-md shadow-amber-500/20 transition-all"
              >
                Sim, por favor!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
