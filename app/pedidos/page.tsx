"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Search, Printer, XCircle, CheckCircle } from "lucide-react";

export default function PedidosPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  async function loadOrders() {
    setLoading(true);
    try {
      const url = filterStatus === "all" ? "/api/orders?limit=100" : `/api/orders?status=${filterStatus}&limit=100`;
      const res = await fetch(url);
      const d = await res.json();
      setOrders(d.orders || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [filterStatus]);

  async function handleCancel(id: string) {
    const reason = prompt("Informe o motivo do cancelamento:");
    if (!reason) return;

    try {
      await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELADO", cancelReason: reason }),
      });
      loadOrders();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <AdminShell>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Histórico de Pedidos</h1>
            <p className="text-xs text-gray-500">Listagem completa de vendas e pedidos emitidos</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-primary shadow-sm"
            >
              <option value="all">Todos os Status</option>
              <option value="NOVO">Novos</option>
              <option value="PREPARANDO">Preparando</option>
              <option value="PRONTO">Prontos</option>
              <option value="ENTREGUE">Entregues</option>
              <option value="CANCELADO">Cancelados</option>
            </select>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Pedido</th>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Pagamento</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-black text-gray-900">{o.code}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">{formatDateTime(o.createdAt)}</td>
                    <td className="py-3 px-4 text-xs font-semibold text-gray-700">
                      {o.type} {o.tableNumber ? `#${o.tableNumber}` : ""}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div className="font-bold text-gray-800">{o.customerName || "Balcão"}</div>
                      {o.customerPhone && <div className="text-gray-400">{o.customerPhone}</div>}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-gray-600">{o.paymentMethod}</td>
                    <td className="py-3 px-4 font-black text-primary">{formatCurrency(o.total)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          o.status === "ENTREGUE"
                            ? "bg-emerald-100 text-emerald-800"
                            : o.status === "CANCELADO"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {o.status !== "CANCELADO" && (
                        <button
                          onClick={() => handleCancel(o.id)}
                          className="text-xs text-gray-400 hover:text-red-600 font-semibold transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
