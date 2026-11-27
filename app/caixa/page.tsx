"use client";

import { useEffect, useState, useRef } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { formatCurrency, parseCurrencyToCents } from "@/lib/utils";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
  ShoppingBag,
  ArrowDownCircle,
  ArrowUpCircle,
  Bell,
  BellOff,
} from "lucide-react";
import { printReceipt, printRegisterCloseReceipt } from "@/lib/print";
import { playContinuousAlertSound, stopContinuousAlertSound } from "@/lib/sound";

interface CartItem {
  id: string;
  name: string;
  price: number; // centavos
  quantity: number;
  notes: string;
}

export default function CaixaPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<any>(null);

  // Modal de Personalização Rápida no Caixa
  const [customizingProduct, setCustomizingProduct] = useState<any | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [quickNotes, setQuickNotes] = useState<string[]>([]);
  const [customTextNote, setCustomTextNote] = useState("");

  // Status do caixa
  const [register, setRegister] = useState<any>(null);
  const [openModal, setOpenModal] = useState(false);
  const [initialAmount, setInitialAmount] = useState("100,00");
  const [closeModal, setCloseModal] = useState(false);
  const [finalAmount, setFinalAmount] = useState("");
  const [bleedModal, setBleedModal] = useState(false);
  const [supplyModal, setSupplyModal] = useState(false);
  const [movementAmount, setMovementAmount] = useState("");
  const [movementReason, setMovementReason] = useState("");

  // Dados do pedido no PDV
  const [orderType, setOrderType] = useState<"BALCAO" | "MESA" | "DELIVERY" | "RETIRADA">("BALCAO");
  const [tableNumber, setTableNumber] = useState<number | undefined>();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"DINHEIRO" | "PIX" | "DEBITO" | "CREDITO" | "MISTO">("PIX");
  const [splitCash, setSplitCash] = useState("");
  const [splitPix, setSplitPix] = useState("");
  const [amountReceived, setAmountReceived] = useState("");
  const [discount, setDiscount] = useState("0,00");
  const [orderNotes, setOrderNotes] = useState("");
  const [lastFinishedOrder, setLastFinishedOrder] = useState<any>(null);
  const [mobileTab, setMobileTab] = useState<"catalog" | "cart">("catalog");
  const [newOrdersAlert, setNewOrdersAlert] = useState<any[]>([]);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);
  const prevOrdersCountRef = useRef<number>(0);
  const isFirstLoadRef = useRef(true);
  const printedOrderIdsRef = useRef<Set<string>>(new Set());

  // Carrega preferência de auto-impressão no caixa
  useEffect(() => {
    const saved = localStorage.getItem("central_lanches_autoprint_caixa");
    if (saved !== null) {
      setAutoPrintEnabled(saved === "true");
    }
  }, []);

  function toggleAutoPrint() {
    const nextVal = !autoPrintEnabled;
    setAutoPrintEnabled(nextVal);
    localStorage.setItem("central_lanches_autoprint_caixa", String(nextVal));
  }

  function printIncomingOrder(order: any) {
    printReceipt({
      code: order.code,
      type: order.type,
      tableNumber: order.tableNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryAddress: order.deliveryAddress,
      createdAt: order.createdAt,
      items: (order.items || []).map((it: any) => ({
        name: it.productName,
        quantity: it.quantity,
        price: it.unitPrice,
        notes: it.notes,
      })),
      subtotal: order.subtotal || order.total,
      deliveryFee: order.deliveryFee,
      discount: order.discount,
      total: order.total,
      paymentMethod: order.paymentMethod,
      amountReceived: order.amountReceived,
      changeDue: order.changeDue,
      notes: order.notes,
    }, order.type === "DELIVERY" ? "DELIVERY" : "CUSTOMER");
  }

  async function checkIncomingOrders() {
    try {
      const res = await fetch("/api/orders?status=NOVO&limit=10");
      const data = await res.json();
      const novos = data.orders || [];

      if (!isFirstLoadRef.current) {
        if (novos.length > prevOrdersCountRef.current) {
          playContinuousAlertSound();
          setNewOrdersAlert(novos);

          // Se auto-impressão estiver ativada, imprime os novos pedidos automaticamente
          if (autoPrintEnabled) {
            novos.forEach((order: any) => {
              if (!printedOrderIdsRef.current.has(order.id)) {
                printedOrderIdsRef.current.add(order.id);
                printIncomingOrder(order);
              }
            });
          }
        } else if (novos.length === 0) {
          stopContinuousAlertSound();
          setNewOrdersAlert([]);
        }
      } else {
        // Na primeira carga, registrar os já existentes para não imprimir pedidos antigos
        novos.forEach((order: any) => {
          printedOrderIdsRef.current.add(order.id);
        });
      }

      isFirstLoadRef.current = false;
      prevOrdersCountRef.current = novos.length;
    } catch (e) {
      console.error(e);
    }
  }

  function handleDismissAlert() {
    stopContinuousAlertSound();
    setNewOrdersAlert([]);
  }

  async function loadData() {
    setLoading(true);
    try {
      const [prodRes, cashRes, setRes] = await Promise.all([
        fetch("/api/products?active=true"),
        fetch("/api/cash"),
        fetch("/api/settings"),
      ]);
      const prodData = await prodRes.json();
      const cashData = await cashRes.json();
      const setData = await setRes.json();
      const cats = prodData.categories || [];
      setCategories(cats);
      setProducts(prodData.products || []);
      setRegister(cashData.register);
      setZones(setData.zones || []);
      if (setData.zones?.[0]) setSelectedZone(setData.zones[0]);
      if (cats.length > 0) {
        setSelectedCategory(cats[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    checkIncomingOrders();
    const interval = setInterval(checkIncomingOrders, 5000);

    // Atalhos de Teclado no Caixa
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "F2") {
        e.preventDefault();
        if (cart.length > 0 && register) {
          handleCheckout();
        }
      } else if (e.key === "Escape") {
        if (cart.length > 0) {
          if (confirm("Deseja limpar todos os itens do carrinho?")) {
            setCart([]);
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearInterval(interval);
      stopContinuousAlertSound();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [cart, register, orderType, paymentMethod, customerName, customerPhone, deliveryAddress, discount, amountReceived]);

  // Lista de Adicionais disponíveis
  const availableAddons = products.filter(
    (p) =>
      categories.find((c) => c.id === p.categoryId)?.name === "Adicionais" ||
      p.name.startsWith("Adicional:")
  );

  function openCustomizer(p: any) {
    // Se for bebida ou sobremesa simples sem adicionais, adiciona direto
    const catName = categories.find((c) => c.id === p.categoryId)?.name?.toLowerCase() || "";
    if (catName.includes("bebida") || catName.includes("refrigerante") || catName.includes("sobremesa")) {
      addToCartDirect(p);
      return;
    }
    setCustomizingProduct(p);
    setSelectedAddons([]);
    setQuickNotes([]);
    setCustomTextNote("");
  }

  function toggleAddon(addon: any) {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.id === addon.id);
      return exists ? prev.filter((a) => a.id !== addon.id) : [...prev, addon];
    });
  }

  function toggleQuickNote(note: string) {
    setQuickNotes((prev) => {
      return prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note];
    });
  }

  function confirmCustomizedProduct() {
    if (!customizingProduct) return;

    const addonsTotal = selectedAddons.reduce((acc, a) => acc + a.price, 0);
    const itemTotalPrice = customizingProduct.price + addonsTotal;

    const notesParts: string[] = [];
    if (selectedAddons.length > 0) {
      notesParts.push(`+ ${selectedAddons.map((a) => a.name.replace("Adicional: ", "")).join(", ")}`);
    }
    if (quickNotes.length > 0) {
      notesParts.push(quickNotes.join(", "));
    }
    if (customTextNote.trim()) {
      notesParts.push(customTextNote.trim());
    }

    const finalNotes = notesParts.join(" | ");

    setCart((prev) => [
      ...prev,
      {
        id: `${customizingProduct.id}-${Date.now()}`,
        name: customizingProduct.name,
        price: itemTotalPrice,
        quantity: 1,
        notes: finalNotes,
      },
    ]);

    setCustomizingProduct(null);
  }

  // Adicionar produto direto ao carrinho
  function addToCartDirect(p: any) {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === p.id && !item.notes);
      if (existing) {
        return prev.map((item) =>
          item.id === p.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: `${p.id}-${Date.now()}`,
          name: p.name,
          price: p.price,
          quantity: 1,
          notes: "",
        },
      ];
    });
  }

  function updateQuantity(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  }

  function updateItemNotes(id: string, notes: string) {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes } : item))
    );
  }

  // Cálculos do pedido
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = orderType === "DELIVERY" && selectedZone ? selectedZone.fee : 0;
  const discountCents = parseCurrencyToCents(discount);
  const total = Math.max(0, subtotal + deliveryFee - discountCents);

  const receivedCents = parseCurrencyToCents(amountReceived);
  const changeDue = paymentMethod === "DINHEIRO" && receivedCents > total ? receivedCents - total : 0;

  // Finalizar Venda no Caixa
  async function handleCheckout() {
    if (cart.length === 0) return alert("Adicione ao menos um produto no pedido.");
    if (!register) return alert("Abra o caixa antes de realizar vendas.");

    try {
      const paymentNotes = paymentMethod === "MISTO" && (splitCash || splitPix)
        ? `[PAGAMENTO MISTO: Dinheiro R$ ${splitCash || "0,00"} | Pix R$ ${splitPix || "0,00"}] ${orderNotes ? `| ${orderNotes}` : ""}`
        : orderNotes || undefined;

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: orderType,
          tableNumber: tableNumber ? Number(tableNumber) : undefined,
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          deliveryAddress: deliveryAddress || undefined,
          deliveryFee: deliveryFee,
          discount: discountCents,
          paymentMethod,
          amountReceived: paymentMethod === "DINHEIRO" && receivedCents > 0 ? receivedCents : undefined,
          notes: paymentNotes,
          items: cart.map((i) => ({
            productId: i.id.includes("-") ? i.id.split("-")[0] : i.id,
            productName: i.name,
            unitPrice: i.price,
            quantity: i.quantity,
            notes: i.notes || undefined,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setLastFinishedOrder(data.order);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setDeliveryAddress("");
      setAmountReceived("");
      setDiscount("0,00");
      setOrderNotes("");

      // Imprime automaticamente a comanda para o cliente/motoboy
      printReceipt({
        code: data.order.code,
        type: data.order.type,
        tableNumber: data.order.tableNumber,
        customerName: data.order.customerName,
        customerPhone: data.order.customerPhone,
        deliveryAddress: data.order.deliveryAddress,
        createdAt: data.order.createdAt,
        items: data.order.items.map((it: any) => ({
          name: it.productName,
          quantity: it.quantity,
          price: it.unitPrice,
          notes: it.notes,
        })),
        subtotal: data.order.subtotal || data.order.total,
        deliveryFee: data.order.deliveryFee,
        discount: data.order.discount,
        total: data.order.total,
        paymentMethod: data.order.paymentMethod,
        amountReceived: data.order.amountReceived,
        changeDue: data.order.changeDue,
        notes: data.order.notes,
      }, data.order.type === "DELIVERY" ? "DELIVERY" : "CUSTOMER");
    } catch (e: any) {
      alert("Erro ao finalizar venda: " + e.message);
    }
  }

  // Abertura de Caixa
  async function handleOpenRegister() {
    try {
      const res = await fetch("/api/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "open",
          initialAmount: parseCurrencyToCents(initialAmount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRegister(data.register);
      setOpenModal(false);
    } catch (e: any) {
      alert(e.message);
    }
  }

  // Fechamento de Caixa
  async function handleCloseRegister() {
    try {
      const res = await fetch("/api/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "close",
          finalAmount: parseCurrencyToCents(finalAmount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Imprime o cupom térmico Z de Fechamento de Caixa
      if (register) {
        const movements = register.movements || [];
        let salesTotal = 0;
        let salesCount = 0;
        let suppliesTotal = 0;
        let bleedsTotal = 0;
        const payments: Record<string, number> = {};

        movements.forEach((m: any) => {
          if (m.type === "VENDA") {
            salesTotal += m.amount;
            salesCount += 1;
            const method = m.order?.paymentMethod || "OUTROS";
            payments[method] = (payments[method] || 0) + m.amount;
          } else if (m.type === "SUPRIMENTO") {
            suppliesTotal += m.amount;
          } else if (m.type === "SANGRIA") {
            bleedsTotal += m.amount;
          }
        });

        printRegisterCloseReceipt({
          openedAt: register.openedAt,
          closedAt: new Date(),
          initialAmount: register.initialAmount,
          finalAmount: parseCurrencyToCents(finalAmount),
          expectedAmount: data.register?.expectedAmount || (register.initialAmount + salesTotal + suppliesTotal - bleedsTotal),
          salesTotal,
          suppliesTotal,
          bleedsTotal,
          salesCount,
          payments,
        });
      }

      setRegister(null);
      setCloseModal(false);
      alert("Caixa fechado com sucesso! Cupom de fechamento enviado para impressão.");
    } catch (e: any) {
      alert(e.message);
    }
  }

  // Sangria de Caixa (retirada)
  async function handleBleed() {
    const cents = parseCurrencyToCents(movementAmount);
    if (!cents || cents <= 0) return alert("Informe um valor válido.");
    if (!movementReason.trim()) return alert("Informe o motivo da sangria.");

    try {
      const res = await fetch("/api/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bleed",
          amount: cents,
          description: movementReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert("Sangria registrada com sucesso!");
      setBleedModal(false);
      setMovementAmount("");
      setMovementReason("");
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  }

  // Suprimento de Caixa (entrada)
  async function handleSupply() {
    const cents = parseCurrencyToCents(movementAmount);
    if (!cents || cents <= 0) return alert("Informe um valor válido.");
    if (!movementReason.trim()) return alert("Informe o motivo do suprimento.");

    try {
      const res = await fetch("/api/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "supply",
          amount: cents,
          description: movementReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert("Suprimento registrado com sucesso!");
      setSupplyModal(false);
      setMovementAmount("");
      setMovementReason("");
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  }

  const filteredProducts = products.filter((p) => {
    const matchesCat = searchTerm ? true : (!selectedCategory || p.categoryId === selectedCategory);
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <AdminShell>
      {/* Barra de alternância rápida no Celular */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-2 sticky top-14 z-30 shadow-xs">
        <button
          onClick={() => setMobileTab("catalog")}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${mobileTab === "catalog"
              ? "bg-primary text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
        >
          <span>🍔 Produtos / Lanches</span>
        </button>
        <button
          onClick={() => setMobileTab("cart")}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${mobileTab === "cart"
              ? "bg-primary text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
        >
          <span>🛍️ Pedido ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
          {cart.length > 0 && (
            <span className="text-[10px] bg-white text-primary px-1.5 py-0.2 rounded-full font-bold">
              {formatCurrency(total)}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-4rem)]">
        {/* Lado Esquerdo: Catálogo e Produtos */}
        <div className={`flex-1 p-3 sm:p-4 md:p-6 space-y-4 overflow-y-auto ${mobileTab === "cart" ? "hidden lg:block" : "block"}`}>
          {/* Banner de Alerta de Novo Pedido com Som Contínuo */}
          {newOrdersAlert.length > 0 && (
            <div className="bg-red-600 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl">
                  <Bell size={24} className="animate-bounce" />
                </div>
                <div>
                  <h3 className="font-black text-base leading-tight">
                    NOVO PEDIDO RECEBIDO! ({newOrdersAlert.length})
                  </h3>
                  <p className="text-xs text-white/90">
                    Há pedido(s) aguardando atendimento. Clique ao lado para silenciar e conferir.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismissAlert}
                className="px-4 py-2.5 bg-white text-red-600 hover:bg-gray-100 rounded-xl font-black text-xs active:scale-95 transition-all shadow-md flex items-center gap-2"
              >
                <BellOff size={16} />
                <span>Ciente / Atender</span>
              </button>
            </div>
          )}

          {/* Topo: Status do Caixa e Busca */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${register ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                  }`}
              >
                {register ? <Unlock size={20} /> : <Lock size={20} />}
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Status do Caixa</span>
                <div className="text-sm font-extrabold text-gray-900">
                  {register ? `Aberto (Fundo: ${formatCurrency(register.initialAmount)})` : "Caixa Fechado"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={toggleAutoPrint}
                className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all ${autoPrintEnabled
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-gray-100 text-gray-500 border-gray-200"
                  }`}
                title="Imprimir comanda automaticamente assim que o cliente fizer o pedido no cardápio online"
              >
                <Printer size={15} />
                <span>{autoPrintEnabled ? "Auto-Imprimir: Ligado" : "Auto-Imprimir: Desligado"}</span>
              </button>

              <button
                onClick={() => {
                  printReceipt({
                    code: "TESTE",
                    type: "BALCAO",
                    customerName: "Impressão de Teste",
                    createdAt: new Date(),
                    items: [
                      { name: "Lanche Teste Kiosk", quantity: 1, price: 2500, notes: "Teste térmico" }
                    ],
                    subtotal: 2500,
                    total: 2500,
                    paymentMethod: "TESTE"
                  }, "CUSTOMER");
                }}
                className="px-2.5 py-2 text-xs font-bold rounded-xl border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-1"
                title="Testar se a impressora responde imediatamente"
              >
                <span>🖨️ Testar Impressora</span>
              </button>

              {register ? (
                <>
                  <button
                    onClick={() => setSupplyModal(true)}
                    className="px-3 py-2 text-xs font-bold rounded-xl border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 transition-all flex items-center gap-1.5"
                    title="Entrada de troco ou valor extra"
                  >
                    <ArrowDownCircle size={15} />
                    Suprimento
                  </button>
                  <button
                    onClick={() => setBleedModal(true)}
                    className="px-3 py-2 text-xs font-bold rounded-xl border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 active:scale-95 transition-all flex items-center gap-1.5"
                    title="Retirada de dinheiro da gaveta"
                  >
                    <ArrowUpCircle size={15} />
                    Sangria
                  </button>
                  <button
                    onClick={() => setCloseModal(true)}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl border border-red-200 text-red-600 hover:bg-red-50 active:scale-95 transition-all"
                  >
                    Fechar Caixa
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setOpenModal(true)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-primary text-white hover:bg-primary-hover active:scale-95 transition-all shadow-sm shadow-red-200"
                >
                  Abrir Caixa
                </button>
              )}
            </div>
          </div>

          {/* Busca e Filtro de Categorias */}
          <div className="space-y-3">
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar lanche, porção, bebida..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Abas de Categorias */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === c.id
                      ? "bg-primary text-white shadow-sm"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                    }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Grade de Produtos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => openCustomizer(p)}
                className="flex flex-col text-left p-3 bg-white rounded-2xl border border-gray-200/80 hover:border-red-300 hover:shadow-md transition-all active:scale-[0.98] group"
              >
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-24 object-cover rounded-xl mb-2.5 bg-gray-100"
                  />
                ) : (
                  <div className="w-full h-24 rounded-xl mb-2.5 bg-red-50 flex items-center justify-center text-primary font-black text-xl">
                    🍔
                  </div>
                )}
                <h4 className="font-bold text-sm text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
                  {p.name}
                </h4>
                <p className="text-xs text-gray-400 line-clamp-1 mb-2">{p.description || "Central Lanches"}</p>
                <div className="mt-auto font-black text-primary text-sm">
                  {formatCurrency(p.price)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Lado Direito: Carrinho / Fechamento de Venda */}
        <div className={`w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col h-auto lg:h-[calc(100vh-4rem)] ${mobileTab === "catalog" ? "hidden lg:flex" : "flex"}`}>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-gray-900 text-base">
              <ShoppingBag className="text-primary" size={20} />
              <span>Pedido Atual ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-red-500 hover:underline font-semibold"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Itens do Carrinho */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12 text-center">
                <ShoppingBag size={36} className="text-gray-200 mb-2" />
                <p className="text-sm font-semibold">Nenhum item adicionado</p>
                <p className="text-xs">Clique nos lanches para montar o pedido</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-gray-900">{item.name}</span>
                    <span className="font-extrabold text-sm text-gray-800">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="Obs: sem cebola, ponto da carne..."
                      value={item.notes}
                      onChange={(e) => updateItemNotes(item.id, e.target.value)}
                      className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-lg flex-1 focus:outline-none focus:border-primary"
                    />

                    <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Opções de Atendimento & Pagamento */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
            <div className="grid grid-cols-4 gap-1.5">
              {(["BALCAO", "MESA", "DELIVERY", "RETIRADA"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setOrderType(t)}
                  className={`py-1.5 text-[11px] font-bold rounded-lg border transition-all ${orderType === t
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                >
                  {t === "BALCAO" ? "Balcão" : t === "MESA" ? "Mesa" : t === "DELIVERY" ? "Entrega" : "Retirada"}
                </button>
              ))}
            </div>

            {orderType === "MESA" && (
              <input
                type="number"
                placeholder="Número da Mesa"
                value={tableNumber || ""}
                onChange={(e) => setTableNumber(Number(e.target.value) || undefined)}
                className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            )}

            {orderType === "DELIVERY" && (
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Nome do Cliente"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                />
                <input
                  type="text"
                  placeholder="WhatsApp / Telefone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                />
                {zones.length > 0 && (
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Bairro / Taxa</label>
                    <select
                      value={selectedZone?.id || ""}
                      onChange={(e) => {
                        const z = zones.find((item) => item.id === e.target.value);
                        setSelectedZone(z || null);
                      }}
                      className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg font-semibold focus:outline-none focus:border-primary mt-0.5"
                    >
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.neighborhood} ({formatCurrency(z.fee)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Endereço de Entrega (Rua, Número, Ponto de Ref)"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
            )}

            {/* Pagamento */}
            <div className="grid grid-cols-5 gap-1">
              {(["PIX", "DINHEIRO", "DEBITO", "CREDITO", "MISTO"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`py-1.5 text-[10px] font-black rounded-lg border transition-all ${paymentMethod === m
                      ? "bg-gray-900 text-white border-gray-900 shadow-xs"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                >
                  {m === "DINHEIRO" ? "Dinheiro" : m === "MISTO" ? "Misto" : m}
                </button>
              ))}
            </div>

            {paymentMethod === "DINHEIRO" && (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Recebido</label>
                  <input
                    type="text"
                    placeholder="R$ 50,00"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-bold"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Troco</label>
                  <div className="text-xs font-black text-emerald-600 py-1.5">
                    {formatCurrency(changeDue)}
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "MISTO" && (
              <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <div className="text-[11px] font-black text-blue-900 uppercase">
                  Divisão de Pagamento (Dinheiro + Pix)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block">Em Dinheiro (R$)</label>
                    <input
                      type="text"
                      placeholder="0,00"
                      value={splitCash}
                      onChange={(e) => setSplitCash(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block">No Pix / Cartão (R$)</label>
                    <input
                      type="text"
                      placeholder="0,00"
                      value={splitPix}
                      onChange={(e) => setSplitPix(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Totais e Botão de Finalizar */}
            <div className="pt-2 border-t border-gray-200 space-y-1 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {orderType === "DELIVERY" && deliveryFee > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Taxa Entrega ({selectedZone?.neighborhood || "Bairro"}):</span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>
              )}
              {discountCents > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Desconto:</span>
                  <span>-{formatCurrency(discountCents)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-gray-900 pt-1">
                <span>Total a Pagar:</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || !register}
              className="w-full py-3.5 bg-primary text-white rounded-xl font-extrabold text-sm hover:bg-primary-hover active:scale-[0.98] transition-all shadow-md shadow-red-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              <span>Finalizar Pedido</span>
              <kbd className="hidden sm:inline-block px-2 py-0.5 bg-white/20 text-white rounded text-[11px] font-mono">F2</kbd>
            </button>
          </div>
        </div>
      </div>

      {/* Comprovante Térmico 80mm para impressão */}
      {lastFinishedOrder && (
        <div id="thermal-receipt" className="hidden print:block">
          <div className="text-center font-bold text-sm mb-1">CENTRAL LANCHES</div>
          <div className="text-center text-[10px] mb-2">Comprovante de Pedido</div>
          <div>--------------------------------</div>
          <div>CÓDIGO: {lastFinishedOrder.code}</div>
          <div>TIPO: {lastFinishedOrder.type}</div>
          {lastFinishedOrder.tableNumber && <div>MESA: #{lastFinishedOrder.tableNumber}</div>}
          {lastFinishedOrder.customerName && <div>CLIENTE: {lastFinishedOrder.customerName}</div>}
          <div>PAGAMENTO: {lastFinishedOrder.paymentMethod}</div>
          <div>--------------------------------</div>
          <div className="font-bold mb-1">ITENS:</div>
          {lastFinishedOrder.items?.map((it: any, idx: number) => (
            <div key={idx} className="flex justify-between text-xs">
              <span>{it.quantity}x {it.productName}</span>
              <span>{formatCurrency(it.totalPrice)}</span>
            </div>
          ))}
          <div>--------------------------------</div>
          <div className="flex justify-between font-bold text-sm mt-1">
            <span>TOTAL:</span>
            <span>{formatCurrency(lastFinishedOrder.total)}</span>
          </div>
          {lastFinishedOrder.changeDue > 0 && (
            <div className="flex justify-between text-xs">
              <span>TROCO:</span>
              <span>{formatCurrency(lastFinishedOrder.changeDue)}</span>
            </div>
          )}
          <div className="text-center text-[10px] mt-3">Obrigado pela preferência!</div>
        </div>
      )}

      {/* Modal Abertura de Caixa */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-lg text-gray-900">Abrir Turno de Caixa</h3>
            <p className="text-xs text-gray-500">Informe o valor inicial da gaveta (fundo de troco).</p>
            <input
              type="text"
              value={initialAmount}
              onChange={(e) => setInitialAmount(e.target.value)}
              placeholder="R$ 100,00"
              className="w-full text-center text-xl font-black px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setOpenModal(false)}
                className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleOpenRegister}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm shadow-red-200"
              >
                Confirmar Abertura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Fechamento de Caixa */}
      {closeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-lg text-gray-900">Conferência e Fechamento</h3>
            <p className="text-xs text-gray-500">Conte o dinheiro físico da gaveta e digite o valor abaixo.</p>
            <input
              type="text"
              value={finalAmount}
              onChange={(e) => setFinalAmount(e.target.value)}
              placeholder="Ex: 350,00"
              className="w-full text-center text-xl font-black px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setCloseModal(false)}
                className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseRegister}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm"
              >
                Fechar Caixa
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Sangria de Caixa */}
      {bleedModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5 text-amber-600 font-extrabold text-lg">
              <ArrowUpCircle size={22} />
              <h3>Sangria de Caixa (Saída)</h3>
            </div>
            <p className="text-xs text-gray-500">
              Retirada de dinheiro da gaveta para despesas, fornecedores ou recolhimento.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700">Valor (R$)</label>
                <input
                  type="text"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  placeholder="Ex: 50,00"
                  className="w-full text-lg font-black mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Motivo / Descrição</label>
                <input
                  type="text"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder="Ex: Pagamento do gás / Entrega"
                  className="w-full text-xs font-medium mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setBleedModal(false);
                  setMovementAmount("");
                  setMovementReason("");
                }}
                className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleBleed}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm"
              >
                Confirmar Sangria
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suprimento de Caixa */}
      {supplyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5 text-emerald-600 font-extrabold text-lg">
              <ArrowDownCircle size={22} />
              <h3>Suprimento de Caixa (Entrada)</h3>
            </div>
            <p className="text-xs text-gray-500">
              Entrada de dinheiro para reforço de troco ou caixa.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700">Valor (R$)</label>
                <input
                  type="text"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  placeholder="Ex: 100,00"
                  className="w-full text-lg font-black mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Motivo / Descrição</label>
                <input
                  type="text"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder="Ex: Moedas e notas de R$ 2 e R$ 5"
                  className="w-full text-xs font-medium mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setSupplyModal(false);
                  setMovementAmount("");
                  setMovementReason("");
                }}
                className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleSupply}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
              >
                Confirmar Suprimento
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Personalização Rápida de Lanche */}
      {customizingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-primary tracking-wider">Turbinar / Observações</span>
                <h3 className="font-black text-xl text-gray-900">{customizingProduct.name}</h3>
                <p className="text-xs text-gray-500 font-bold">{formatCurrency(customizingProduct.price)} (Preço base)</p>
              </div>
              <button
                onClick={() => setCustomizingProduct(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {/* Adicionais Pagos */}
            {availableAddons.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-800 flex items-center justify-between">
                  <span>Adicionais (Extras):</span>
                  <span className="text-[11px] text-gray-400 font-medium">Opcional</span>
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {availableAddons.map((add) => {
                    const isSelected = selectedAddons.some((a) => a.id === add.id);
                    return (
                      <button
                        key={add.id}
                        type="button"
                        onClick={() => toggleAddon(add)}
                        className={`p-2 rounded-xl text-left border text-xs font-bold transition-all flex items-center justify-between ${isSelected
                            ? "bg-red-50 text-primary border-primary shadow-xs ring-1 ring-primary/20"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                          }`}
                      >
                        <span className="truncate pr-1">{add.name.replace("Adicional: ", "")}</span>
                        <span className="text-[10px] whitespace-nowrap text-emerald-600 font-black">
                          +{formatCurrency(add.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Botões Rápidos de Remoção */}
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-800">Remover Ingredientes:</label>
              <div className="flex flex-wrap gap-1.5">
                {["Sem Cebola", "Sem Maionese", "Sem Salada", "Sem Tomate", "Sem Milho", "Bem Passado", "Mal Passado"].map(
                  (note) => {
                    const active = quickNotes.includes(note);
                    return (
                      <button
                        key={note}
                        type="button"
                        onClick={() => toggleQuickNote(note)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${active
                            ? "bg-red-600 text-white shadow-xs"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                      >
                        {active ? `✓ ${note}` : note}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Observação Livre */}
            <div>
              <label className="text-xs font-black text-gray-800">Outra Observação:</label>
              <input
                type="text"
                placeholder="Ex: caprichar no molho, cortar ao meio..."
                value={customTextNote}
                onChange={(e) => setCustomTextNote(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 mt-1 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:outline-none"
              />
            </div>

            {/* Total do Item com Adicionais */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">Valor do Item</span>
                <span className="text-lg font-black text-primary">
                  {formatCurrency(
                    customizingProduct.price + selectedAddons.reduce((acc, a) => acc + a.price, 0)
                  )}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCustomizingProduct(null)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmCustomizedProduct}
                  className="px-5 py-2.5 text-xs font-black text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md shadow-red-200 active:scale-95 transition-all"
                >
                  Adicionar ao Pedido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
