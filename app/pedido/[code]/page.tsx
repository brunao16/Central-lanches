"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Clock, CheckCircle2, Bike, ChefHat, AlertCircle, ArrowLeft, Bell, Volume2 } from "lucide-react";
import Link from "next/link";

function playStatusSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    console.error(e);
  }
}

export default function AcompanharPedidoPage() {
  const params = useParams();
  const code = params.code as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdateToast, setStatusUpdateToast] = useState<string | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  async function loadOrder() {
    try {
      const res = await fetch(`/api/public/order/${encodeURIComponent(code)}`);
      const d = await res.json();
      const updatedOrder = d.order;
      if (updatedOrder) {
        if (prevStatusRef.current && prevStatusRef.current !== updatedOrder.status) {
          playStatusSound();
          const stepNames: Record<string, string> = {
            NOVO: "Pedido recebido!",
            PREPARANDO: "Seu pedido está sendo preparado na chapa! 🍔",
            PRONTO: "Pedido prontinho! 😋",
            SAIU_ENTREGA: "O motoboy acabou de sair com sua entrega! 🛵💨",
            ENTREGUE: "Pedido entregue com sucesso! Bom apetite! ❤️",
          };
          setStatusUpdateToast(stepNames[updatedOrder.status] || `Status atualizado para ${updatedOrder.status}`);
          setTimeout(() => setStatusUpdateToast(null), 6000);
        }
        prevStatusRef.current = updatedOrder.status;
        setOrder(updatedOrder);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
    const interval = setInterval(loadOrder, 6000);
    return () => clearInterval(interval);
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0f12] text-gray-100 flex items-center justify-center p-4">
        <div className="text-sm font-bold text-gray-400 animate-pulse">Buscando seu pedido...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0d0f12] text-gray-100 flex items-center justify-center p-4">
        <div className="bg-[#141820] rounded-3xl p-8 max-w-sm w-full text-center space-y-3 shadow-xl border border-gray-800">
          <AlertCircle size={36} className="mx-auto text-amber-500" />
          <h2 className="font-extrabold text-lg text-white">Pedido não encontrado</h2>
          <p className="text-xs text-gray-400">Verifique se o código informado está correto.</p>
          <Link
            href="/menu"
            className="inline-block mt-3 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold"
          >
            Voltar ao Cardápio
          </Link>
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
    <div className="min-h-screen bg-[#0d0f12] text-gray-100 p-4 md:p-8">
      <div className="max-w-md mx-auto space-y-4">
        <Link
          href="/menu"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors py-1"
        >
          <ArrowLeft size={16} />
          <span>Voltar ao Cardápio</span>
        </Link>

        {/* Notificação Sonora & Visual de Atualização do Pedido */}
        {statusUpdateToast && (
          <div className="bg-gradient-to-r from-red-600 to-amber-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-red-400/40">
            <div className="p-2 bg-white/20 rounded-xl">
              <Bell size={20} className="animate-spin" />
            </div>
            <div>
              <div className="font-black text-sm">Status Atualizado!</div>
              <div className="text-xs font-medium text-white/90">{statusUpdateToast}</div>
            </div>
          </div>
        )}

        <div className="bg-[#141820] rounded-3xl p-6 shadow-xl border border-gray-800 text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Status do Pedido</span>
          <h1 className="text-3xl font-black text-red-500">#{order.code}</h1>
          <p className="text-xs text-gray-400">
            Cliente: <strong className="text-white">{order.customerName || "Cliente"}</strong> • Feito às {formatDateTime(order.createdAt)}
          </p>
        </div>

        {/* Linha do Tempo dos Passos em Dark */}
        <div className="bg-[#141820] rounded-3xl p-6 shadow-xl border border-gray-800 space-y-5">
          <h3 className="font-black text-sm text-white">Acompanhamento em Tempo Real</h3>
          <div className="space-y-4">
            {steps.map((st, idx) => {
              const isPast = currentIdx >= idx;
              const isCurrent = currentIdx === idx;
              return (
                <div key={st.key} className="flex items-start gap-3.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                      isCurrent
                        ? "bg-red-600 text-white ring-4 ring-red-950"
                        : isPast
                        ? "bg-emerald-500 text-white"
                        : "bg-[#1b2029] text-gray-600 border border-gray-800"
                    }`}
                  >
                    {isPast && !isCurrent ? "✓" : idx + 1}
                  </div>
                  <div>
                    <div className={`font-bold text-sm ${isCurrent ? "text-red-400" : isPast ? "text-white" : "text-gray-500"}`}>
                      {st.label}
                    </div>
                    <div className="text-xs text-gray-400">{st.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detalhes do Pedido em Dark */}
        <div className="bg-[#141820] rounded-3xl p-6 shadow-xl border border-gray-800 space-y-3">
          <h3 className="font-black text-sm text-white">Itens do Pedido</h3>
          <div className="divide-y divide-gray-800/80 text-xs">
            {order.items?.map((it: any, i: number) => (
              <div key={i} className="py-2.5 flex justify-between">
                <div>
                  <span className="font-bold text-gray-200">{it.quantity}x {it.productName}</span>
                  {it.notes && (
                    <div className="text-[11px] text-amber-300 font-black uppercase bg-amber-950/60 border border-amber-600/50 px-2 py-0.5 rounded mt-1 inline-block tracking-wide">
                      OBS: {it.notes.toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="font-black text-gray-300">{formatCurrency(it.totalPrice)}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-gray-800 flex justify-between font-black text-sm">
            <span>Total:</span>
            <span className="text-red-500">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
