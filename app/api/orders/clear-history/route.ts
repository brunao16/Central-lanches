import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { period } = await req.json();

    if (!period || !["day", "week", "month"].includes(period)) {
      return NextResponse.json(
        { error: "Período inválido. Use 'day', 'week' ou 'month'." },
        { status: 400 }
      );
    }

    const now = new Date();
    let startDate: Date;

    if (period === "day") {
      // Início do dia local (00:00:00)
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (period === "week") {
      // Início da semana (domingo 00:00:00)
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
    } else {
      // Início do mês (dia 1 às 00:00:00)
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    }

    // Executa em transação para garantir integridade
    const result = await prisma.$transaction(async (tx) => {
      // 1. Encontrar pedidos do período
      const orders = await tx.order.findMany({
        where: { createdAt: { gte: startDate } },
        select: { id: true },
      });
      const orderIds = orders.map((o) => o.id);

      // 2. Remover movimentações de caixa associadas a esses pedidos ou criadas no período
      const deletedMovements = await tx.cashMovement.deleteMany({
        where: {
          OR: [
            { orderId: { in: orderIds } },
            { createdAt: { gte: startDate } },
          ],
        },
      });

      // 3. Remover os pedidos (os itens OrderItem já possuem onDelete: Cascade)
      const deletedOrders = await tx.order.deleteMany({
        where: { createdAt: { gte: startDate } },
      });

      // 4. Remover despesas/gastos do período
      const deletedExpenses = await tx.expense.deleteMany({
        where: {
          OR: [
            { date: { gte: startDate } },
            { createdAt: { gte: startDate } },
          ],
        },
      });

      return {
        deletedOrdersCount: deletedOrders.count,
        deletedMovementsCount: deletedMovements.count,
        deletedExpensesCount: deletedExpenses.count,
      };
    });

    return NextResponse.json({
      success: true,
      period,
      ...result,
    });
  } catch (error: any) {
    console.error("Erro ao apagar histórico:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao apagar histórico." },
      { status: 500 }
    );
  }
}
