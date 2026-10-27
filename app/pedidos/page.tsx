"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { printReceipt } from "@/lib/print";
import { Search, Printer, XCircle, CheckCircle, ChefHat, Eye, Trash2, AlertOctagon } from "lucide-react";

export default function PedidosPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"day" | "week" | "month">("day");
  const [clearing, setClearing] = useState(false);

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

  async function handleClearHistory() {
    const periodLabel =
      selectedPeriod === "day"
        ? "DE HOJE"
        : selectedPeriod === "week"
        ? "DESTA SEMANA"
        : "DESTE MÊS";

    if (
      !confirm(
        `Tem certeza que deseja apagar o histórico ${periodLabel}? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    setClearing(true);
    try {
      const res = await fetch("/api/orders/clear-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: selectedPeriod }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao apagar histórico");
      }

      alert(
        `Histórico ${periodLabel} apagado com sucesso!\n• Pedidos removidos: ${data.deletedOrdersCount}\n• Movimentações de caixa: ${data.deletedMovementsCount}\n• Despesas removidas: ${data.deletedExpensesCount}`
      );
      setClearModalOpen(false);
      loadOrders();
    } catch (e: any) {
      alert(e.message || "Erro ao apagar histórico.");
    } finally {
      setClearing(false);
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
            <button
              onClick={() => setClearModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-xs"
              title="Apagar histórico do dia, semana ou mês"
            >
              <Trash2 size={14} />
              Apagar Histórico
            </button>

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

        {/* Modal de Limpeza de Histórico */}
        {clearModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-red-600">
                <div className="p-2.5 bg-red-100 rounded-xl">
                  <AlertOctagon size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base leading-tight">
                    Apagar Histórico
                  </h3>
                  <p className="text-xs text-gray-500">
                    Limpeza de pedidos, movimentações de caixa e despesas
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 font-medium">
                ⚠️ <strong>Atenção:</strong> Esta ação apagará permanentemente os registros do período selecionado.
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block">
                  Escolha o período que deseja apagar:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPeriod("day")}
                    className={`py-3 px-2 rounded-xl border text-xs font-extrabold transition-all ${
                      selectedPeriod === "day"
                        ? "bg-red-600 text-white border-red-600 shadow-sm"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPeriod("week")}
                    className={`py-3 px-2 rounded-xl border text-xs font-extrabold transition-all ${
                      selectedPeriod === "week"
                        ? "bg-red-600 text-white border-red-600 shadow-sm"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    Esta Semana
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPeriod("month")}
                    className={`py-3 px-2 rounded-xl border text-xs font-extrabold transition-all ${
                      selectedPeriod === "month"
                        ? "bg-red-600 text-white border-red-600 shadow-sm"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    Este Mês
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  disabled={clearing}
                  onClick={() => setClearModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={clearing}
                  onClick={handleClearHistory}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl transition-all shadow-md shadow-red-200 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  {clearing ? "Apagando..." : "Confirmar Exclusão"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Visualização Mobile em Cards para Celular */}
        <div className="md:hidden space-y-3">
          {filteredOrders.map((o) => (
            <div key={o.id} className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-black text-base text-gray-900">#{o.code}</span>
                  <div className="text-[11px] text-gray-400 font-medium">{formatDateTime(o.createdAt)}</div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    o.status === "ENTREGUE"
                      ? "bg-emerald-100 text-emerald-800"
                      : o.status === "CANCELADO"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {o.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                <div>
                  <div className="font-bold text-gray-800">{o.customerName || "Balcão"}</div>
                  <div className="text-gray-500">{o.type} {o.tableNumber ? `• Mesa #${o.tableNumber}` : ""} • {o.paymentMethod}</div>
                </div>
                <div className="font-black text-base text-primary">
                  {formatCurrency(o.total)}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrintOrder(o, "CUSTOMER")}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold"
                  >
                    <Printer size={13} />
                    <span>Via Cliente</span>
                  </button>
                  <button
                    onClick={() => handlePrintOrder(o, "KITCHEN")}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-800 rounded-xl text-xs font-bold"
                  >
                    <ChefHat size={13} />
                    <span>Cozinha</span>
                  </button>
                </div>
                {o.status !== "CANCELADO" && (
                  <button
                    onClick={() => handleCancel(o.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                    title="Cancelar pedido"
                  >
                    <XCircle size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {filteredOrders.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center text-xs text-gray-400">
              Nenhum pedido encontrado.
            </div>
          )}
        </div>

        {/* Tabela de Pedidos Desktop */}
        <div className="hidden md:block bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
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
