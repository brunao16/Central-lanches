"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { printReceipt } from "@/lib/print";

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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

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
  const [paymentMethod, setPaymentMethod] = useState<"DINHEIRO" | "PIX" | "DEBITO" | "CREDITO">("PIX");
  const [amountReceived, setAmountReceived] = useState("");
  const [discount, setDiscount] = useState("0,00");
  const [orderNotes, setOrderNotes] = useState("");
  const [lastFinishedOrder, setLastFinishedOrder] = useState<any>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [prodRes, cashRes] = await Promise.all([
        fetch("/api/products?active=true"),
        fetch("/api/cash"),
      ]);
      const prodData = await prodRes.json();
      const cashData = await cashRes.json();
      setCategories(prodData.categories || []);
      setProducts(prodData.products || []);
      setRegister(cashData.register);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Adicionar produto ao carrinho
  function addToCart(p: any) {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === p.id);
      if (existing) {
        return prev.map((item) =>
          item.id === p.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: p.id,
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
  const discountCents = parseCurrencyToCents(discount);
  const total = Math.max(0, subtotal - discountCents);

  const receivedCents = parseCurrencyToCents(amountReceived);
  const changeDue = paymentMethod === "DINHEIRO" && receivedCents > total ? receivedCents - total : 0;

  // Finalizar Venda no Caixa
  async function handleCheckout() {
    if (cart.length === 0) return alert("Adicione ao menos um produto no pedido.");
    if (!register) return alert("Abra o caixa antes de realizar vendas.");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: orderType,
          tableNumber: tableNumber ? Number(tableNumber) : undefined,
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          deliveryAddress: deliveryAddress || undefined,
          discount: discountCents,
          paymentMethod,
          amountReceived: paymentMethod === "DINHEIRO" ? receivedCents : undefined,
          notes: orderNotes || undefined,
          items: cart.map((i) => ({
            productId: i.id,
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
        notes: data.order.notes,
      }, "CUSTOMER");
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
      setRegister(null);
      setCloseModal(false);
      alert("Caixa fechado com sucesso!");
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
    const matchesCat = selectedCategory === "all" || p.categoryId === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <AdminShell>
      <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-4rem)]">
        {/* Lado Esquerdo: Catálogo e Produtos */}
        <div className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto">
          {/* Topo: Status do Caixa e Busca */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  register ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
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
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === "all"
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                Todos
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === c.id
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
                onClick={() => addToCart(p)}
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
        <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col h-auto lg:h-[calc(100vh-4rem)]">
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
                  className={`py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                    orderType === t
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
                <input
                  type="text"
                  placeholder="Endereço de Entrega (Rua, Número, Bairro)"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
            )}

            {/* Pagamento */}
            <div className="grid grid-cols-4 gap-1.5">
              {(["PIX", "DINHEIRO", "DEBITO", "CREDITO"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                    paymentMethod === m
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {m === "DINHEIRO" ? "Dinheiro" : m}
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

            {/* Totais e Botão de Finalizar */}
            <div className="pt-2 border-t border-gray-200 space-y-1 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-gray-900 pt-1">
                <span>Total a Pagar:</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || !register}
              className="w-full py-3.5 bg-primary text-white rounded-xl font-extrabold text-sm hover:bg-primary-hover active:scale-[0.98] transition-all shadow-md shadow-red-200 disabled:opacity-50 disabled:pointer-events-none"
            >
              Finalizar Pedido
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
    </AdminShell>
  );
}
