"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { printReceipt } from "@/lib/print";
import { Search, Printer, XCircle, CheckCircle, ChefHat, Eye } from "lucide-react";

export default function PedidosPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

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

  function handlePrintOrder(order: any, target: "CUSTOMER" | "KITCHEN") {
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
        notes: order.notes,
      },
      target
    );
  }

  const filteredOrders = orders.filter((o) => {
    const term = search.toLowerCase();
    return (
      o.code.toLowerCase().includes(term) ||
      (o.customerName && o.customerName.toLowerCase().includes(term)) ||
      (o.customerPhone && o.customerPhone.includes(term))
    );
  });

  return (
    <AdminShell>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Histórico de Pedidos</h1>
            <p className="text-xs text-gray-500">Listagem completa e reimpressão de vias</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por código ou cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary shadow-xs"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-primary shadow-xs"
            >
              <option value="all">Todos os Status</option>
              <option value="NOVO">Novos</option>
              <option value="PREPARANDO">Preparando</option>
              <option value="PRONTO">Prontos</option>
              <option value="SAIU_ENTREGA">A Caminho</option>
              <option value="ENTREGUE">Entregues</option>
              <option value="CANCELADO">Cancelados</option>
            </select>
          </div>
        </div>

        {/* Tabela de Pedidos */}
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
                  <th className="py-3 px-4 text-right">Reimpressão & Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-black text-gray-900">#{o.code}</td>
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
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handlePrintOrder(o, "CUSTOMER")}
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all"
                          title="Reimprimir Via do Cliente / Entrega"
                        >
                          <Printer size={15} />
                        </button>
                        <button
                          onClick={() => handlePrintOrder(o, "KITCHEN")}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-all"
                          title="Reimprimir Comanda da Cozinha"
                        >
                          <ChefHat size={15} />
                        </button>
                        {o.status !== "CANCELADO" && (
                          <button
                            onClick={() => handleCancel(o.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Cancelar pedido"
                          >
                            <XCircle size={15} />
                          </button>
                        )}
                      </div>
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
