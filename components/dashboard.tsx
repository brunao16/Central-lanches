"use client";

import { useEffect, useState, useRef } from "react";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Clock, Star, Target, Package, Users, BarChart3, RefreshCw, Download } from "lucide-react";

type KPI = { todayRev: number; todayCost: number; todayProfit: number; todayCount: number; ticketMedio: number; margem: number; dailyGoal: number; goalProgress: number };
type Trend = { revTrend: number; countTrend: number; ticketTrend: number; profitTrend: number };
type HourlyData = { hour: number; total: number; count: number };
type TopProduct = { id: string; name: string; total: number; count: number; qty: number };
type TopEmployee = { name: string; total: number; count: number; hours: number; ticket: number };
type PaymentStat = { payment: string; total: number; count: number };
type Alert = { type: string; message: string; severity: string };

const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v / 100);

function TrendBadge({ value, suffix = "" }: { value: number; suffix?: string }) {
  if (value === 0) return <span style={{ color: "#657184", fontSize: 12 }}><Minus size={12} /> 0{suffix}</span>;
  const isPos = value > 0;
  return <span style={{ color: isPos ? "#16a34a" : "#dc2626", fontSize: 12, fontWeight: 600 }}>{isPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {isPos ? "+" : ""}{value}{suffix}</span>;
}

function BarChart({ data, maxVal, color = "#d84416", height = 120, showLabels = true }: { data: { label: string; value: number }[]; maxVal: number; color?: string; height?: number; showLabels?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: height + (showLabels ? 20 : 0), padding: "0 4px" }}>
      {data.map((d, i) => {
        const pct = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 10, color: "#657184" }}>{d.value > 0 ? brl(d.value).replace("R$", "") : ""}</span>
            <div style={{ width: "100%", background: color, borderRadius: 4, height: Math.max(2, (pct / 100) * height), transition: "height .5s ease", minHeight: 2, opacity: d.value > 0 ? 1 : 0.2 }} />
            {showLabels && <span style={{ fontSize: 9, color: "#999", textAlign: "center", overflow: "hidden" }}>{d.label}</span>}
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBar({ label, value, maxValue, color }: { label: string; value: number; maxValue: number; color: string }) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ width: 80, fontSize: 12, textAlign: "right", color: "#657184", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, background: "#f1f5f9", borderRadius: 4, height: 16, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: 4, transition: "width .5s ease" }} />
      </div>
      <span style={{ width: 70, fontSize: 11, fontWeight: 600 }}>{brl(value)}</span>
    </div>
  );
}

