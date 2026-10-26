import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "sales"; // sales, expenses, products, financial
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const dateFilter: any = {};
    if (startDateParam) {
      dateFilter.gte = new Date(startDateParam + "T00:00:00");
    }
    if (endDateParam) {
      dateFilter.lte = new Date(endDateParam + "T23:59:59");
    }

    if (type === "sales") {
      const where: any = {};
      if (startDateParam || endDateParam) {
        where.createdAt = dateFilter;
      }

      const sales = await prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { items: true },
      });

      let csv = "Código,Data/Hora,Tipo,Status,Forma Pagamento,Total (R$),Cliente,Telefone\n";
      for (const s of sales) {
        const dt = new Date(s.createdAt).toLocaleString("pt-BR", { timeZone: "America/Fortaleza" });
        const total = (s.total / 100).toFixed(2).replace(".", ",");
        csv += `"${s.code}","${dt}","${s.type}","${s.status}","${s.paymentMethod}","${total}","${s.customerName || ""}","${s.customerPhone || ""}"\n`;
      }

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="vendas-central-lanches.csv"',
        },
      });
    }

    if (type === "expenses") {
      const where: any = {};
      if (startDateParam || endDateParam) {
        where.date = dateFilter;
      }

      const expenses = await prisma.expense.findMany({
        where,
        orderBy: { date: "desc" },
      });

      let csv = "Descrição,Categoria,Data,Forma Pagamento,Recorrente,Valor (R$)\n";
      for (const e of expenses) {
        const dt = new Date(e.date).toLocaleDateString("pt-BR", { timeZone: "America/Fortaleza" });
        const amount = (e.amount / 100).toFixed(2).replace(".", ",");
        csv += `"${e.description}","${e.category}","${dt}","${e.paymentMethod}","${e.isRecurring ? "Sim" : "Não"}","${amount}"\n`;
      }

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="gastos-central-lanches.csv"',
        },
      });
    }

    if (type === "financial") {
      const whereOrders: any = { status: { not: "CANCELADO" } };
      const whereExpenses: any = {};
      if (startDateParam || endDateParam) {
        whereOrders.createdAt = dateFilter;
        whereExpenses.date = dateFilter;
      }

      const [orders, expenses] = await Promise.all([
        prisma.order.findMany({ where: whereOrders }),
        prisma.expense.findMany({ where: whereExpenses }),
      ]);

      const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
      const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
      const netProfit = totalRevenue - totalExpenses;

      let csv = "Métrica,Valor (R$),Observações\n";
      csv += `"Receita Bruta Total","${(totalRevenue / 100).toFixed(2).replace(".", ",")}","${orders.length} pedidos concluídos"\n`;
      csv += `"Total de Gastos/Despesas","${(totalExpenses / 100).toFixed(2).replace(".", ",")}","${expenses.length} lançamentos"\n`;
      csv += `"Lucro Líquido Real","${(netProfit / 100).toFixed(2).replace(".", ",")}","${netProfit >= 0 ? "Positivo (Lucro)" : "Negativo (Prejuízo)"}"\n`;

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="resumo-financeiro-dre.csv"',
        },
      });
    }

    if (type === "products") {
      const products = await prisma.product.findMany({
        include: { category: true },
        orderBy: { name: "asc" },
      });

      let csv = "Nome,Categoria,Preço Venda (R$),Custo (R$),Ativo\n";
      for (const p of products) {
        const price = (p.price / 100).toFixed(2).replace(".", ",");
        const cost = (p.costPrice / 100).toFixed(2).replace(".", ",");
        csv += `"${p.name}","${p.category.name}","${price}","${cost}","${p.active ? "Sim" : "Não"}"\n`;
      }

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="produtos-central-lanches.csv"',
        },
      });
    }

    return NextResponse.json({ error: "Tipo de relatório inválido" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
