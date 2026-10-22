"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { formatCurrency, createWhatsAppLink } from "@/lib/utils";
import { Bike, Phone, MapPin, Send, CheckCircle2, Clock } from "lucide-react";

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadDeliveries() {
    try {
      const res = await fetch("/api/orders?type=DELIVERY&limit=50");
      const d = await res.json();
      setDeliveries(d.orders || []);
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

  async function updateStatus(id: string, status: string) {
    try {
      await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      loadDeliveries();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <AdminShell>
      <div className="p-4 md:p-6 space-y-4 max-w-7xl">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 text-primary">
              <Bike size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">
                Gestão de Entregas & Motoboys
              </h1>
              <span className="text-xs text-gray-500">Controle de pedidos delivery e mensagens WhatsApp</span>
            </div>
          </div>
        </div>

        {/* Lista de Pedidos Delivery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deliveries.map((order) => {
            const waMsg = `Olá, ${order.customerName || "Cliente"}! Seu pedido ${order.code} da Central Lanches no valor de ${formatCurrency(order.total)} está: ${order.status === "SAIU_ENTREGA" ? "a caminho com o entregador! 🛵" : order.status}.`;
            const waLink = order.customerPhone ? createWhatsAppLink(order.customerPhone, waMsg) : "#";

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-base text-gray-900">{order.code}</span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        order.status === "ENTREGUE"
                          ? "bg-emerald-100 text-emerald-800"
                          : order.status === "SAIU_ENTREGA"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="font-bold text-gray-900">{order.customerName || "Cliente Sem Nome"}</div>
                    {order.customerPhone && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Phone size={13} />
                        <span>{order.customerPhone}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-1.5 text-gray-500">
                      <MapPin size={13} className="flex-shrink-0 mt-0.5 text-red-500" />
                      <span>{order.deliveryAddress || "Endereço não informado"}</span>
                    </div>
                  </div>

                  {/* Itens */}
                  <div className="bg-gray-50 p-2.5 rounded-xl text-xs space-y-1">
                    {order.items?.map((it: any) => (
                      <div key={it.id} className="flex justify-between">
                        <span>{it.quantity}x {it.productName}</span>
                        <span className="font-semibold">{formatCurrency(it.totalPrice)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-black text-gray-900 border-t border-gray-200 pt-1.5 mt-1.5">
                      <span>Total c/ Taxa:</span>
                      <span className="text-primary">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-100">
                  {order.customerPhone && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Send size={14} />
                      <span>Notificar no WhatsApp</span>
                    </a>
                  )}

                  <div className="flex gap-2">
                    {order.status !== "SAIU_ENTREGA" && order.status !== "ENTREGUE" && (
                      <button
                        onClick={() => updateStatus(order.id, "SAIU_ENTREGA")}
                        className="flex-1 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all"
                      >
                        Despachar
                      </button>
                    )}
                    {order.status !== "ENTREGUE" && (
                      <button
                        onClick={() => updateStatus(order.id, "ENTREGUE")}
                        className="flex-1 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all"
                      >
                        Confirmar Entrega
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {deliveries.length === 0 && (
            <div className="col-span-full bg-white p-12 text-center text-gray-400 rounded-2xl border border-dashed border-gray-200">
              <Bike size={40} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-semibold">Nenhuma entrega no momento</p>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
