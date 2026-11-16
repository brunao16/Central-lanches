"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, X, ExternalLink, Volume2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { playOrderSound } from "@/lib/sound";

interface NotificationOrder {
  id: string;
  code: string;
  customerName?: string;
  total: number;
  type: string;
  items: Array<{ quantity: number; productName: string }>;
}

export default function GlobalOrderNotifier() {
  const [activeAlert, setActiveAlert] = useState<NotificationOrder | null>(null);
  const [soundUnlocked, setSoundUnlocked] = useState(false);
  const lastKnownIdRef = useRef<string | null>(null);
  const isFirstCheckRef = useRef(true);

  // Desbloqueia áudio no primeiro clique do usuário em qualquer lugar da tela
  useEffect(() => {
    function handleUserGesture() {
      setSoundUnlocked(true);
      window.removeEventListener("click", handleUserGesture);
      window.removeEventListener("keydown", handleUserGesture);
    }
    window.addEventListener("click", handleUserGesture);
    window.addEventListener("keydown", handleUserGesture);
    return () => {
      window.removeEventListener("click", handleUserGesture);
      window.removeEventListener("keydown", handleUserGesture);
    };
  }, []);

  // Polling a cada 4 segundos buscando novos pedidos
  useEffect(() => {
    let isMounted = true;

    async function checkForNewOrders() {
      try {
        const res = await fetch("/api/orders?status=NOVO&limit=5");
        if (!res.ok) return;
        const data = await res.json();
        const orders: NotificationOrder[] = data.orders || [];

        if (orders.length > 0) {
          const newest = orders[0];

          if (isFirstCheckRef.current) {
            lastKnownIdRef.current = newest.id;
            isFirstCheckRef.current = false;
            return;
          }

          // Se chegou um pedido diferente do último conhecido
          if (newest.id !== lastKnownIdRef.current) {
            lastKnownIdRef.current = newest.id;

            if (isMounted) {
              setActiveAlert(newest);
              playOrderSound();

              // Se o navegador tiver permissão de notificação nativa do sistema
              if (typeof window !== "undefined" && "Notification" in window) {
                if (Notification.permission === "granted") {
                  new Notification("🍔 Novo Pedido Central Lanches!", {
                    body: `Pedido #${newest.code} - ${newest.customerName || "Cliente"} (${formatCurrency(newest.total)})`,
                    icon: "/favicon.svg",
                  });
                } else if (Notification.permission === "default") {
                  Notification.requestPermission();
                }
              }
            }
          }
        }
      } catch (err) {
        // silencioso
      }
    }

    checkForNewOrders();
    const interval = setInterval(checkForNewOrders, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!activeAlert) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full animate-in slide-in-from-top-4 duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-red-500 p-4 text-gray-900 flex flex-col gap-3 relative overflow-hidden">
        {/* Barra superior de destaque piscando */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-pulse" />

        <div className="flex items-start justify-between gap-2 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black animate-bounce shadow-md shadow-red-200">
              <Bell size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-red-600 tracking-wider bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                NOVO PEDIDO CHEGOU!
              </span>
              <h4 className="font-black text-lg text-gray-900 leading-tight mt-0.5">
                #{activeAlert.code} • {activeAlert.customerName || "Cliente"}
              </h4>
            </div>
          </div>
          <button
            onClick={() => setActiveAlert(null)}
            className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Resumo dos itens */}
        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs space-y-1">
          <div className="font-semibold text-gray-600 line-clamp-2">
            {activeAlert.items?.map((it) => `${it.quantity}x ${it.productName}`).join(", ") || "Itens do pedido"}
          </div>
          <div className="flex items-center justify-between font-black text-gray-900 pt-1 border-t border-gray-200/60">
            <span>Tipo: {activeAlert.type}</span>
            <span className="text-red-600 text-sm">{formatCurrency(activeAlert.total)}</span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 pt-1">
          <a
            href="/cozinha"
            onClick={() => setActiveAlert(null)}
            className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black text-center shadow-md shadow-red-100 transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>Ver na Cozinha</span>
            <ExternalLink size={14} />
          </a>
          <button
            onClick={() => {
              playOrderSound();
              setActiveAlert(null);
            }}
            className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            Dispensar
          </button>
        </div>
      </div>
    </div>
  );
}
