import { NextResponse } from "next/server";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { sales, expenses, products } from "@/db/schema";

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
    const type = u.searchParams.get("type") || "sales";
    const from = date(u.searchParams.get("from") || day().slice(0, 7) + "-01");
    const to = date(u.searchParams.get("to") || day());
    const db = getDb();

    if (type === "sales") {
      const data = await db.select().from(sales).where(and(gte(sales.day, from), lte(sales.day, to))).orderBy(desc(sales.created));

      const header = "Data,Hora,Itens,Pagamento,Total,Recebido,Troco,Funcionário\n";
      const rows = data.map((s) => {
        const items = JSON.parse(s.lines).map((x: any) => `${x.qty}x ${x.name}`).join("; ");
        const time = new Date(s.created).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" });
        return `"${s.day}","${time}","${items}","${s.payment}","${brl(s.total)}","${brl(s.received)}","${brl(s.received - s.total)}","${s.employee || ""}"`;
      }).join("\n");

      return new NextResponse(header + rows, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="vendas-${from}-${to}.csv"`,
        },
      });
    }

    if (type === "expenses") {
      const data = await db.select().from(expenses).where(and(gte(expenses.day, from), lte(expenses.day, to))).orderBy(desc(expenses.day));

      const header = "Data,Fornecedor,Valor\n";
      const rows = data.map((e) => `"${e.day}","${e.merchant}","${brl(e.amount)}"`).join("\n");

      return new NextResponse(header + rows, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="gastos-${from}-${to}.csv"`,
        },
      });
    }

    if (type === "products") {
      const data = await db.select().from(products).orderBy(products.name);
      const header = "Nome,Descrição,Preço,Categoria,Estoque,Ativo\n";
      const rows = data.map((p) => `"${p.name}","${p.description}","${brl(p.price)}","${p.category}","${p.stock >= 0 ? p.stock : "Ilimitado"}","${p.active ? "Sim" : "Não"}"`).join("\n");

      return new NextResponse(header + rows, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="cardapio.csv"`,
        },
      });
    }

    return new NextResponse("Tipo inválido", { status: 400 });
  } catch (e) {
    console.error(e);
    return new NextResponse("Erro ao exportar", { status: 500 });
  }
}
