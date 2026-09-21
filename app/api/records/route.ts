import { NextResponse } from "next/server";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { products, sales, expenses } from "@/db/schema";

export const dynamic = "force-dynamic";

const json = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

const day = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

const validId = (v: unknown) =>
  typeof v === "string" && /^[a-zA-Z0-9-]{10,80}$/.test(v);

function money(v: unknown) {
  if (!Number.isSafeInteger(v) || Number(v) < 1 || Number(v) > 100000000)
    throw new Error("Informe um valor válido.");
  return Number(v);
}

function name(v: unknown) {
  if (typeof v !== "string" || !v.trim() || v.length > 150)
    throw new Error("Preencha o nome (até 150 caracteres).");
  return v.trim();
}

function date(v: unknown) {
  if (
    typeof v !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(v) ||
    !Number.isFinite(Date.parse(v)) ||
    new Date(v).toISOString().slice(0, 10) !== v
  )
    throw new Error("Data inválida.");
  return v;
}

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const from = date(
      u.searchParams.get("from") || day().slice(0, 7) + "-01"
    );
    const to = date(u.searchParams.get("to") || day());

    if (from > to) return json({ error: "Confira o período." }, 400);

    const db = getDb();

    const [p, s, e, totals] = await Promise.all([
      db.select().from(products).orderBy(products.name),
      db
        .select()
        .from(sales)
        .where(and(gte(sales.day, from), lte(sales.day, to)))
        .orderBy(desc(sales.created))
        .limit(200),
      db
        .select()
        .from(expenses)
        .where(and(gte(expenses.day, from), lte(expenses.day, to)))
        .orderBy(desc(expenses.day), desc(expenses.created))
        .limit(200),
      db
        .select({
          revenue: sql<number>`coalesce(sum(${sales.total}), 0)`,
          costs: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
          count: sql<number>`count(${sales.id})`,
        })
        .from(sales)
        .where(and(gte(sales.day, from), lte(sales.day, to))),
    ]);

    return json({
      products: p,
      sales: s,
      expenses: e,
      totals: totals[0],
    });
  } catch (e) {
    console.error(e);
    return json(
      { error: "Não foi possível carregar os registros. Tente novamente." },
      503
    );
  }
}

export async function POST(req: Request) {
  try {
    const db = getDb();

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const f = await req.formData();
      const id = f.get("id");
      if (!validId(id)) return json({ error: "Identificador inválido." }, 400);

      const existing = await db
        .select()
        .from(expenses)
        .where(eq(expenses.id, id as string))
        .get();

      if (existing) return json({ ok: true });

      const merchantName = name(f.get("merchant"));
      const amountValue = money(Number(f.get("amount")));
      const dt = date(f.get("day"));

      await db.insert(expenses).values({
        id: id as string,
        day: dt,
        merchant: merchantName,
        amount: amountValue,
        receipt: null,
        created: new Date().toISOString(),
      });

      return json({ ok: true });
    }

    const b = (await req.json()) as any;

    if (!validId(b.id)) return json({ error: "Identificador inválido." }, 400);

    if (b.action === "product") {
      const n = name(b.name);
      const p = money(b.price);
      if (typeof b.description !== "string" || b.description.length > 500)
        return json({ error: "Descrição muito longa." }, 400);

      const existing = await db
        .select()
        .from(products)
        .where(eq(products.id, b.id))
        .get();

      if (existing) {
        await db
          .update(products)
          .set({ name: n, description: b.description, price: p })
          .where(eq(products.id, b.id));
      } else {
        await db.insert(products).values({
          id: b.id,
          name: n,
          description: b.description,
          price: p,
          active: 1,
        });
      }

      return json({ ok: true });
    }

    if (b.action === "toggle") {
      if (typeof b.active !== "boolean")
        return json({ error: "Estado inválido." }, 400);
      await db
        .update(products)
        .set({ active: b.active ? 1 : 0 })
        .where(eq(products.id, b.id));
      return json({ ok: true });
    }

    if (b.action === "sale") {
      const existingSale = await db
        .select()
        .from(sales)
        .where(eq(sales.id, b.id))
        .get();

      if (existingSale) return json({ ok: true });

      if (
        !["Dinheiro", "Pix", "Cartão"].includes(b.payment) ||
        !Array.isArray(b.items) ||
        !b.items.length ||
        b.items.length > 100
      )
        return json(
          { error: "Confira o pedido e o pagamento." },
          400
        );

      const activeProducts = await db
        .select()
        .from(products)
        .where(eq(products.active, 1));

      let total = 0;
      const seen = new Set<string>();
      const lines = [];

      for (const i of b.items) {
        const p = activeProducts.find((p) => p.id === i.id);
        if (
          !p ||
          !Number.isInteger(i.qty) ||
          i.qty < 1 ||
          i.qty > 999 ||
          seen.has(i.id)
        ) {
          throw new Error("Confira os itens do pedido.");
        }
        seen.add(i.id);
        total += p.price * i.qty;
        lines.push({
          id: p.id,
          name: p.name,
          price: p.price,
          qty: i.qty,
        });
      }

      money(total);

      if (b.expectedTotal !== total)
        return json(
          {
            error:
              "Um preço mudou. Atualize o cardápio e confira o pedido.",
          },
          409
        );

      const received =
        b.payment === "Dinheiro" ? money(b.received) : total;

      if (received < total)
        return json(
          { error: "Valor recebido insuficiente." },
          400
        );

      await db.insert(sales).values({
        id: b.id,
        created: new Date().toISOString(),
        day: day(),
        lines: JSON.stringify(lines),
        payment: b.payment,
        total,
        received,
      });

      return json({ ok: true, total, change: received - total });
    }

    return json({ error: "Operação inválida." }, 400);
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "";
    const user = /Informe|Preencha|inválid|Confira|Data/.test(message);
    return json(
      {
        error: user
          ? message
          : "Não foi possível salvar. Seus dados permanecem na tela; tente novamente.",
      },
      user ? 400 : 503
    );
  }
}
