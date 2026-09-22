import { NextResponse } from "next/server";
import { eq, and, gte, lte, sql, desc, like } from "drizzle-orm";
import { getDb } from "@/db";
import { products, sales, expenses, users, timeClock, loyalty } from "@/db/schema";

export const dynamic = "force-dynamic";

const day = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const now = () => new Date();
const h = (d: Date, tz = "America/Sao_Paulo") => parseInt(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(d));

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const from = u.searchParams.get("from") || day().slice(0, 7) + "-01";
    const to = u.searchParams.get("to") || day();
    const branch = u.searchParams.get("branch") || "";
    const db = getDb();

    const conditions = [gte(sales.day, from), lte(sales.day, to)];
    if (branch) conditions.push(eq(sales.branch, branch));

    const expConditions = [gte(expenses.day, from), lte(expenses.day, to)];
    if (branch) expConditions.push(eq(expenses.branch, branch));

    const todayStr = day();
    const yesterday = new Date(now().getTime() - 86400000);
    const yesterdayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(yesterday);
    const weekAgo = new Date(now().getTime() - 7 * 86400000);
    const weekAgoStr = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(weekAgo);
    const monthStart = todayStr.slice(0, 7) + "-01";
    const lastMonthDate = new Date(now().getTime() - 30 * 86400000);
    const lastMonthStart = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1));
    const lastMonthEnd = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(now().getTime() - 30 * 86400000));

    const [todaySales, todayExpenses, periodSales, periodExpenses, allSales] = await Promise.all([
      db.select({ total: sql<number>`coalesce(sum(${sales.total}), 0)`, count: sql<number>`count(*)` }).from(sales).where(and(eq(sales.day, todayStr), branch ? eq(sales.branch, branch) : undefined)).get(),
      db.select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` }).from(expenses).where(and(eq(expenses.day, todayStr), branch ? eq(expenses.branch, branch) : undefined)).get(),
      db.select({ total: sql<number>`coalesce(sum(${sales.total}), 0)`, count: sql<number>`count(*)` }).from(sales).where(and(...conditions)).get(),
      db.select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` }).from(expenses).where(and(...expConditions)).get(),
      db.select().from(sales).where(and(...conditions)).orderBy(desc(sales.created)),
    ]);

    const [yesterdaySales, yesterdayExpenses] = await Promise.all([
      db.select({ total: sql<number>`coalesce(sum(${sales.total}), 0)`, count: sql<number>`count(*)` }).from(sales).where(and(eq(sales.day, yesterdayStr), branch ? eq(sales.branch, branch) : undefined)).get(),
      db.select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` }).from(expenses).where(and(eq(expenses.day, yesterdayStr), branch ? eq(expenses.branch, branch) : undefined)).get(),
    ]);

    const [weekSales, weekExpenses, lastWeekSales] = await Promise.all([
      db.select({ total: sql<number>`coalesce(sum(${sales.total}), 0)`, count: sql<number>`count(*)` }).from(sales).where(and(gte(sales.day, weekAgoStr), lte(sales.day, to), branch ? eq(sales.branch, branch) : undefined)).get(),
      db.select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` }).from(expenses).where(and(gte(expenses.day, weekAgoStr), lte(expenses.day, to), branch ? eq(expenses.branch, branch) : undefined)).get(),
      db.select({ total: sql<number>`coalesce(sum(${sales.total}), 0)` }).from(sales).where(and(gte(sales.day, weekAgoStr), lte(sales.day, yesterdayStr), branch ? eq(sales.branch, branch) : undefined)).get(),
    ]);

    const [monthSales, monthExpenses, lastMonthSalesData] = await Promise.all([
      db.select({ total: sql<number>`coalesce(sum(${sales.total}), 0)`, count: sql<number>`count(*)` }).from(sales).where(and(gte(sales.day, monthStart), lte(sales.day, to), branch ? eq(sales.branch, branch) : undefined)).get(),
      db.select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` }).from(expenses).where(and(gte(expenses.day, monthStart), lte(expenses.day, to), branch ? eq(expenses.branch, branch) : undefined)).get(),
      db.select({ total: sql<number>`coalesce(sum(${sales.total}), 0)`, count: sql<number>`count(*)` }).from(sales).where(and(gte(sales.day, lastMonthStart), lte(sales.day, lastMonthEnd), branch ? eq(sales.branch, branch) : undefined)).get(),
    ]);

    const todayRev = todaySales?.total || 0;
    const todayCost = todayExpenses?.total || 0;
    const todayProfit = todayRev - todayCost;
    const todayCount = todaySales?.count || 0;
    const ticketMedio = todayCount > 0 ? Math.round(todayRev / todayCount) : 0;
    const margem = todayRev > 0 ? Math.round((todayProfit / todayRev) * 100) : 0;

    const yestRev = yesterdaySales?.total || 0;
    const yestCost = yesterdayExpenses?.total || 0;
    const yestCount = yesterdaySales?.count || 0;
    const revTrend = yestRev > 0 ? Math.round(((todayRev - yestRev) / yestRev) * 100) : 0;
    const countTrend = yestCount > 0 ? Math.round(((todayCount - yestCount) / yestCount) * 100) : 0;
    const ticketTrend = yestCount > 0 ? Math.round(((ticketMedio - (yestRev / yestCount)) / (yestRev / yestCount)) * 100) : 0;

    const weekRev = weekSales?.total || 0;
    const weekCost = weekExpenses?.total || 0;
    const weekCount = weekSales?.count || 0;
    const monthRev = monthSales?.total || 0;
    const monthCost = monthExpenses?.total || 0;
    const monthCount = monthSales?.count || 0;
    const lastMonthRev = lastMonthSalesData?.total || 0;
    const lastMonthCount = lastMonthSalesData?.count || 0;
    const dailyGoal = parseInt((await db.select({ value: sql<string>`value` }).from(require("@/db/schema").settings).where(eq(require("@/db/schema").settings.key, "dailyGoal")).get())?.value || "50000");
    const goalProgress = dailyGoal > 0 ? Math.min(100, Math.round((todayRev / dailyGoal) * 100)) : 0;

    const hourlySales: Record<number, { total: number; count: number }> = {};
    for (let i = 0; i < 24; i++) { hourlySales[i] = { total: 0, count: 0 }; }
    const dayOfWeekSales: Record<string, { total: number; count: number }> = {};
    ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].forEach(d => { dayOfWeekSales[d] = { total: 0, count: 0 }; });

    const salesByHour: Record<string, { total: number; count: number }> = {};
    const productSales: Record<string, { name: string; total: number; count: number; qty: number }> = {};
    const paymentStats: Record<string, { total: number; count: number }> = {};
    const employeeSales: Record<string, { total: number; count: number; hours: number }> = {};
    const dailySales: Record<string, number> = {};
    const categorySales: Record<string, { total: number; count: number }> = {};

    for (const s of allSales) {
      const d = new Date(s.created);
      const hour = h(d);
      const dow = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][d.getDay()];
      const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);

      hourlySales[hour].total += s.total;
      hourlySales[hour].count += 1;
      dayOfWeekSales[dow].total += s.total;
      dayOfWeekSales[dow].count += 1;

      dailySales[dayKey] = (dailySales[dayKey] || 0) + s.total;

      const hourKey = `${dayKey} ${String(hour).padStart(2, "0")}:00`;
      salesByHour[hourKey] = { total: (salesByHour[hourKey]?.total || 0) + s.total, count: (salesByHour[hourKey]?.count || 0) + 1 };

      const emp = s.employee || "Desconhecido";
      if (!employeeSales[emp]) employeeSales[emp] = { total: 0, count: 0, hours: 0 };
      employeeSales[emp].total += s.total;
      employeeSales[emp].count += 1;

      paymentStats[s.payment] = { total: (paymentStats[s.payment]?.total || 0) + s.total, count: (paymentStats[s.payment]?.count || 0) + 1 };

      const lines = JSON.parse(s.lines);
      for (const line of lines) {
        if (!productSales[line.id]) productSales[line.id] = { name: line.name, total: 0, count: 0, qty: 0 };
        productSales[line.id].total += line.price * line.qty;
        productSales[line.id].count += 1;
        productSales[line.id].qty += line.qty;

        if (!categorySales[line.category || "Geral"]) categorySales[line.category || "Geral"] = { total: 0, count: 0 };
        categorySales[line.category || "Geral"].total += line.price * line.qty;
        categorySales[line.category || "Geral"].count += 1;
      }
    }

    const clockRecords = await db.select().from(timeClock).where(and(gte(timeClock.day, weekAgoStr), lte(timeClock.day, to))).orderBy(desc(timeClock.clockIn));
    for (const cr of clockRecords) {
      const emp = cr.employee;
      if (!employeeSales[emp]) employeeSales[emp] = { total: 0, count: 0, hours: 0 };
      if (cr.clockOut) {
        employeeSales[emp].hours += (new Date(cr.clockOut).getTime() - new Date(cr.clockIn).getTime()) / 3600000;
      }
    }

    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([id, d]) => ({ id, ...d }));

    const topEmployees = Object.entries(employeeSales)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
      .map(([name, d]) => ({ name, ...d, ticket: d.count > 0 ? Math.round(d.total / d.count) : 0 }));

    const bestHour = Object.entries(hourlySales).sort((a, b) => b[1].total - a[1].total)[0];
    const worstHour = Object.entries(hourlySales).sort((a, b) => a[1].total - b[1].total)[0];

    const lowStock = (await db.select().from(products).where(eq(products.active, 1))).filter(p => p.stock >= 0 && p.stock < 5);

    const alerts: { type: string; message: string; severity: string }[] = [];
    if (goalProgress < 80 && h(now()) >= 18) alerts.push({ type: "goal", message: `Meta ${goalProgress}% até as 18h`, severity: "warning" });
    if (lowStock.length > 0) alerts.push({ type: "stock", message: `${lowStock.length} produtos com estoque baixo`, severity: "error" });
    const currentHour = h(now());
    const currentHourSales = hourlySales[currentHour]?.count || 0;
    if (currentHourSales < 2 && currentHour >= 10 && currentHour <= 22) alerts.push({ type: "slow", message: `Horário lento: ${currentHourSales} vendas/hora`, severity: "info" });
    if (todayRev > 0 && todayCost > todayRev * 0.3) alerts.push({ type: "cost", message: `Gastos ${(Math.round(todayCost / todayRev * 100))}% da receita`, severity: "warning" });

    return NextResponse.json({
      kpis: { todayRev, todayCost, todayProfit, todayCount, ticketMedio, margem, dailyGoal, goalProgress },
      trends: { revTrend, countTrend, ticketTrend, profitTrend: yestRev > 0 ? Math.round(((todayProfit - (yestRev - yestCost)) / (yestRev - yestCost)) * 100) : 0 },
      comparison: { yesterday: { rev: yestRev, cost: yestCost, count: yestCount }, week: { rev: weekRev, cost: weekCost, count: weekCount }, month: { rev: monthRev, cost: monthCost, count: monthCount }, lastMonth: { rev: lastMonthRev, cost: 0, count: lastMonthCount } },
      hourlySales: Object.entries(hourlySales).map(([h, d]) => ({ hour: parseInt(h), ...d })),
      dayOfWeekSales: Object.entries(dayOfWeekSales).map(([d, v]) => ({ day: d, ...v })),
      topProducts, topEmployees, paymentStats: Object.entries(paymentStats).map(([p, d]) => ({ payment: p, ...d })),
      categorySales: Object.entries(categorySales).map(([c, d]) => ({ category: c, ...d })),
      dailySales: Object.entries(dailySales).map(([d, t]) => ({ day: d, total: t })).sort((a, b) => a.day.localeCompare(b.day)),
      bestHour: bestHour ? { hour: parseInt(bestHour[0]), ...bestHour[1] } : null,
      worstHour: worstHour ? { hour: parseInt(worstHour[0]), ...worstHour[1] } : null,
      alerts, lowStock: lowStock.map(p => ({ id: p.id, name: p.name, stock: p.stock })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao carregar dashboard." }, { status: 500 });
  }
}