function PieChart({ data, colors }: { data: { label: string; value: number }[]; colors: string[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let cum = 0;
  const segments = data.map((d, i) => {
    const start = (cum / total) * 360;
    cum += d.value;
    const end = (cum / total) * 360;
    return { ...d, color: colors[i % colors.length], start, end };
  });
  const gradient = segments.map(s => `${s.color} ${s.start}deg ${s.end}deg`).join(", ");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 120, height: 120, borderRadius: "50%", background: `conic-gradient(${gradient})` }} />
      <div style={{ flex: 1 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, fontSize: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
            <span style={{ flex: 1, color: "#657184" }}>{s.label}</span>
            <span style={{ fontWeight: 600 }}>{total > 0 ? Math.round((s.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard({ from, to, branch }: { from: string; to: string; branch: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  async function refresh() {
    const params = new URLSearchParams({ from, to });
    if (branch) params.set("branch", branch);
    const r = await fetch(`/api/dashboard?${params}`);
    const d = await r.json();
    setData(d);
    setLoading(false);
    setLastRefresh(new Date());
  }

  useEffect(() => { setLoading(true); refresh(); }, [from, to, branch]);
  useEffect(() => { const i = setInterval(refresh, 30000); return () => clearInterval(i); }, [from, to, branch]);

  function exportImage() {
    if (!containerRef.current) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = 1200;
    canvas.height = 2000;
    ctx.fillStyle = "#f3f5f7";
    ctx.fillRect(0, 0, 1200, 2000);
    ctx.fillStyle = "#1d2532";
    ctx.font = "bold 32px Arial";
    ctx.fillText("Dashboard - Central Lanches", 40, 60);
    ctx.font = "16px Arial";
    ctx.fillStyle = "#657184";
    ctx.fillText(`Período: ${from} a ${to} | Gerado: ${new Date().toLocaleString("pt-BR")}`, 40, 90);
    const link = document.createElement("a");
    link.download = `dashboard-${new Intl.DateTimeFormat("en-CA").format(new Date())}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  if (loading) return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[1, 2, 3, 4, 5].map(i => <div key={i} style={{ background: "var(--panel)", borderRadius: 12, padding: 20, height: 100 }} />)}
      </div>
      <div style={{ background: "var(--panel)", borderRadius: 12, height: 200, marginBottom: 20 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "var(--panel)", borderRadius: 12, height: 200 }} />
        <div style={{ background: "var(--panel)", borderRadius: 12, height: 200 }} />
      </div>
    </div>
  );

  if (!data || data.error) return <div style={{ padding: 24, color: "#c32626" }}>Erro ao carregar dashboard.</div>;

  const { kpis, trends, comparison, hourlySales, topProducts, topEmployees, paymentStats, dailySales, alerts, lowStock } = data;
  const maxHourly = Math.max(...hourlySales.map((h: HourlyData) => h.total), 1);
  const maxProduct = Math.max(...topProducts.map((p: TopProduct) => p.total), 1);
  const maxDaily = Math.max(...dailySales.map((d: any) => d.total), 1);

  const paymentColors: Record<string, string> = { Pix: "#16a34a", Dinheiro: "#f59e0b", Cartão: "#3b82f6" };

  return (
    <div ref={containerRef}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>DASHBOARD</p>
          <h2 style={{ margin: 0, fontSize: 22 }}>Visão completa do negócio</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#999" }}>Atualizado {lastRefresh.toLocaleTimeString("pt-BR")}</span>
          <button onClick={refresh} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "white", cursor: "pointer" }}><RefreshCw size={14} /></button>
          <button onClick={exportImage} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}><Download size={14} /> Exportar</button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {alerts.map((a: Alert, i: number) => (
            <div key={i} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, background: a.severity === "error" ? "#fef2f2" : a.severity === "warning" ? "#fffbeb" : "#eff6ff", color: a.severity === "error" ? "#dc2626" : a.severity === "warning" ? "#d97706" : "#3b82f6", border: `1px solid ${a.severity === "error" ? "#fecaca" : a.severity === "warning" ? "#fde68a" : "#bfdbfe"}` }}>
              <AlertTriangle size={14} /> {a.message}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Receita Hoje", value: brl(kpis.todayRev), trend: trends.revTrend, icon: "💰", bg: "#f0fdf4", border: "#bbf7d0" },
          { label: "Ticket Médio", value: brl(kpis.ticketMedio), trend: trends.ticketTrend, icon: "🎯", bg: "#eff6ff", border: "#bfdbfe" },
          { label: "Lucro Hoje", value: brl(kpis.todayProfit), trend: trends.profitTrend, icon: "📈", bg: "#fefce8", border: "#fef08a" },
          { label: "Margem", value: `${kpis.margem}%`, trend: 0, icon: "📊", bg: "#fdf4ff", border: "#f5d0fe" },
          { label: "Vendas", value: String(kpis.todayCount), trend: trends.countTrend, icon: "🛒", bg: "#fff7ed", border: "#fed7aa" },
        ].map((kpi, i) => (
          <div key={i} style={{ background: kpi.bg, border: `1px solid ${kpi.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "#657184" }}>{kpi.label}</span>
              <span style={{ fontSize: 20 }}>{kpi.icon}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{kpi.value}</div>
            <TrendBadge value={kpi.trend} suffix=" vs ontem" />
          </div>
        ))}
      </div>

      <div style={{ background: "var(--panel)", borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>Meta Diária</h3>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{kpis.goalProgress}%</span>
        </div>
        <div style={{ background: "#f1f5f9", borderRadius: 8, height: 20, overflow: "hidden" }}>
          <div style={{ width: `${kpis.goalProgress}%`, background: kpis.goalProgress >= 100 ? "#16a34a" : kpis.goalProgress >= 70 ? "#f59e0b" : "#d84416", height: "100%", borderRadius: 8, transition: "width 1s ease", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {kpis.goalProgress >= 15 && <span style={{ fontSize: 11, color: "white", fontWeight: 600 }}>{kpis.goalProgress}%</span>}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, color: "#999" }}>
          <span>{brl(kpis.todayRev)}</span>
          <span>Meta: {brl(kpis.dailyGoal)}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "var(--panel)", borderRadius: 12, padding: 16 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>Receita 24h</h3>
          <BarChart data={hourlySales.map((h: HourlyData) => ({ label: `${h.hour}h`, value: h.total }))} maxVal={maxHourly} height={100} />
        </div>
        <div style={{ background: "var(--panel)", borderRadius: 12, padding: 16 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>Receita por Dia</h3>
          <BarChart data={dailySales.slice(-7).map((d: any) => ({ label: d.day.slice(5), value: d.total }))} maxVal={maxDaily} color="#3b82f6" height={100} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "var(--panel)", borderRadius: 12, padding: 16 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15 }}><Star size={14} style={{ display: "inline", color: "#f59e0b" }} /> Top 5 Produtos</h3>
          {topProducts.map((p: TopProduct, i: number) => (
            <HorizontalBar key={p.id} label={`${i + 1}º ${p.name}`} value={p.total} maxValue={maxProduct} color={["#d84416", "#f59e0b", "#16a34a", "#3b82f6", "#8b5cf6"][i]} />
          ))}
          {topProducts.length === 0 && <p style={{ color: "#999", fontSize: 13 }}>Nenhuma venda no período</p>}
        </div>
        <div style={{ background: "var(--panel)", borderRadius: 12, padding: 16 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15 }}><Users size={14} style={{ display: "inline" }} /> Top Funcionários</h3>
          {topEmployees.map((e: TopEmployee, i: number) => (
            <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 13 }}>
              <span style={{ width: 20, height: 20, borderRadius: 10, background: ["#d84416", "#f59e0b", "#16a34a"][i] || "#ccc", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{i + 1}</span>
              <span style={{ flex: 1 }}>{e.name}</span>
              <span style={{ fontWeight: 600 }}>{brl(e.total)}</span>
              <span style={{ color: "#999", fontSize: 11 }}>{e.count}v</span>
            </div>
          ))}
          {topEmployees.length === 0 && <p style={{ color: "#999", fontSize: 13 }}>Sem dados</p>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "var(--panel)", borderRadius: 12, padding: 16 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>Pagamentos</h3>
          <PieChart data={paymentStats.map((p: PaymentStat) => ({ label: p.payment, value: p.total }))} colors={["#16a34a", "#f59e0b", "#3b82f6"]} />
        </div>
        <div style={{ background: "var(--panel)", borderRadius: 12, padding: 16 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15 }}><Target size={14} style={{ display: "inline" }} /> Comparativos</h3>
          {[
            { label: "Ontem", rev: comparison.yesterday.rev, cost: comparison.yesterday.cost },
            { label: "7 dias", rev: comparison.week.rev, cost: comparison.week.cost },
            { label: "30 dias", rev: comparison.month.rev, cost: comparison.month.cost },
          ].map((c, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
              <span style={{ color: "#657184" }}>{c.label}</span>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 600 }}>{brl(c.rev)}</div>
                <div style={{ fontSize: 11, color: "#999" }}>Lucro: {brl(c.rev - c.cost)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {lowStock.length > 0 && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 15, color: "#dc2626" }}><Package size={14} style={{ display: "inline" }} /> Estoque Baixo</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {lowStock.map((p: any) => (
              <div key={p.id} style={{ padding: "6px 12px", borderRadius: 8, background: "white", border: "1px solid #fecaca", fontSize: 13 }}>
                <strong>{p.name}</strong> — {p.stock} restantes
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: "var(--panel)", borderRadius: 12, padding: 16 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15 }}><Clock size={14} style={{ display: "inline" }} /> Horário Mais Lucrativo</h3>
        {data.bestHour && <p style={{ fontSize: 13 }}>🏆 <strong>{data.bestHour.hour}h</strong> — {brl(data.bestHour.total)} ({data.bestHour.count} vendas)</p>}
        {data.worstHour && <p style={{ fontSize: 13 }}>💤 <strong>{data.worstHour.hour}h</strong> — {brl(data.worstHour.total)} ({data.worstHour.count} vendas)</p>}
      </div>
    </div>
  );
}
