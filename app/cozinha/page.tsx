"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { formatTime } from "@/lib/utils";
import { ChefHat, Clock, Check, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";

export default function CozinhaPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchKitchenOrders() {
    try {
      const res = await fetch("/api/orders?status=NOVO&limit=50");
      const d1 = await res.json();
      const res2 = await fetch("/api/orders?status=PREPARANDO&limit=50");
      const d2 = await res2.json();
      const res3 = await fetch("/api/orders?status=PRONTO&limit=20");
      const d3 = await res3.json();

      const combined = [
        ...(d1.orders || []),
        ...(d2.orders || []),
        ...(d3.orders || []),
      ];
      setOrders(combined);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Polling automático a cada 5 segundos
  useEffect(() => {
    fetchKitchenOrders();
    const interval = setInterval(fetchKitchenOrders, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const novos = orders.filter((o) => o.status === "NOVO");
  const preparando = orders.filter((o) => o.status === "PREPARANDO");
  const prontos = orders.filter((o) => o.status === "PRONTO");

  function isDelayed(createdAt: string) {
    const diffMin = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60);
    return diffMin > 25; // mais de 25 minutos
  }

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
              <span className="text-xs text-gray-500">Atualização em tempo real (a cada 5s)</span>
            </div>
          </div>
          <button
            onClick={fetchKitchenOrders}
            className="p-2 text-gray-500 hover:text-primary rounded-xl hover:bg-gray-100 transition-all"
            title="Atualizar agora"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Quadro Kanban em 3 Colunas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 items-start">
          {/* Coluna 1: Novos */}
          <div className="bg-gray-100/80 p-3.5 rounded-2xl border border-gray-200/80 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="font-extrabold text-xs uppercase tracking-wider text-gray-600">
                🟡 Novos ({novos.length})
              </span>
            </div>

            <div className="space-y-3">
              {novos.map((order) => (
                <div
                  key={order.id}
                  className={`bg-white rounded-xl p-4 shadow-sm border space-y-3 transition-all ${
                    isDelayed(order.createdAt)
                      ? "border-red-500 ring-2 ring-red-100"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-base text-gray-900">{order.code}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                      {order.type} {order.tableNumber ? `#${order.tableNumber}` : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock size={14} />
                    <span>Recebido às {formatTime(order.createdAt)}</span>
                  </div>

                  {/* Itens */}
                  <div className="space-y-1.5 border-t border-b border-gray-100 py-2">
                    {order.items?.map((it: any) => (
                      <div key={it.id} className="text-sm">
                        <div className="font-bold text-gray-800">
                          {it.quantity}x {it.productName}
                        </div>
                        {it.notes && (
                          <div className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded mt-0.5">
                            Obs: {it.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => updateStatus(order.id, "PREPARANDO")}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
                  >
                    <span>Iniciar Preparo</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))}
              {novos.length === 0 && (
                <div className="p-8 text-center text-xs text-gray-400 font-medium">
                  Nenhum pedido aguardando
                </div>
              )}
            </div>
          </div>

          {/* Coluna 2: Em Preparo */}
          <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="font-extrabold text-xs uppercase tracking-wider text-amber-800">
                🔥 Em Preparo ({preparando.length})
              </span>
            </div>

            <div className="space-y-3">
              {preparando.map((order) => (
                <div
                  key={order.id}
                  className={`bg-white rounded-xl p-4 shadow-sm border space-y-3 transition-all ${
                    isDelayed(order.createdAt)
                      ? "border-red-500 ring-2 ring-red-100"
                      : "border-amber-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-base text-gray-900">{order.code}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                      {order.type} {order.tableNumber ? `#${order.tableNumber}` : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock size={14} />
                    <span>Iniciado às {formatTime(order.updatedAt)}</span>
                  </div>

                  {/* Itens */}
                  <div className="space-y-1.5 border-t border-b border-gray-100 py-2">
                    {order.items?.map((it: any) => (
                      <div key={it.id} className="text-sm">
                        <div className="font-bold text-gray-800">
                          {it.quantity}x {it.productName}
                        </div>
                        {it.notes && (
                          <div className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded mt-0.5">
                            Obs: {it.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => updateStatus(order.id, "PRONTO")}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
                  >
                    <Check size={14} />
                    <span>Marcar como Pronto</span>
                  </button>
                </div>
              ))}
              {preparando.length === 0 && (
                <div className="p-8 text-center text-xs text-gray-400 font-medium">
                  Cozinha liberada
                </div>
              )}
            </div>
          </div>

          {/* Coluna 3: Prontos */}
          <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200/80 space-y-3">
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
                    <span className="font-black text-base text-gray-900">{order.code}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      {order.type} {order.tableNumber ? `#${order.tableNumber}` : ""}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500">
                    Pronto para entrega ou retirada no balcão.
                  </div>

                  <button
                    onClick={() => updateStatus(order.id, "ENTREGUE")}
                    className="w-full py-2 rounded-xl font-bold text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 active:scale-95 transition-all"
                  >
                    Finalizar e Arquivar
                  </button>
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
