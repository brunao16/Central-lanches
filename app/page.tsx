"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  Bike,
  ChefHat,
  UtensilsCrossed,
  Sparkles,
  Layers,
  CreditCard,
  QrCode,
  Banknote,
  ArrowRight,
  CheckCircle2,
  Lock,
  Unlock,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
  const [chartMode, setChartMode] = useState<"revenue" | "orders">("revenue");

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
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
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
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Banner de Boas-vindas Moderno com Acesso Rápido */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-950 via-gray-900 to-red-950 p-6 md:p-8 text-white shadow-xl border border-gray-800">
          <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
          <div className="absolute right-12 bottom-0 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-red-200 border border-white/10">
                <Sparkles size={13} className="text-amber-400" />
                <span>Central Lanches • Painel de Gestão</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                Visão Geral da Operação
              </h1>
              <p className="text-xs md:text-sm text-gray-300 max-w-xl">
                Acompanhe o faturamento em tempo real, pedidos na chapa, fluxo de caixa e ranking de lanches mais vendidos.
              </p>
            </div>

            {/* Ações Rápidas no Topo */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/caixa"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-black shadow-lg shadow-red-600/30 active:scale-95 transition-all"
              >
                <ShoppingBag size={15} />
                <span>Abrir Caixa / PDV</span>
              </Link>
              <Link
                href="/cozinha"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-xs font-black backdrop-blur-md active:scale-95 transition-all"
              >
                <ChefHat size={15} />
                <span>Cozinha KDS</span>
              </Link>
              <button
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white/5 hover:bg-white/15 text-gray-200 border border-white/10 rounded-xl text-xs font-bold backdrop-blur-md active:scale-95 transition-all"
                title="Atualizar dados agora"
              >
                <RefreshCw size={14} className={loading ? "animate-spin text-red-400" : ""} />
              </button>
              <button
                onClick={() => setClearModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/50 rounded-xl text-xs font-bold transition-all"
                title="Limpar histórico antigo"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal de Limpeza de Histórico */}
        {clearModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-red-600">
                <div className="p-2.5 bg-red-100 rounded-2xl">
                  <AlertOctagon size={24} />
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

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 font-medium">
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
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={clearing}
                  onClick={handleClearHistory}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl transition-all shadow-md shadow-red-200 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  {clearing ? "Apagando..." : "Confirmar Exclusão"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alertas Ativos */}
        {metrics?.alerts && (metrics.alerts.lowStockCount > 0 || metrics.alerts.delayedOrdersCount > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {metrics.alerts.delayedOrdersCount > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50/80 border border-red-200 text-red-900 text-xs font-bold shadow-xs">
                <div className="p-2 bg-red-100 text-primary rounded-xl">
                  <Clock size={18} />
                </div>
                <span><strong>Atenção:</strong> {metrics.alerts.delayedOrdersCount} pedido(s) em preparo há mais de 30 minutos na Cozinha!</span>
              </div>
            )}
            {metrics.alerts.lowStockCount > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs font-bold shadow-xs">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                  <AlertTriangle size={18} />
                </div>
                <span><strong>Estoque baixo:</strong> {metrics.alerts.lowStockCount} insumo(s) atingiram a quantidade mínima.</span>
              </div>
            )}
          </div>
        )}

        {/* Cards de Métricas Principais (Estilo Fluido e Moderno) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Vendas Hoje */}
          <div className="group relative overflow-hidden bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">Vendas Hoje</span>
              <div className="p-2.5 bg-red-50 text-primary rounded-2xl group-hover:scale-110 transition-transform">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              {formatCurrency(metrics?.dayRevenue || 0)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
              <span className="flex items-center gap-1 font-bold text-gray-700">
                <ShoppingBag size={13} className="text-primary" />
                {metrics?.dayOrdersCount || 0} pedidos
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Em tempo real
              </span>
            </div>
          </div>

          {/* Card 2: Ticket Médio */}
          <div className="group relative overflow-hidden bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">Ticket Médio</span>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              {formatCurrency(metrics?.dayAverageTicket || 0)}
            </div>
            <div className="mt-2 text-xs text-gray-500 pt-2 border-t border-gray-100 flex items-center justify-between">
              <span>Média por pedido hoje</span>
              <span className="font-bold text-gray-700">Lanches & Bebidas</span>
            </div>
          </div>

          {/* Card 3: Vendas no Mês */}
          <div className="group relative overflow-hidden bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">Vendas no Mês</span>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                <ArrowUpRight size={20} />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              {formatCurrency(metrics?.monthRevenue || 0)}
            </div>
            <div className="mt-2 text-xs text-gray-500 pt-2 border-t border-gray-100 flex items-center justify-between">
              <span>Semana: <strong>{formatCurrency(metrics?.weekRevenue || 0)}</strong></span>
              <span className="text-[11px] font-semibold text-emerald-600">Acumulado</span>
            </div>
          </div>

          {/* Card 4: Status do Caixa & Lucro */}
          <div className="group relative overflow-hidden bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">Status do Caixa</span>
              <div
                className={`p-2.5 rounded-2xl group-hover:scale-110 transition-transform ${
                  metrics?.isRegisterOpen ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                }`}
              >
                {metrics?.isRegisterOpen ? <Unlock size={20} /> : <Lock size={20} />}
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              {metrics?.isRegisterOpen ? "Caixa Aberto" : "Caixa Fechado"}
            </div>
            <div className="mt-2 text-xs text-gray-500 pt-2 border-t border-gray-100 flex items-center justify-between">
              <span>{metrics?.isRegisterOpen ? `Fundo: ${formatCurrency(metrics?.registerInitial || 0)}` : "Aguardando abertura"}</span>
              <Link href="/caixa" className="font-bold text-primary hover:underline">
                Ir ao PDV →
              </Link>
            </div>
          </div>
        </div>

        {/* Linha 2: Gráfico de Vendas por Hora com alternância R$ e Pedidos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 md:p-7 rounded-3xl border border-gray-200/80 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-lg text-gray-900 tracking-tight">
                  Horários de Pico (Hoje)
                </h3>
                <p className="text-xs text-gray-500">Distribuição das vendas e movimento por hora</p>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-2xl">
                <button
                  onClick={() => setChartMode("revenue")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    chartMode === "revenue"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Faturamento (R$)
                </button>
                <button
                  onClick={() => setChartMode("orders")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    chartMode === "orders"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Quantidade Pedidos
                </button>
              </div>
            </div>

            <div className="h-68 w-full pt-2">
              <ResponsiveContainer width="100%" height={260}>
                {chartMode === "revenue" ? (
                  <AreaChart data={metrics?.hourlyData || []}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e8192c" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#e8192c" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, "Vendas"]}
                      contentStyle={{ borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                    />
                    <Area type="monotone" dataKey="total" stroke="#e8192c" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                  </AreaChart>
                ) : (
                  <BarChart data={metrics?.hourlyData || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value: any) => [`${value} pedidos`, "Pedidos"]}
                      contentStyle={{ borderRadius: 16, border: "1px solid #e2e8f0" }}
                    />
                    <Bar dataKey="pedidos" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Formas de Pagamento & Canais */}
          <div className="bg-white p-6 md:p-7 rounded-3xl border border-gray-200/80 shadow-sm space-y-5 flex flex-col justify-between">
            <div>
              <h3 className="font-black text-lg text-gray-900 tracking-tight">Recebimento Hoje</h3>
              <p className="text-xs text-gray-500">Valores faturados por modalidade</p>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                    <QrCode size={16} />
                  </div>
                  <span className="text-xs font-bold text-gray-900">Pix</span>
                </div>
                <span className="text-xs font-black text-emerald-700">
                  {formatCurrency(metrics?.paymentStats?.PIX || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-50/60 border border-blue-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                    <CreditCard size={16} />
                  </div>
                  <span className="text-xs font-bold text-gray-900">Cartão (Débito/Crédito)</span>
                </div>
                <span className="text-xs font-black text-blue-700">
                  {formatCurrency(
                    (metrics?.paymentStats?.DEBITO || 0) + (metrics?.paymentStats?.CREDITO || 0)
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/60 border border-amber-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                    <Banknote size={16} />
                  </div>
                  <span className="text-xs font-bold text-gray-900">Dinheiro Físico</span>
                </div>
                <span className="text-xs font-black text-amber-700">
                  {formatCurrency(metrics?.paymentStats?.DINHEIRO || 0)}
                </span>
              </div>
            </div>

            {/* Divisão por Canais (Balcão x Delivery x Mesa) */}
            <div className="pt-3 border-t border-gray-100">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-2">
                Canais de Atendimento (Hoje)
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[10px] font-bold">Balcão</span>
                  <span className="font-black text-gray-900">{metrics?.typeStats?.BALCAO || 0}</span>
                </div>
                <div className="p-2 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[10px] font-bold">Entrega</span>
                  <span className="font-black text-gray-900">{metrics?.typeStats?.DELIVERY || 0}</span>
                </div>
                <div className="p-2 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[10px] font-bold">Mesa</span>
                  <span className="font-black text-gray-900">{metrics?.typeStats?.MESA || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Linha 3: Top Lanches Mais Vendidos & Últimos Pedidos em Tempo Real */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Lanches */}
          <div className="bg-white p-6 md:p-7 rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-gray-900 tracking-tight">Campeões de Vendas (Hoje)</h3>
                <p className="text-xs text-gray-500">Ranking dos lanches e itens com maior saída</p>
              </div>
              <Link href="/cardapio" className="text-xs font-bold text-primary hover:underline">
                Ver Cardápio →
              </Link>
            </div>

            <div className="space-y-2.5">
              {(metrics?.topProducts || []).map((p: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/80 hover:bg-gray-100/80 transition-all border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center ${
                        idx === 0
                          ? "bg-amber-400 text-gray-950 shadow-sm"
                          : idx === 1
                          ? "bg-gray-200 text-gray-800"
                          : idx === 2
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-gray-900 line-clamp-1">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-gray-900 block">{p.count} vendidos</span>
                    <span className="text-[10px] text-gray-400 font-semibold">{formatCurrency(p.total)}</span>
                  </div>
                </div>
              ))}

              {(!metrics?.topProducts || metrics.topProducts.length === 0) && (
                <div className="py-10 text-center text-xs text-gray-400 font-medium">
                  Nenhum pedido finalizado hoje ainda.
                </div>
              )}
            </div>
          </div>

          {/* Últimos Pedidos em Tempo Real */}
          <div className="bg-white p-6 md:p-7 rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-gray-900 tracking-tight">Últimos Pedidos</h3>
                <p className="text-xs text-gray-500">Atividades recentes no caixa e delivery</p>
              </div>
              <Link href="/pedidos" className="text-xs font-bold text-primary hover:underline">
                Ver Todos →
              </Link>
            </div>

            <div className="space-y-2.5">
              {(metrics?.recentOrders || []).map((o: any) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/80 hover:bg-gray-100/80 transition-all border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-red-50 text-primary font-black text-xs flex items-center justify-center">
                      {o.type === "DELIVERY" ? <Bike size={16} /> : o.type === "MESA" ? <UtensilsCrossed size={16} /> : <ShoppingBag size={16} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-900 block truncate max-w-[160px]">
                          {o.customerName || `Pedido #${o.code.replace(/^#+/, "")}`}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold">
                          #{o.code.replace(/^#+/, "")}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium block">
                        {o.time}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-gray-900 block">{formatCurrency(o.total)}</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${
                        o.status === "ENTREGUE"
                          ? "bg-emerald-100 text-emerald-800"
                          : o.status === "SAIU_ENTREGA"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}

              {(!metrics?.recentOrders || metrics.recentOrders.length === 0) && (
                <div className="py-10 text-center text-xs text-gray-400 font-medium">
                  Nenhum pedido registrado hoje.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
