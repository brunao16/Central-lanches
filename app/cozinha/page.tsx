"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { formatTime } from "@/lib/utils";
import { playOrderSound } from "@/lib/sound";
import { printReceipt } from "@/lib/print";
import {
  ChefHat,
  Clock,
  Check,
  ArrowRight,
  RefreshCw,
  Printer,
  Volume2,
  VolumeX,
  Flame,
} from "lucide-react";

export default function CozinhaPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(false);
  const [kitchenTab, setKitchenTab] = useState<"ALL" | "NOVO" | "PREPARANDO" | "PRONTO">("ALL");
  const prevOrderCountRef = useRef<number>(0);
  const isFirstLoadRef = useRef(true);
  const printedOrderIdsRef = useRef<Set<string>>(new Set());

  // Carrega preferência de auto-impressão
  useEffect(() => {
    const saved = localStorage.getItem("central_lanches_autoprint_kitchen");
    if (saved === "true") {
      setAutoPrintEnabled(true);
    }
  }, []);

  function toggleAutoPrint() {
    const nextVal = !autoPrintEnabled;
    setAutoPrintEnabled(nextVal);
    localStorage.setItem("central_lanches_autoprint_kitchen", String(nextVal));
  }

  async function fetchKitchenOrders() {
    try {
      const res = await fetch(`/api/orders?status=NOVO&limit=50&t=${Date.now()}`, { cache: "no-store" });
      const d1 = await res.json();
      const res2 = await fetch(`/api/orders?status=PREPARANDO&limit=50&t=${Date.now()}`, { cache: "no-store" });
      const d2 = await res2.json();
      const res3 = await fetch(`/api/orders?status=PRONTO&limit=20&t=${Date.now()}`, { cache: "no-store" });
      const d3 = await res3.json();

      const combined = [
        ...(d1.orders || []),
        ...(d2.orders || []),
        ...(d3.orders || []),
      ];

      const novos = d1.orders || [];
      const unprintedOrders = novos.filter((o: any) => !printedOrderIdsRef.current.has(o.id));

      if (!isFirstLoadRef.current) {
        if (unprintedOrders.length > 0) {
          if (soundEnabled) {
            playOrderSound();
          }

          // Impressão automática de pedidos novos que ainda não foram impressos
          if (autoPrintEnabled) {
            unprintedOrders.forEach((order: any) => {
              printedOrderIdsRef.current.add(order.id);
              handlePrintKitchen(order);
            });
          }
        }
      } else {
        // Na primeira carga, registrar os já existentes para não imprimir pedidos antigos
        novos.forEach((order: any) => {
          printedOrderIdsRef.current.add(order.id);
        });
      }

      isFirstLoadRef.current = false;
      prevOrderCountRef.current = novos.length;

      setOrders(combined);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchKitchenOrders();
    const interval = setInterval(fetchKitchenOrders, 5000);
    return () => clearInterval(interval);
  }, [soundEnabled, autoPrintEnabled]);

  async function updateStatus(orderId: string, nextStatus: string) {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchKitchenOrders();
    } catch (e) {
      console.error(e);
    }
  }

  function handlePrintKitchen(order: any) {
    printReceipt(
      {
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
      },
      "DELIVERY"
    );
  }

  const novos = orders.filter((o) => o.status === "NOVO");
  const preparando = orders.filter((o) => o.status === "PREPARANDO");
  const prontos = orders.filter((o) => o.status === "PRONTO");

  function getOrderAge(createdAt: string) {
    const diffMin = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60));
    return diffMin;
  }

  function getTimerBadge(createdAt: string) {
    const mins = getOrderAge(createdAt);
    if (mins >= 25) {
      return {
        bg: "bg-red-500 text-white animate-pulse shadow-sm shadow-red-200",
        label: `🚨 ${mins} min (Atrasado)`,
        border: "border-red-500 ring-2 ring-red-300",
      };
    }
    if (mins >= 15) {
      return {
        bg: "bg-amber-500 text-white shadow-sm",
        label: `⚠️ ${mins} min`,
        border: "border-amber-400 ring-1 ring-amber-200",
      };
    }
    return {
      bg: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      label: `⏱️ ${mins} min`,
      border: "border-gray-200",
    };
  }

  // Resumo da chapa (Itens agregados que estão em aberto)
  const chapaSummary = useMemo(() => {
    const openOrders = orders.filter((o) => o.status === "NOVO" || o.status === "PREPARANDO");
    const counts: { [name: string]: number } = {};
    openOrders.forEach((o) => {
      (o.items || []).forEach((it: any) => {
        counts[it.productName] = (counts[it.productName] || 0) + (it.quantity || 1);
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [orders]);

  return (
    <AdminShell>
      <div className="p-4 md:p-6 space-y-4 max-w-7xl h-full flex flex-col">
        {/* Topo da Cozinha */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 text-primary">
              <ChefHat size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">
                Monitor da Cozinha (KDS)
              </h1>
              <span className="text-xs text-gray-500">
                Atualização em tempo real (a cada 5s) • Alerta de atraso &gt; 20min
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAutoPrint}
              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all ${autoPrintEnabled
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-gray-100 text-gray-500 border-gray-200"
                }`}
              title="Imprimir comanda automaticamente ao chegar novos pedidos"
            >
              <Printer size={16} />
              <span>{autoPrintEnabled ? "Auto-Imprimir: Ligado" : "Auto-Imprimir: Desligado"}</span>
            </button>
            <button
              onClick={() => {
                if (!soundEnabled) playOrderSound();
                setSoundEnabled(!soundEnabled);
              }}
              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all ${soundEnabled
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-gray-100 text-gray-500 border-gray-200"
                }`}
              title="Ativar/Desativar alerta sonoro"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span>{soundEnabled ? "Som Ativo" : "Som Mudo"}</span>
            </button>
            <button
              onClick={fetchKitchenOrders}
              className="p-2 text-gray-500 hover:text-primary rounded-xl hover:bg-gray-100 transition-all border border-gray-200"
              title="Atualizar agora"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Resumo da Demanda da Chapa */}
        {chapaSummary.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-center gap-3 overflow-x-auto">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 uppercase shrink-0">
              <Flame size={16} className="text-amber-600" />
              <span>Demanda Chapa:</span>
            </div>
            <div className="flex items-center gap-2">
              {chapaSummary.map(([name, qty]) => (
                <span
                  key={name}
                  className="px-2.5 py-1 bg-white border border-amber-200 text-gray-900 rounded-xl text-xs font-black shrink-0 shadow-2xs flex items-center gap-1"
                >
                  <strong className="text-red-600 font-black">{qty}x</strong>
                  <span className="truncate max-w-[140px]">{name}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Seletor de Abas Mobile na Cozinha */}
        <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setKitchenTab("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${kitchenTab === "ALL"
              ? "bg-gray-900 text-white shadow-xs"
              : "bg-white text-gray-600 border border-gray-200"
              }`}
          >
            Todos ({orders.length})
          </button>
          <button
            onClick={() => setKitchenTab("NOVO")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${kitchenTab === "NOVO"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white text-amber-800 border border-amber-200"
              }`}
          >
            🟡 Novos ({novos.length})
          </button>
          <button
            onClick={() => setKitchenTab("PREPARANDO")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${kitchenTab === "PREPARANDO"
              ? "bg-orange-600 text-white shadow-xs"
              : "bg-white text-orange-800 border border-orange-200"
              }`}
          >
            🔥 Preparando ({preparando.length})
          </button>
          <button
            onClick={() => setKitchenTab("PRONTO")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${kitchenTab === "PRONTO"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white text-emerald-800 border border-emerald-200"
              }`}
          >
            ✅ Prontos ({prontos.length})
          </button>
        </div>

        {/* Quadro Kanban em 3 Colunas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 items-start">
          {/* Coluna 1: Novos */}
          <div className={`bg-amber-50/40 p-3.5 rounded-2xl border border-amber-200/80 space-y-3 ${kitchenTab !== "ALL" && kitchenTab !== "NOVO" ? "hidden md:block" : "block"}`}>
            <div className="flex items-center justify-between px-1">
              <span className="font-extrabold text-xs uppercase tracking-wider text-amber-800">
                🟡 Novos Pedidos ({novos.length})
              </span>
            </div>

            <div className="space-y-3">
              {novos.map((order) => {
                const timer = getTimerBadge(order.createdAt);
                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-xl p-4 shadow-sm border space-y-3 transition-all ${timer.border}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-black text-lg text-gray-900 leading-tight">
                          {order.customerName || `Pedido #${order.code.replace(/^#+/, "")}`}
                        </div>
                        <div className="text-xs font-bold text-gray-400 mt-0.5">
                          #{order.code.replace(/^#+/, "")}
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-gray-100 text-gray-700">
                        {order.type} {order.tableNumber ? `• MESA ${order.tableNumber}` : ""}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Clock size={14} />
                        <span>Recebido às {formatTime(order.createdAt)}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md font-black text-[11px] ${timer.bg}`}>
                        {timer.label}
                      </span>
                    </div>

                    {/* Itens */}
                    <div className="space-y-2 border-t border-b border-gray-100 py-2.5">
                      {order.items?.map((it: any) => (
                        <div key={it.id} className="text-sm">
                          <div className="font-black text-gray-900 text-base">
                            {it.quantity}x {it.productName}
                          </div>
                          {it.notes && (
                            <div className="text-xs text-red-900 font-black uppercase bg-red-100/90 border-2 border-red-500 px-2.5 py-1.5 rounded-lg mt-1 tracking-wide shadow-xs">
                              ⚠️ OBS: {it.notes.toUpperCase()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <div className="text-xs text-amber-950 font-black uppercase bg-amber-100 border-2 border-amber-500 p-2.5 rounded-xl tracking-wide shadow-xs">
                        ⚠️ OBS GERAL: {order.notes.toUpperCase()}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handlePrintKitchen(order)}
                        className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all"
                        title="Imprimir comanda de cozinha"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        onClick={() => updateStatus(order.id, "PREPARANDO")}
                        className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
                      >
                        <span>Iniciar Preparo</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {novos.length === 0 && (
                <div className="p-8 text-center text-xs text-gray-400 font-medium">
                  Nenhum pedido aguardando
                </div>
              )}
            </div>
          </div>

          {/* Coluna 2: Em Preparo */}
          <div className={`bg-orange-50/40 p-3.5 rounded-2xl border border-orange-200/80 space-y-3 ${kitchenTab !== "ALL" && kitchenTab !== "PREPARANDO" ? "hidden md:block" : "block"}`}>
            <div className="flex items-center justify-between px-1">
              <span className="font-extrabold text-xs uppercase tracking-wider text-orange-800">
                🔥 Na Chapa / Preparando ({preparando.length})
              </span>
            </div>

            <div className="space-y-3">
              {preparando.map((order) => {
                const timer = getTimerBadge(order.createdAt);
                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-xl p-4 shadow-sm border space-y-3 transition-all ${timer.border}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-black text-lg text-gray-900 leading-tight">
                          {order.customerName || `Pedido #${order.code.replace(/^#+/, "")}`}
                        </div>
                        <div className="text-xs font-bold text-orange-600 mt-0.5">
                          #{order.code.replace(/^#+/, "")}
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-orange-100 text-orange-800">
                        {order.type} {order.tableNumber ? `• MESA ${order.tableNumber}` : ""}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Clock size={14} />
                        <span>Em preparo desde {formatTime(order.updatedAt)}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md font-black text-[11px] ${timer.bg}`}>
                        {timer.label}
                      </span>
                    </div>

                    {/* Itens */}
                    <div className="space-y-2 border-t border-b border-gray-100 py-2.5">
                      {order.items?.map((it: any) => (
                        <div key={it.id} className="text-sm">
                          <div className="font-black text-gray-900 text-base">
                            {it.quantity}x {it.productName}
                          </div>
                          {it.notes && (
                            <div className="text-xs text-red-900 font-black uppercase bg-red-100/90 border-2 border-red-500 px-2.5 py-1.5 rounded-lg mt-1 tracking-wide shadow-xs">
                              ⚠️ OBS: {it.notes.toUpperCase()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <div className="text-xs text-amber-950 font-black uppercase bg-amber-100 border-2 border-amber-500 p-2.5 rounded-xl tracking-wide shadow-xs">
                        ⚠️ OBS GERAL: {order.notes.toUpperCase()}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handlePrintKitchen(order)}
                        className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all"
                        title="Imprimir comanda"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        onClick={() => updateStatus(order.id, "PRONTO")}
                        className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
                      >
                        <Check size={16} />
                        <span>Concluir Preparo</span>
                      </button>
                    </div>
                  </div>
                );
              })}
              {preparando.length === 0 && (
                <div className="p-8 text-center text-xs text-gray-400 font-medium">
                  Cozinha liberada
                </div>
              )}
            </div>
          </div>

          {/* Coluna 3: Prontos */}
          <div className={`bg-emerald-50/40 p-3.5 rounded-2xl border border-emerald-200/80 space-y-3 ${kitchenTab !== "ALL" && kitchenTab !== "PRONTO" ? "hidden md:block" : "block"}`}>
            <div className="flex items-center justify-between px-1">
              <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-800">
                ✅ Prontos / Expedição ({prontos.length})
              </span>
            </div>

            <div className="space-y-3">
              {prontos.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-emerald-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-black text-lg text-gray-900 leading-tight">
                        {order.customerName || `Pedido #${order.code.replace(/^#+/, "")}`}
                      </div>
                      <div className="text-xs font-bold text-emerald-600 mt-0.5">
                        #{order.code.replace(/^#+/, "")}
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800">
                      {order.type} {order.tableNumber ? `• MESA ${order.tableNumber}` : ""}
                    </span>
                  </div>

                  <div className="text-xs text-gray-600">
                    {order.customerName ? `Cliente: ${order.customerName}` : "Pedido pronto para entrega ou balcão."}
                    {order.customerPhone && (
                      <div className="text-[11px] text-gray-500 font-semibold">{order.customerPhone}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handlePrintKitchen(order)}
                      className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all"
                      title="Reimprimir comanda"
                    >
                      <Printer size={16} />
                    </button>

                    {order.customerPhone ? (
                      <a
                        href={`https://wa.me/55${order.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                          `Olá, ${order.customerName || "Cliente"}! 🛵 Seu pedido *#${order.code}* na *Central Lanches* acabou de ficar pronto e ${order.type === "DELIVERY" ? "saiu para entrega com o motoboy!" : "já pode ser retirado no balcão!"} Bom apetite!`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1 active:scale-95 transition-all shadow-sm"
                        title="Avisar cliente no WhatsApp"
                      >
                        <span>Avisar WhatsApp</span>
                      </a>
                    ) : null}

                    <button
                      onClick={() => updateStatus(order.id, "ENTREGUE")}
                      className="flex-1 py-2.5 rounded-xl font-black text-xs bg-gray-900 hover:bg-black text-white active:scale-95 transition-all"
                    >
                      Concluir
                    </button>
                  </div>
                </div>
              ))}
              {prontos.length === 0 && (
                <div className="p-8 text-center text-xs text-gray-400 font-medium">
                  Nenhum pedido aguardando retirada
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
