"use client";

import { useEffect, useState } from "react";
import { formatCurrency, createWhatsAppLink } from "@/lib/utils";
import { Bike, Navigation, Phone, CheckCircle2, MessageSquare, RefreshCw } from "lucide-react";

export default function MotoboyPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadDeliveries() {
    try {
      setLoading(true);
      const res = await fetch("/api/orders?type=DELIVERY&limit=30");
      const data = await res.json();
      // Mostra apenas os que estão em entrega ou prontos
      const filtered = (data.orders || []).filter(
        (o: any) => o.status === "SAIU_ENTREGA" || o.status === "PRONTO"
      );
      setDeliveries(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDeliveries();
    const interval = setInterval(loadDeliveries, 10000);
    return () => clearInterval(interval);
  }, []);

  async function markDelivered(id: string) {
    if (!confirm("Confirmar que a entrega foi realizada com sucesso?")) return;
    try {
      await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ENTREGUE" }),
      });
      loadDeliveries();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-20 max-w-lg mx-auto">
      {/* Topo Mobile */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold">
            <Bike size={22} />
          </div>
          <div>
            <h1 className="font-extrabold text-gray-900 text-base leading-tight">Painel do Motoboy</h1>
            <p className="text-[11px] text-gray-500 font-medium">Rotas e Entregas Rápidas</p>
          </div>
        </div>
        <button
          onClick={loadDeliveries}
          className="p-2 text-gray-500 hover:text-primary active:scale-95 transition-all"
        >
          <RefreshCw size={18} className={loading ? "animate-spin text-primary" : ""} />
        </button>
      </div>

      {/* Lista de Entregas Pendentes */}
      <div className="space-y-3">
        {deliveries.map((order) => {
          const mapsUrl = order.deliveryAddress
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`
            : "#";

          const waChegando = `Olá, ${order.customerName || "Cliente"}! Sou o entregador da Central Lanches 🛵, acabei de chegar no seu endereço com o pedido #${order.code}!`;
          const waLink = order.customerPhone ? createWhatsAppLink(order.customerPhone, waChegando) : "#";

          return (
            <div
              key={order.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/90 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-lg text-gray-900">#{order.code}</span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    order.status === "SAIU_ENTREGA"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {order.status === "SAIU_ENTREGA" ? "EM ROTA" : "AGUARDANDO RETIRADA"}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="font-bold text-gray-900 text-sm">
                  {order.customerName || "Cliente Sem Nome"}
                </div>
                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 font-medium text-gray-700">
                  📍 {order.deliveryAddress || "Endereço não informado"}
                </div>
              </div>

              {/* Botões de Ação Imediata para o Motoboy */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {order.deliveryAddress && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <Navigation size={15} />
                    <span>Abrir GPS</span>
                  </a>
                )}

                {order.customerPhone ? (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <MessageSquare size={15} />
                    <span>Avisar no Zap</span>
                  </a>
                ) : (
                  <div className="text-center text-[10px] text-gray-400 self-center">Sem telefone</div>
                )}
              </div>

              {/* Informações de Pagamento / Cobrança */}
              <div className="p-2.5 bg-red-50 rounded-xl flex justify-between items-center text-xs">
                <span className="font-bold text-gray-700">
                  Cobrar ({order.paymentMethod}):
                </span>
                <span className="font-black text-sm text-primary">
                  {formatCurrency(order.total)}
                </span>
              </div>

              {/* Confirmar Entrega */}
              <button
                onClick={() => markDelivered(order.id)}
                className="w-full py-2.5 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
              >
                <CheckCircle2 size={16} />
                <span>Confirmar Entrega Realizada</span>
              </button>
            </div>
          );
        })}

        {deliveries.length === 0 && !loading && (
          <div className="bg-white p-12 text-center text-gray-400 rounded-2xl border border-dashed border-gray-200">
            <Bike size={44} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-bold text-gray-700">Nenhuma entrega no momento</p>
            <p className="text-xs text-gray-400 mt-1">Os novos pedidos com entrega aparecerão aqui automaticamente.</p>
          </div>
        )}
      </div>
    </div>
  );
}
