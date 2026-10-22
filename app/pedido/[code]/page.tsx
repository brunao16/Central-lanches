"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Clock, CheckCircle2, Bike, ChefHat, AlertCircle } from "lucide-react";

export default function AcompanharPedidoPage() {
  const params = useParams();
  const code = params.code as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadOrder() {
    try {
      const res = await fetch(`/api/public/order/${encodeURIComponent(code)}`);
      const d = await res.json();
      setOrder(d.order);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
    const interval = setInterval(loadOrder, 8000);
    return () => clearInterval(interval);
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-sm font-bold text-gray-500">Buscando seu pedido...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-3 shadow-md">
          <AlertCircle size={36} className="mx-auto text-amber-500" />
          <h2 className="font-extrabold text-lg text-gray-900">Pedido não encontrado</h2>
          <p className="text-xs text-gray-500">Verifique se o código informado está correto.</p>
        </div>
      </div>
    );
  }

  const steps = [
    { key: "NOVO", label: "Recebido", desc: "Pedido registrado no sistema" },
    { key: "PREPARANDO", label: "Em Preparo", desc: "Cozinha preparando seus lanches" },
    { key: "PRONTO", label: "Pronto", desc: "Pronto para entrega ou retirada" },
    { key: "SAIU_ENTREGA", label: "A Caminho", desc: "Saiu com o entregador" },
    { key: "ENTREGUE", label: "Concluído", desc: "Entregue e finalizado" },
  ];

  const currentIdx = steps.findIndex((s) => s.key === order.status);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-md mx-auto space-y-5">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Status do Pedido</span>
          <h1 className="text-3xl font-black text-gray-900">{order.code}</h1>
          <p className="text-xs text-gray-500">
            Feito por <strong>{order.customerName || "Cliente"}</strong> às {formatDateTime(order.createdAt)}
          </p>
        </div>

        {/* Linha do Tempo dos Passos */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
          <h3 className="font-black text-sm text-gray-900">Acompanhamento em Tempo Real</h3>
          <div className="space-y-4">
            {steps.map((st, idx) => {
              const isPast = currentIdx >= idx;
              const isCurrent = currentIdx === idx;
              return (
                <div key={st.key} className="flex items-start gap-3.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                      isCurrent
                        ? "bg-primary text-white ring-4 ring-red-100"
                        : isPast
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {isPast && !isCurrent ? "✓" : idx + 1}
                  </div>
                  <div>
                    <div className={`font-bold text-sm ${isCurrent ? "text-primary" : "text-gray-900"}`}>
                      {st.label}
                    </div>
                    <div className="text-xs text-gray-500">{st.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detalhes do Pedido */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-3">
          <h3 className="font-black text-sm text-gray-900">Itens do Pedido</h3>
          <div className="divide-y divide-gray-100 text-xs">
            {order.items?.map((it: any, i: number) => (
              <div key={i} className="py-2.5 flex justify-between">
                <div>
                  <span className="font-bold text-gray-900">{it.quantity}x {it.productName}</span>
                  {it.notes && <div className="text-red-500 font-medium">Obs: {it.notes}</div>}
                </div>
                <span className="font-black text-gray-800">{formatCurrency(it.totalPrice)}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-gray-100 flex justify-between font-black text-sm">
            <span>Total:</span>
            <span className="text-primary">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
