import { priceItems } from "@/lib/checkout";
import { withSession, requireAdmin, resolveBranch, HttpError, apiError } from "@/lib/session";
import { NextResponse } from "next/server";
import { eq, and, gte, lte, desc, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { orders } from "@/db/schema";

export const dynamic = "force-dynamic";

const day = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

export const GET = withSession(async (req, session) => {
  try {
    const u = new URL(req.url);
    const status = u.searchParams.get("status");
    const db = getDb();
    const today = day();

    const conditions = [eq(orders.day, today)];
    if (status) conditions.push(eq(orders.status, status));

    const data = await db.select().from(orders).where(and(eq(orders.tenantId, session.tenantId), and(...conditions))).orderBy(orders.created);

    return NextResponse.json({ orders: data });
  } catch (e) {
    if (e instanceof HttpError) return apiError(e);
    console.error(e);
    return NextResponse.json({ error: "Erro ao carregar pedidos." }, { status: 500 });
  }
});
export const POST = withSession(async (req, session) => {
  try {
    const b = (await req.json()) as any;
    const db = getDb();

    if (b.action === "create") {
      const priced = await priceItems(db, session.tenantId, b.items);
      if (!b.items || !Array.isArray(b.items) || !b.items.length)
        return NextResponse.json({ error: "Pedido vazio." }, { status: 400 });

      const id = crypto.randomUUID();
      await db.insert(orders).values({ ...({
        id,
        created: new Date().toISOString(),
        day: day(),
        items: JSON.stringify(priced.lines),
        status: "pending",
        total: priced.total,
        branch: (await resolveBranch(session, b.branch))!,
        table_num: b.table_num || "",
        note: b.note || null,
      }), tenantId: session.tenantId });
      return NextResponse.json({ ok: true, id });
    }

    if (b.action === "update-status") {
      if (!["pending","preparing","ready","delivered","cancelled"].includes(b.status)) throw new HttpError(400,"Estado inválido.");
      if (!b.id || !b.status) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

      const updates: any = { status: b.status };
      if (b.status === "ready") updates.ready_at = new Date().toISOString();
      if (b.status === "delivered") updates.delivered_at = new Date().toISOString();

      await db.update(orders).set(updates).where(and(eq(orders.tenantId, session.tenantId), eq(orders.id, b.id)));
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (e) {
    if (e instanceof HttpError) return apiError(e);
    console.error(e);
    return NextResponse.json({ error: "Erro ao processar pedido." }, { status: 500 });
  }
});
