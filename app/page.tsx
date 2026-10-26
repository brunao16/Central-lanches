"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Trash2,
  AlertOctagon,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"day" | "week" | "month">("day");
  const [clearing, setClearing] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      const d = await res.json();
      setMetrics(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

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
      loadData();
    } catch (e: any) {
      alert(e.message || "Erro ao apagar histórico.");
    } finally {
      setClearing(false);
    }
  }

  return (
    <AdminShell>
      <div className="p-4 md:p-8 space-y-6 max-w-7xl">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Painel Geral</h1>
            <p className="text-sm text-gray-500">Métricas em tempo real do caixa, pedidos e vendas</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setClearModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 active:scale-95 transition-all shadow-xs"
              title="Apagar histórico de vendas, caixa e despesas por período"
            >
              <Trash2 size={15} />
              Apagar Histórico
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
            >
              <RefreshCw size={16} className={loading ? "animate-spin text-primary" : ""} />
              Atualizar
            </button>
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

        {/* Alertas */}
        {metrics?.alerts && (metrics.alerts.lowStockCount > 0 || metrics.alerts.delayedOrdersCount > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {metrics.alerts.delayedOrdersCount > 0 && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm font-medium">
                <Clock className="text-primary flex-shrink-0" size={20} />
                <span><strong>Atenção:</strong> {metrics.alerts.delayedOrdersCount} pedido(s) em preparo há mais de 30 minutos!</span>
              </div>
            )}
            {metrics.alerts.lowStockCount > 0 && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-medium">
                <AlertTriangle className="text-amber-600 flex-shrink-0" size={20} />
                <span><strong>Estoque baixo:</strong> {metrics.alerts.lowStockCount} insumo(s) abaixo do nível mínimo.</span>
              </div>
            )}
          </div>
        )}

        {/* Cards de Métricas Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Vendas Hoje</span>
              <div className="p-2 bg-red-50 text-primary rounded-xl">
                <DollarSign size={18} />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900">
              {formatCurrency(metrics?.dayRevenue || 0)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
              <ShoppingBag size={14} className="text-gray-400" />
              <span>{metrics?.dayOrdersCount || 0} pedidos concluídos hoje</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Ticket Médio</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900">
              {formatCurrency(metrics?.dayAverageTicket || 0)}
            </div>
            <div className="mt-1 text-xs text-gray-500">Valor médio gasto por cliente</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Vendas no Mês</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <ArrowUpRight size={18} />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900">
              {formatCurrency(metrics?.monthRevenue || 0)}
            </div>
            <div className="mt-1 text-xs text-gray-500">Acumulado do mês atual</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Lucro Estimado</span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <ArrowDownRight size={18} />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900">
              {formatCurrency(metrics?.estimatedProfit || 0)}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Gastos mês: {formatCurrency(metrics?.monthExpensesTotal || 0)}
            </div>
          </div>
        </div>

        {/* Grid: Gráfico de Vendas por Hora e Top Produtos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-gray-900">Vendas por Horário (Hoje)</h3>
              <p className="text-xs text-gray-500">Volume vendido em R$ em cada faixa de horário</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics?.hourlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip
                    formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, "Total"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                  />
                  <Bar dataKey="total" fill="#e8192c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top 5 Produtos Mais Pedidos Hoje */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-gray-900">Top 5 Mais Pedidos (Hoje)</h3>
              <p className="text-xs text-gray-500">Ranking por quantidade de itens vendidos</p>
            </div>

            <div className="space-y-3">
              {(metrics?.topProducts || []).map((p: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-red-100 text-red-700 font-black text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-gray-900 line-clamp-1">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-gray-900 block">{p.count}x</span>
                    <span className="text-[10px] text-gray-400 font-semibold">{formatCurrency(p.total)}</span>
                  </div>
                </div>
              ))}

              {(!metrics?.topProducts || metrics.topProducts.length === 0) && (
                <div className="py-8 text-center text-xs text-gray-400 font-medium">
                  Nenhum pedido finalizado hoje ainda.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
