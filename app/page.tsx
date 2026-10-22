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

  return (
    <AdminShell>
      <div className="p-4 md:p-8 space-y-6 max-w-7xl">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Painel Geral</h1>
            <p className="text-sm text-gray-500">Métricas em tempo real do caixa, pedidos e vendas</p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-sm self-start sm:self-auto"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-primary" : ""} />
            Atualizar
          </button>
        </div>

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

        {/* Gráfico de Vendas por Hora */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
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
      </div>
    </AdminShell>
  );
}
