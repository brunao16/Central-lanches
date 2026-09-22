import { NextResponse } from "next/server";
import { and, gte, lte, desc, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { sales, expenses } from "@/db/schema";

export const dynamic = "force-dynamic";

const day = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

function date(v: unknown) {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(Date.parse(v))) throw new Error("Data inválida.");
  return v;
}

function brl(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v / 100);
}

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const from = date(u.searchParams.get("from") || day().slice(0, 7) + "-01");
    const to = date(u.searchParams.get("to") || day());
    const db = getDb();

    const [salesData, expensesData, totals] = await Promise.all([
      db.select().from(sales).where(and(gte(sales.day, from), lte(sales.day, to))).orderBy(desc(sales.created)),
      db.select().from(expenses).where(and(gte(expenses.day, from), lte(expenses.day, to))).orderBy(desc(expenses.day)),
      Promise.all([
        db.select({ value: sql<number>`coalesce(sum(${sales.total}), 0)` }).from(sales).where(and(gte(sales.day, from), lte(sales.day, to))),
        db.select({ value: sql<number>`coalesce(sum(${expenses.amount}), 0)` }).from(expenses).where(and(gte(expenses.day, from), lte(expenses.day, to))),
        db.select({ value: sql<number>`count(*)` }).from(sales).where(and(gte(sales.day, from), lte(sales.day, to))),
      ]),
    ]);

    const revenue = totals[0][0].value;
    const costs = totals[1][0].value;
    const count = totals[2][0].value;
    const balance = revenue - costs;

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório Central Lanches</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 30px; color: #1d2532; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    .subtitle { color: #657184; font-size: 13px; margin-bottom: 24px; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 30px; }
    .card { border: 1px solid #dce2e8; border-radius: 10px; padding: 16px; text-align: center; }
    .card.balance { background: #1d2532; color: white; border-color: #1d2532; }
    .card .label { font-size: 12px; color: #657184; text-transform: uppercase; letter-spacing: 1px; }
    .card .value { font-size: 26px; font-weight: bold; margin-top: 4px; }
    .card.balance .label, .card.balance .value { color: white; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #dce2e8; font-size: 13px; }
    th { background: #f3f5f7; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; color: #606b7b; }
    h2 { font-size: 18px; margin-bottom: 12px; }
    .footer { margin-top: 30px; text-align: center; color: #657184; font-size: 11px; }
  </style>
</head>
<body>
  <h1>Central Lanches - Relatório</h1>
  <p class="subtitle">Período: ${from.split("-").reverse().join("/")} a ${to.split("-").reverse().join("/")}</p>

  <div class="summary">
    <div class="card"><div class="label">Vendas</div><div class="value">${brl(revenue)}</div><p style="color:#657184;font-size:12px">${count} vendas</p></div>
    <div class="card"><div class="label">Gastos</div><div class="value">${brl(costs)}</div><p style="color:#657184;font-size:12px">${expensesData.length} registros</p></div>
    <div class="card balance"><div class="label">Saldo</div><div class="value">${brl(balance)}</div><p style="color:#c7d0de;font-size:12px">Vendas - Gastos</p></div>
  </div>

  <h2>Vendas (${salesData.length})</h2>
  <table>
    <tr><th>Data/Hora</th><th>Itens</th><th>Pagamento</th><th>Total</th><th>Troco</th></tr>
    ${salesData.map((s) => {
      const items = JSON.parse(s.lines).map((x: any) => `${x.qty}x ${x.name}`).join(", ");
      const time = new Date(s.created).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
      return `<tr><td>${time}</td><td>${items}</td><td>${s.payment}</td><td>${brl(s.total)}</td><td>${s.payment === "Dinheiro" ? brl(s.received - s.total) : "-"}</td></tr>`;
    }).join("")}
  </table>

  <h2>Gastos (${expensesData.length})</h2>
  <table>
    <tr><th>Data</th><th>Fornecedor</th><th>Valor</th></tr>
    ${expensesData.map((e) => `<tr><td>${e.day.split("-").reverse().join("/")}</td><td>${e.merchant}</td><td>${brl(e.amount)}</td></tr>`).join("")}
  </table>

  <p class="footer">Gerado em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} - Central Lanches</p>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="relatorio-${from}-${to}.html"`,
      },
    });
  } catch (e) {
    console.error(e);
    return new NextResponse("Erro ao gerar relatório", { status: 500 });
  }
}
