"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { formatCurrency, createWhatsAppLink } from "@/lib/utils";
import { printReceipt } from "@/lib/print";
import { Bike, Phone, MapPin, Send, CheckCircle2, Navigation, Printer } from "lucide-react";

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<{ [orderId: string]: string }>({});
  const [settlementModal, setSettlementModal] = useState(false);

  // Lista padrão de entregadores
  const driverList = ["Carlos Motoboy", "Marcos Entrega", "Lucas Express", "Outro Entregador"];

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

  async function updateStatus(id: string, status: string, driver?: string) {
    try {
      await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, deliveryDriver: driver }),
      });
      loadDeliveries();
    } catch (e) {
      console.error(e);
    }
  }

  function handlePrintDelivery(order: any) {
    printReceipt({
      code: order.code,
      type: "DELIVERY",
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
    }, "DELIVERY");
  }

  return (
    <AdminShell>
      <div className="p-4 md:p-6 space-y-4 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 text-primary">
              <Bike size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">
                Painel do Entregador & Delivery
              </h1>
              <span className="text-xs text-gray-500">Roteamento GPS, mensagens e despacho de motoboys</span>
            </div>
          </div>
          <button
            onClick={() => setSettlementModal(true)}
            className="px-4 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black hover:bg-gray-800 transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <span>Acerto de Turno dos Motoboys</span>
          </button>
        </div>

        {/* Lista de Pedidos Delivery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deliveries.map((order) => {
            const mapsUrl = order.deliveryAddress
              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`
              : "#";

            const waMsgPreparo = `Olá, ${order.customerName || "Cliente"}! Seu pedido #${order.code} da Central Lanches está sendo preparado na chapa com capricho! 🍔🍟`;
            const waLinkPreparo = order.customerPhone ? createWhatsAppLink(order.customerPhone, waMsgPreparo) : "#";

            const waMsgSaiu = `Olá, ${order.customerName || "Cliente"}! Seu pedido #${order.code} acabou de sair para entrega com nosso motoboy! 🛵💨`;
            const waLinkSaiu = order.customerPhone ? createWhatsAppLink(order.customerPhone, waMsgSaiu) : "#";

            const waMsgChegando = `Olá, ${order.customerName || "Cliente"}! Sou o entregador da Central Lanches 🛵, acabei de chegar no seu endereço com o pedido #${order.code}!`;
            const waLinkChegando = order.customerPhone ? createWhatsAppLink(order.customerPhone, waMsgChegando) : "#";

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-base text-gray-900">#{order.code}</span>
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

                  <div className="space-y-1.5 text-xs text-gray-600">
                    <div className="font-bold text-gray-900 text-sm">{order.customerName || "Cliente Sem Nome"}</div>
                    {order.customerPhone && (
                      <div className="flex items-center gap-1.5 text-gray-500 font-semibold">
                        <Phone size={13} />
                        <span>{order.customerPhone}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-1.5 text-gray-600 bg-gray-50 p-2 rounded-xl">
                      <MapPin size={15} className="flex-shrink-0 mt-0.5 text-red-500" />
                      <span className="font-medium">{order.deliveryAddress || "Endereço não informado"}</span>
                    </div>
                  </div>

                  {/* Ações de Rota GPS e Impressão de Via */}
                  <div className="flex gap-2 pt-1">
                    {order.deliveryAddress && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Navigation size={14} />
                        <span>Abrir GPS / Rota</span>
                      </a>
                    )}
                    <button
                      onClick={() => handlePrintDelivery(order)}
                      className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                      title="Imprimir comanda de entrega"
                    >
                      <Printer size={14} />
                    </button>
                  </div>

                  {/* Itens */}
                  <div className="bg-gray-50/80 p-2.5 rounded-xl text-xs space-y-1">
                    {order.items?.map((it: any) => (
                      <div key={it.id} className="flex justify-between">
                        <span>{it.quantity}x {it.productName}</span>
                        <span className="font-semibold">{formatCurrency(it.totalPrice)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-black text-gray-900 border-t border-gray-200 pt-1.5 mt-1.5">
                      <span>Total c/ Frete ({order.paymentMethod}):</span>
                      <span className="text-primary font-black text-sm">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-100">
                  {order.customerPhone && (
                    <div className="flex gap-1.5 flex-wrap">
                      <a
                        href={waLinkSaiu}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center gap-1 transition-all"
                        title="Avisar cliente que saiu para entrega"
                      >
                        <Send size={12} />
                        <span>Zap: Saiu p/ Entrega</span>
                      </a>
                      <a
                        href={waLinkChegando}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center gap-1 transition-all"
                        title="Avisar cliente que o motoboy chegou no portão"
                      >
                        <Send size={12} />
                        <span>Zap: Cheguei!</span>
                      </a>
                    </div>
                  )}

                  {/* Atribuição de Motoboy */}
                  <div className="bg-gray-50 p-2.5 rounded-xl space-y-1.5 border border-gray-100">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-500">
                      <span>Entregador / Motoboy:</span>
                      {order.deliveryDriver && (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-extrabold">
                          {order.deliveryDriver}
                        </span>
                      )}
                    </div>
                    {order.status !== "ENTREGUE" && (
                      <select
                        value={selectedDriver[order.id] || order.deliveryDriver || ""}
                        onChange={(e) =>
                          setSelectedDriver((prev) => ({ ...prev, [order.id]: e.target.value }))
                        }
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-bold text-gray-800 focus:outline-none focus:border-primary"
                      >
                        <option value="">Selecione o Motoboy...</option>
                        {driverList.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {order.status !== "SAIU_ENTREGA" && order.status !== "ENTREGUE" && (
                      <button
                        onClick={() =>
                          updateStatus(
                            order.id,
                            "SAIU_ENTREGA",
                            selectedDriver[order.id] || order.deliveryDriver
                          )
                        }
                        className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
                      >
                        Despachar Motoboy
                      </button>
                    )}
                    {order.status !== "ENTREGUE" && (
                      <button
                        onClick={() =>
                          updateStatus(
                            order.id,
                            "ENTREGUE",
                            selectedDriver[order.id] || order.deliveryDriver
                          )
                        }
                        className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
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
              <p className="text-sm font-semibold">Nenhuma entrega pendente no momento</p>
            </div>
          )}
        </div>
        {/* Modal de Acerto de Turno dos Motoboys */}
        {settlementModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-lg text-gray-900">Acerto de Contas dos Motoboys</h3>
                  <p className="text-xs text-gray-500">Resumo de corridas e valores a repassar no turno</p>
                </div>
                <button
                  onClick={() => setSettlementModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {driverList.map((driverName) => {
                  const driverOrders = deliveries.filter(
                    (o) => o.deliveryDriver === driverName && o.status === "ENTREGUE"
                  );
                  const totalFees = driverOrders.reduce((acc, o) => acc + (o.deliveryFee || 0), 0);
                  const cashCollected = driverOrders
                    .filter((o) => o.paymentMethod === "DINHEIRO")
                    .reduce((acc, o) => acc + o.total, 0);

                  return (
                    <div
                      key={driverName}
                      className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-2"
                    >
                      <div className="flex items-center justify-between font-black text-sm text-gray-900">
                        <span>{driverName}</span>
                        <span className="text-xs bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                          {driverOrders.length} corrida(s)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div className="bg-white p-2 rounded-xl border border-gray-100">
                          <span className="text-gray-400 block text-[10px] font-bold uppercase">Taxas a Pagar</span>
                          <span className="font-extrabold text-blue-600 text-sm">
                            {formatCurrency(totalFees)}
                          </span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-gray-100">
                          <span className="text-gray-400 block text-[10px] font-bold uppercase">Dinheiro na Mão</span>
                          <span className="font-extrabold text-emerald-600 text-sm">
                            {formatCurrency(cashCollected)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSettlementModal(false)}
                  className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all shadow-sm"
                >
                  Fechar Acerto
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
