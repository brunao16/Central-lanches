"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  ShoppingBag, Search, Plus, Minus, X, Check, MapPin, 
  Clock, Phone, ChevronRight, AlertCircle, Sparkles, Flame,
  Share2, ArrowLeft, Bike, Store, DollarSign, MessageCircle
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  photo: string | null;
  category: string;
  stock: number;
  active: number;
};

type CartItem = {
  cartId: string;
  product: Product;
  quantity: number;
  selectedAddons: Product[];
  notes: string;
  itemTotal: number;
};

const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v / 100);

export default function CardapioDeliveryPro() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  
  // Modal de Customização do Produto
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [itemQty, setItemQty] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<Product[]>([]);
  const [itemNotes, setItemNotes] = useState("");

  // Carrinho e Checkout
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [step, setStep] = useState<"menu" | "checkout" | "success">("menu");

  // Dados do Pedido
  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNeighborhood, setDeliveryNeighborhood] = useState("Centro");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "dinheiro" | "cartao">("pix");
  const [needChange, setNeedChange] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState("");

  // Taxas de Bairro (Delivery)
  const neighborhoodFees: Record<string, number> = {
    "Centro": 500,
    "Bairro Novo": 600,
    "Jardim América": 700,
    "Vila Operária": 700,
    "São Cristóvão": 800,
    "Zona Rural": 1200,
    "Outro": 700
  };

  useEffect(() => {
    fetch("/api/menu")
      .then(r => r.json())
      .then(d => {
        setProducts(d.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const list = Array.from(new Set(products.map(p => p.category))).filter(c => c !== "Adicionais");
    return ["Todos", ...list];
  }, [products]);

  const addonProducts = useMemo(() => {
    return products.filter(p => p.category === "Adicionais");
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (p.category === "Adicionais") return false;
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                            p.description.toLowerCase().includes(search.toLowerCase());
      const matchesCat = activeCategory === "Todos" || p.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, search, activeCategory]);

  // Abertura do Modal de Item
  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setItemQty(1);
    setSelectedAddons([]);
    setItemNotes("");
  };

  const toggleAddon = (addon: Product) => {
    if (selectedAddons.some(a => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const currentItemTotal = useMemo(() => {
    if (!selectedProduct) return 0;
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    return (selectedProduct.price + addonsTotal) * itemQty;
  }, [selectedProduct, selectedAddons, itemQty]);

  // Adicionar ao Carrinho
  const addToCart = () => {
    if (!selectedProduct) return;
    const newItem: CartItem = {
      cartId: crypto.randomUUID(),
      product: selectedProduct,
      quantity: itemQty,
      selectedAddons: [...selectedAddons],
      notes: itemNotes,
      itemTotal: currentItemTotal
    };
    setCart([...cart, newItem]);
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const updateCartQty = (cartId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.cartId === cartId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        const baseItemPrice = item.product.price + item.selectedAddons.reduce((s, a) => s + a.price, 0);
        return {
          ...item,
          quantity: newQty,
          itemTotal: baseItemPrice * newQty
        };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.itemTotal, 0);
  }, [cart]);

  const deliveryFee = orderType === "delivery" ? (neighborhoodFees[deliveryNeighborhood] || 500) : 0;
  const cartGrandTotal = cartSubtotal + deliveryFee;

  // Finalização do Pedido
  const handleFinishOrder = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert("Por favor, preencha seu nome e telefone!");
      return;
    }
    if (orderType === "delivery" && !deliveryAddress.trim()) {
      alert("Por favor, preencha o endereço completo de entrega!");
      return;
    }

    setSubmitting(true);
    const orderId = crypto.randomUUID();

    // Mapear itens para envio da API
    const itemsPayload: any[] = [];
    cart.forEach(c => {
      itemsPayload.push({
        id: c.product.id,
        name: c.product.name,
        price: c.product.price,
        qty: c.quantity
      });
      c.selectedAddons.forEach(a => {
        itemsPayload.push({
          id: a.id,
          name: `${a.name} (no ${c.product.name})`,
          price: a.price,
          qty: c.quantity
        });
      });
    });

    const notesSummary = [
      orderType === "delivery" ? `Delivery - ${deliveryNeighborhood}` : "Retirada no Balcão",
      `Pagamento: ${paymentMethod.toUpperCase()}${paymentMethod === "dinheiro" && needChange ? ` (Troco para R$ ${needChange})` : ""}`,
      orderNotes ? `Obs Geral: ${orderNotes}` : "",
      ...cart.filter(c => c.notes).map(c => `${c.product.name}: ${c.notes}`)
    ].filter(Boolean).join(" | ");

    try {
      // Grava no banco de dados da Central Lanches (cozinha e pedidos)
      const r = await fetch("/api/public-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          orderType: orderType === "delivery" ? "delivery" : "pickup",
          customerName,
          phone: customerPhone,
          address: orderType === "delivery" ? `${deliveryAddress} (${deliveryNeighborhood})` : "Retirada",
          items: itemsPayload,
          expectedTotal: itemsPayload.reduce((s, i) => s + i.price * i.qty, 0),
          note: notesSummary
        })
      });

      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Erro ao registrar pedido.");
      }

      setConfirmedOrderId(orderId.slice(-6).toUpperCase());
      setStep("success");

      // Gerar Mensagem Formatada para WhatsApp
      const itemsListText = cart.map(item => {
        const addonsText = item.selectedAddons.length 
          ? `\n   + ${item.selectedAddons.map(a => `${a.name} (${brl(a.price)})`).join(", ")}` 
          : "";
        const obsText = item.notes ? `\n   Obs: ${item.notes}` : "";
        return `*${item.quantity}x ${item.product.name}* - ${brl(item.itemTotal)}${addonsText}${obsText}`;
      }).join("\n\n");

      const whatsappText = `🍔 *NOVO PEDIDO - CENTRAL LANCHES*
--------------------------------
*Pedido:* #${orderId.slice(-6).toUpperCase()}
*Cliente:* ${customerName}
*Telefone:* ${customerPhone}
*Tipo:* ${orderType === "delivery" ? `🛵 Entrega (${deliveryNeighborhood})` : "🥡 Retirada no Balcão"}
${orderType === "delivery" ? `*Endereço:* ${deliveryAddress}\n*Taxa de Entrega:* ${brl(deliveryFee)}` : ""}

📋 *ITENS:*
${itemsListText}

--------------------------------
*Subtotal:* ${brl(cartSubtotal)}
${orderType === "delivery" ? `*Entrega:* ${brl(deliveryFee)}\n` : ""}*TOTAL:* *${brl(cartGrandTotal)}*
*Forma de Pagamento:* ${paymentMethod.toUpperCase()}${paymentMethod === "dinheiro" && needChange ? ` (Troco para R$ ${needChange})` : ""}
${orderNotes ? `\n📝 *Observações:* ${orderNotes}` : ""}
--------------------------------
_Pedido realizado pelo Cardápio Digital_`;

      const lojaWhatsApp = "5511999999999"; // Substituível pelo telefone da loja
      const waUrl = `https://wa.me/${lojaWhatsApp}?text=${encodeURIComponent(whatsappText)}`;
      
      // Abre WhatsApp automaticamente
      window.open(waUrl, "_blank");

    } catch (e: any) {
      alert("Aviso: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f111a] text-slate-100 font-sans pb-24">
      {/* HEADER PREMIUM */}
      <header className="relative bg-gradient-to-b from-[#1b1e2e] to-[#0f111a] border-b border-slate-800/80 sticky top-0 z-30 shadow-2xl backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-red-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-red-600/30">
              CL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-white">Central Lanches</h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Aberto
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Clock size={12} className="text-amber-500" /> 30-50 min • Entrega Rápida
              </p>
            </div>
          </div>

          {/* Botão Carrinho no Header */}
          {cart.length > 0 && (
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-red-600/30 transition-all transform active:scale-95"
            >
              <ShoppingBag size={18} />
              <span className="hidden sm:inline">Ver Pedido</span>
              <span className="bg-white text-red-600 px-1.5 py-0.5 rounded-full text-xs font-black">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            </button>
          )}
        </div>

        {/* BARRA DE PESQUISA */}
        <div className="max-w-4xl mx-auto px-4 pb-3">
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
            <input 
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar lanches, porções, combos..."
              className="w-full bg-[#161926] border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-red-500 transition-colors shadow-inner"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3.5 top-3 text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* CARROSSEL DE CATEGORIAS */}
        <div className="max-w-4xl mx-auto px-4 pb-3 overflow-x-auto flex gap-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat 
                  ? "bg-red-600 text-white shadow-md shadow-red-600/40" 
                  : "bg-[#181c2b] text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* BANNER PROMOCIONAL / DESTAQUE */}
      <div className="max-w-4xl mx-auto px-4 pt-5">
        <div className="bg-gradient-to-r from-red-950/60 via-[#1e1b2e] to-amber-950/40 border border-red-500/20 rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md mb-2">
              <Sparkles size={13} /> Destaque da Semana
            </span>
            <h2 className="text-xl md:text-2xl font-black text-white">Barca Central Lanches</h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-md mt-1">
              Moça Bonita + Batata Frita com Cheddar ou Catupiry + Tulipas Empanadas e Molhos Especiais!
            </p>
          </div>
          <button 
            onClick={() => {
              const barca = products.find(p => p.name.includes("Barca"));
              if (barca) openProductModal(barca);
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-black text-sm shadow-lg shadow-amber-500/20 transition-all transform active:scale-95"
          >
            Pedir Agora • R$ 65,00
          </button>
        </div>
      </div>

      {/* LISTA DE PRODUTOS */}
      <main className="max-w-4xl mx-auto px-4 pt-6">
        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Carregando cardápio...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-[#161926] rounded-2xl border border-slate-800">
            <p className="text-slate-400 text-sm">Nenhum produto encontrado com "{search}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredProducts.map(product => (
              <div 
                key={product.id}
                onClick={() => openProductModal(product)}
                className="group bg-[#151824] hover:bg-[#1a1e2e] border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-4 flex gap-4 cursor-pointer transition-all duration-200 shadow-md hover:shadow-xl hover:-translate-y-0.5"
              >
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-white group-hover:text-amber-400 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {product.description || "Ingredientes selecionados e preparados com padrão de qualidade artesanal."}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-black text-amber-400 text-base">
                      {brl(product.price)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400 group-hover:translate-x-1 transition-transform">
                      Adicionar <Plus size={14} />
                    </span>
                  </div>
                </div>

                {/* Foto ou Ícone */}
                <div className="w-24 h-24 rounded-xl bg-[#1b1f30] border border-slate-800 flex-shrink-0 overflow-hidden flex items-center justify-center relative">
                  {product.photo ? (
                    <img src={product.photo} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="text-3xl text-slate-600 group-hover:scale-110 transition-transform">
                      {product.category === "Porções" ? "🍟" : product.category === "Barcas" ? "🛶" : "🍔"}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* BARRA FLUTUANTE DE CARRINHO INFERIOR (MOBILE & DESKTOP) */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-0 right-0 z-40 px-4 max-w-md mx-auto">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-gradient-to-r from-red-600 via-red-500 to-amber-600 text-white p-4 rounded-2xl font-black text-sm flex items-center justify-between shadow-2xl shadow-red-600/50 hover:brightness-110 transition-all transform active:scale-95 animate-bounce-subtle border border-red-400/30"
          >
            <div className="flex items-center gap-2">
              <span className="bg-black/30 px-2 py-0.5 rounded-lg text-xs font-extrabold">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
              <span>Ver Pedido</span>
            </div>
            <div className="flex items-center gap-1 text-base font-extrabold">
              <span>{brl(cartSubtotal)}</span>
              <ChevronRight size={18} />
            </div>
          </button>
        </div>
      )}

      {/* MODAL DE CUSTOMIZAÇÃO DO PRODUTO (IFood Style) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
          <div className="bg-[#151824] border border-slate-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header Modal */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-[#151824] z-10">
              <h3 className="font-black text-lg text-white">{selectedProduct.name}</h3>
              <button onClick={() => setSelectedProduct(null)} className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="p-4 overflow-y-auto space-y-5 flex-1">
              <div>
                <p className="text-sm text-slate-300 leading-relaxed">{selectedProduct.description}</p>
                <div className="font-black text-xl text-amber-400 mt-2">{brl(selectedProduct.price)}</div>
              </div>

              {/* SELEÇÃO DE ADICIONAIS */}
              {addonProducts.length > 0 && selectedProduct.category !== "Adicionais" && (
                <div className="border-t border-slate-800/80 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-white">Deseja turbinar seu lanche?</h4>
                      <p className="text-xs text-slate-400">Escolha adicionais extras</p>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-md">Opcional</span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {addonProducts.map(addon => {
                      const isSelected = selectedAddons.some(a => a.id === addon.id);
                      return (
                        <div 
                          key={addon.id}
                          onClick={() => toggleAddon(addon)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            isSelected 
                              ? "bg-red-500/10 border-red-500 text-white" 
                              : "bg-[#1a1e2e] border-slate-800 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded flex items-center justify-center border ${isSelected ? "bg-red-600 border-red-600" : "border-slate-600"}`}>
                              {isSelected && <Check size={12} className="text-white" />}
                            </div>
                            <span className="font-semibold">{addon.name.replace("Adicional: ", "")}</span>
                          </div>
                          <span className="font-bold text-amber-400">+{brl(addon.price)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* OBSERVAÇÃO DO ITEM */}
              <div className="border-t border-slate-800/80 pt-4">
                <label className="block font-bold text-xs text-slate-300 mb-1.5">Alguma observação?</label>
                <textarea 
                  value={itemNotes}
                  onChange={e => setItemNotes(e.target.value)}
                  placeholder="Ex: sem cebola, ponto da carne bem passado, maionese à parte..."
                  className="w-full bg-[#1b1f30] border border-slate-700/60 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  rows={2}
                />
              </div>
            </div>

            {/* Footer Modal com Quantidade e Botão */}
            <div className="p-4 border-t border-slate-800 bg-[#151824] flex items-center gap-3">
              <div className="flex items-center bg-[#1b1f30] border border-slate-700 rounded-xl px-2 py-1">
                <button 
                  onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-black text-sm text-white">{itemQty}</span>
                <button 
                  onClick={() => setItemQty(itemQty + 1)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button 
                onClick={addToCart}
                className="flex-1 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 py-3 rounded-xl font-black text-sm text-white shadow-lg shadow-red-600/30 transition-all flex items-center justify-between px-4"
              >
                <span>Adicionar</span>
                <span>{brl(currentItemTotal)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DO CARRINHO E CHECKOUT */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
          <div className="bg-[#151824] border border-slate-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header Carrinho */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#151824]">
              <div className="flex items-center gap-2">
                {step === "checkout" && (
                  <button onClick={() => setStep("menu")} className="p-1 text-slate-400 hover:text-white">
                    <ArrowLeft size={18} />
                  </button>
                )}
                <h3 className="font-black text-lg text-white">
                  {step === "menu" ? "Seu Pedido" : step === "checkout" ? "Finalizar Entrega" : "Pedido Confirmado!"}
                </h3>
              </div>
              <button onClick={() => { setIsCartOpen(false); setStep("menu"); }} className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* ETAPA 1: REVISÃO DO CARRINHO */}
            {step === "menu" && (
              <>
                <div className="p-4 overflow-y-auto space-y-3 flex-1">
                  {cart.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Seu carrinho está vazio.</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.cartId} className="bg-[#1b1f30] border border-slate-800/80 rounded-2xl p-3 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-extrabold text-sm text-white">{item.product.name}</h4>
                            {item.selectedAddons.length > 0 && (
                              <p className="text-[11px] text-amber-400 mt-0.5">
                                + {item.selectedAddons.map(a => a.name.replace("Adicional: ", "")).join(", ")}
                              </p>
                            )}
                            {item.notes && (
                              <p className="text-[11px] text-slate-400 italic mt-0.5">Obs: {item.notes}</p>
                            )}
                          </div>
                          <span className="font-black text-sm text-amber-400">{brl(item.itemTotal)}</span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/50">
                          <button onClick={() => removeFromCart(item.cartId)} className="text-[11px] text-red-400 hover:underline">
                            Remover
                          </button>
                          <div className="flex items-center gap-2 bg-[#141724] border border-slate-700/80 rounded-lg px-2 py-0.5">
                            <button onClick={() => updateCartQty(item.cartId, -1)} className="text-slate-400 hover:text-white"><Minus size={13} /></button>
                            <span className="font-bold text-xs text-white px-1">{item.quantity}</span>
                            <button onClick={() => updateCartQty(item.cartId, 1)} className="text-slate-400 hover:text-white"><Plus size={13} /></button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="p-4 border-t border-slate-800 bg-[#151824] space-y-3">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-400">Subtotal</span>
                      <span className="text-white">{brl(cartSubtotal)}</span>
                    </div>
                    <button 
                      onClick={() => setStep("checkout")}
                      className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 py-3.5 rounded-xl font-black text-sm text-white shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2"
                    >
                      Continuar para Entrega <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ETAPA 2: DADOS DE ENTREGA E PAGAMENTO */}
            {step === "checkout" && (
              <div className="p-4 overflow-y-auto space-y-4 flex-1">
                {/* Tipo de Entrega */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#1a1e2e] rounded-xl border border-slate-800">
                  <button 
                    onClick={() => setOrderType("delivery")}
                    className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      orderType === "delivery" ? "bg-red-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Bike size={15} /> Entrega (Delivery)
                  </button>
                  <button 
                    onClick={() => setOrderType("pickup")}
                    className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      orderType === "pickup" ? "bg-red-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Store size={15} /> Retirar na Loja
                  </button>
                </div>

                {/* Dados do Cliente */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300">Seu Nome *</label>
                  <input 
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full bg-[#1b1f30] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300">WhatsApp / Telefone *</label>
                  <input 
                    type="tel"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="Ex: (11) 99999-9999"
                    className="w-full bg-[#1b1f30] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Campos de Endereço se for Delivery */}
                {orderType === "delivery" && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300">Bairro *</label>
                      <select 
                        value={deliveryNeighborhood}
                        onChange={e => setDeliveryNeighborhood(e.target.value)}
                        className="w-full bg-[#1b1f30] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                      >
                        {Object.entries(neighborhoodFees).map(([bairro, taxa]) => (
                          <option key={bairro} value={bairro}>{bairro} (Taxa: {brl(taxa)})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300">Endereço Completo com Número e Ponto de Referência *</label>
                      <input 
                        type="text"
                        value={deliveryAddress}
                        onChange={e => setDeliveryAddress(e.target.value)}
                        placeholder="Rua das Flores, 123 - Próximo à padaria"
                        className="w-full bg-[#1b1f30] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </>
                )}

                {/* Forma de Pagamento */}
                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <label className="block text-xs font-bold text-slate-300">Forma de Pagamento</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "pix", label: "PIX", icon: "⚡" },
                      { id: "cartao", label: "Cartão", icon: "💳" },
                      { id: "dinheiro", label: "Dinheiro", icon: "💵" }
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPaymentMethod(p.id as any)}
                        className={`p-2.5 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1 transition-all ${
                          paymentMethod === p.id 
                            ? "bg-red-500/10 border-red-500 text-white" 
                            : "bg-[#1b1f30] border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <span>{p.icon}</span>
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>

                  {paymentMethod === "dinheiro" && (
                    <div className="pt-2">
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Precisa de troco para quanto?</label>
                      <input 
                        type="text"
                        value={needChange}
                        onChange={e => setNeedChange(e.target.value)}
                        placeholder="Ex: 50,00 (deixe em branco se não precisar)"
                        className="w-full bg-[#1b1f30] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                  )}
                </div>

                {/* Observações Gerais */}
                <div className="space-y-1.5 border-t border-slate-800 pt-3">
                  <label className="block text-xs font-bold text-slate-300">Observações adicionais do pedido</label>
                  <input 
                    type="text"
                    value={orderNotes}
                    onChange={e => setOrderNotes(e.target.value)}
                    placeholder="Ex: Tocar o interfone 201, caprichar no molho..."
                    className="w-full bg-[#1b1f30] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Resumo Financeiro */}
                <div className="bg-[#1b1f30] border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal dos itens</span>
                    <span>{brl(cartSubtotal)}</span>
                  </div>
                  {orderType === "delivery" && (
                    <div className="flex justify-between text-slate-400">
                      <span>Taxa de entrega ({deliveryNeighborhood})</span>
                      <span>{brl(deliveryFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm text-white pt-2 border-t border-slate-700/60">
                    <span>Total a Pagar</span>
                    <span className="text-amber-400 text-base">{brl(cartGrandTotal)}</span>
                  </div>
                </div>

                <button 
                  disabled={submitting}
                  onClick={handleFinishOrder}
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 py-3.5 rounded-xl font-black text-sm text-white shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} />
                  {submitting ? "Enviando Pedido..." : "Confirmar e Enviar no WhatsApp"}
                </button>
              </div>
            )}

            {/* ETAPA 3: SUCESSO */}
            {step === "success" && (
              <div className="p-8 text-center space-y-4 my-auto">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl">
                  ✓
                </div>
                <div>
                  <h3 className="font-black text-xl text-white">Pedido #{confirmedOrderId} Enviado!</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Seu pedido já foi registrado na nossa cozinha e enviado para o WhatsApp da Central Lanches!
                  </p>
                </div>

                <div className="p-3 bg-[#1b1f30] rounded-xl border border-slate-800 text-xs text-slate-300">
                  Tempo estimado de preparo: <strong className="text-amber-400">30 a 50 minutos</strong>
                </div>

                <button 
                  onClick={() => {
                    setCart([]);
                    setIsCartOpen(false);
                    setStep("menu");
                  }}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-extrabold py-3 rounded-xl text-xs"
                >
                  Fazer Outro Pedido
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
