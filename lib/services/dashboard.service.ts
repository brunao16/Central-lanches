import { prisma } from "@/lib/prisma";

export class DashboardService {
  static async getMetrics() {
    const now = new Date();
    // Início do dia (Fortaleza UTC-3)
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
      orderBy: { createdAt: "desc" },
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

    // Distribuição por Tipo de Pedido (Hoje)
    const typeStats: Record<string, number> = {
      BALCAO: 0,
      DELIVERY: 0,
      MESA: 0,
      RETIRADA: 0,
    };
    todayOrders.forEach((o) => {
      const t = o.type || "BALCAO";
      typeStats[t] = (typeStats[t] || 0) + 1;
    });

    // Formas de pagamento (Hoje)
    const paymentStats: Record<string, number> = {
      PIX: 0,
      DINHEIRO: 0,
      DEBITO: 0,
      CREDITO: 0,
    };
    todayOrders.forEach((o) => {
      const pm = o.paymentMethod || "PIX";
      paymentStats[pm] = (paymentStats[pm] || 0) + o.total;
    });

    // Vendas por hora hoje (16h a 00h cobrindo abertura de lanchonete)
    const hourlySales: Record<number, { total: number; count: number }> = {};
    for (let h = 11; h <= 23; h++) hourlySales[h] = { total: 0, count: 0 };
    todayOrders.forEach((o) => {
      const hour = new Date(o.createdAt).getHours();
      if (!hourlySales[hour]) hourlySales[hour] = { total: 0, count: 0 };
      hourlySales[hour].total += o.total / 100;
      hourlySales[hour].count += 1;
    });

    const hourlyData = Object.entries(hourlySales).map(([hour, val]) => ({
      hour: `${hour}h`,
      total: Math.round(val.total),
      pedidos: val.count,
    }));

    // Top Produtos Mais Vendidos Hoje
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
      .slice(0, 6);

    // Alertas de Estoque e Atraso
    const lowStockItems = await prisma.inventoryItem.findMany({
      where: {
        quantity: { lte: 5 },
      },
    });

    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const delayedOrders = await prisma.order.findMany({
      where: {
        createdAt: { lte: thirtyMinsAgo },
        status: { in: ["NOVO", "PREPARANDO"] },
      },
    });

    // Últimos 5 Pedidos em Tempo Real
    const recentOrders = todayOrders.slice(0, 5).map((o) => ({
      id: o.id,
      code: o.code,
      type: o.type,
      status: o.status,
      customerName: o.customerName || "Balcão",
      total: o.total,
      time: new Date(o.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    }));

    // Status do Caixa Ativo
    const activeRegister = await prisma.cashRegister.findFirst({
      where: { status: "ABERTO" },
      orderBy: { openedAt: "desc" },
    });

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
      typeStats,
      topProducts,
      recentOrders,
      isRegisterOpen: !!activeRegister,
      registerInitial: activeRegister?.initialAmount || 0,
      alerts: {
        lowStockCount: lowStockItems.length,
        delayedOrdersCount: delayedOrders.length,
      },
    };
  }
}
