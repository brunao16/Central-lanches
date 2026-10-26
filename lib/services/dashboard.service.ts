import { prisma } from "@/lib/prisma";

export class DashboardService {
  static async getMetrics() {
    const now = new Date();
    // Início do dia (Fortaleza aprox. UTC-3)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

    // Vendas do dia
    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startOfDay },
        status: { not: "CANCELADO" },
      },
      include: { items: true },
    });

    const dayRevenue = todayOrders.reduce((acc, o) => acc + o.total, 0);
    const dayOrdersCount = todayOrders.length;
    const dayAverageTicket = dayOrdersCount > 0 ? Math.round(dayRevenue / dayOrdersCount) : 0;

    // Vendas da semana e mês
    const weekOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startOfWeek },
        status: { not: "CANCELADO" },
      },
    });
    const weekRevenue = weekOrders.reduce((acc, o) => acc + o.total, 0);

    const monthOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startOfMonth },
        status: { not: "CANCELADO" },
      },
    });
    const monthRevenue = monthOrders.reduce((acc, o) => acc + o.total, 0);

    // Gastos do mês
    const monthExpenses = await prisma.expense.findMany({
      where: { date: { gte: startOfMonth } },
    });
    const monthExpensesTotal = monthExpenses.reduce((acc, e) => acc + e.amount, 0);

    const estimatedProfit = monthRevenue - monthExpensesTotal;

    // Vendas por hora hoje (0h a 23h)
    const hourlySales: Record<number, number> = {};
    for (let h = 18; h <= 23; h++) hourlySales[h] = 0; // horários de pico noturno
    todayOrders.forEach((o) => {
      const hour = new Date(o.createdAt).getHours();
      hourlySales[hour] = (hourlySales[hour] || 0) + o.total / 100;
    });

    const hourlyData = Object.entries(hourlySales).map(([hour, total]) => ({
      hour: `${hour}h`,
      total,
    }));

    // Formas de pagamento
    const paymentStats: Record<string, number> = {};
    todayOrders.forEach((o) => {
      paymentStats[o.paymentMethod] = (paymentStats[o.paymentMethod] || 0) + o.total;
    });

    // Top Produtos Mais Vendidos
    const productCounts: Record<string, { name: string; count: number; total: number }> = {};
    todayOrders.forEach((o) => {
      (o.items || []).forEach((it: any) => {
        if (!productCounts[it.productName]) {
          productCounts[it.productName] = { name: it.productName, count: 0, total: 0 };
        }
        productCounts[it.productName].count += it.quantity;
        productCounts[it.productName].total += it.totalPrice;
      });
    });

    const topProducts = Object.values(productCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      dayRevenue,
      dayOrdersCount,
      dayAverageTicket,
      weekRevenue,
      monthRevenue,
      monthExpensesTotal,
      estimatedProfit,
      hourlyData,
      paymentStats,
      topProducts,
      alerts: {
        lowStockCount: lowStockItems.length,
        delayedOrdersCount: delayedOrders.length,
      },
    };
  }
}
