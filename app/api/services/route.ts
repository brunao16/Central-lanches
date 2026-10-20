import { priceItems, money, text } from "@/lib/checkout";
import { withSession, requireAdmin, resolveBranch, HttpError, apiError } from "@/lib/session";
import { NextResponse } from "next/server";
import { eq, and, gte, lte, desc, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { tickets, restaurantTables, timeClock, loyalty, loyaltyTransactions, deliveries, nfes, sales, customers } from "@/db/schema";

export const dynamic = "force-dynamic";

const day = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

export const GET = withSession(async (req, session) => {
  try {
    const u = new URL(req.url);
    const action = u.searchParams.get("action") || "tickets";
    const db = getDb();

    if (action === "tickets") {
      const status = u.searchParams.get("status");
      const conditions = status ? [eq(tickets.status, status)] : [];
      const data = await db.select().from(tickets).where(and(eq(tickets.tenantId, session.tenantId), conditions.length ? and(...conditions) : undefined)).orderBy(desc(tickets.created));
      return NextResponse.json({ tickets: data });
    }

    if (action === "tables") {
      const data = await db.select().from(restaurantTables).where(and(eq(restaurantTables.tenantId, session.tenantId))).orderBy(restaurantTables.number);
      return NextResponse.json({ tables: data });
    }

    if (action === "time-clock") {
      const employee = session.role === "admin" ? u.searchParams.get("employee") : session.name;
      const today = day();
      const conditions = [eq(timeClock.day, today)];
      if (employee) conditions.push(eq(timeClock.employee, employee));
      const data = await db.select().from(timeClock).where(and(eq(timeClock.tenantId, session.tenantId), and(...conditions))).orderBy(desc(timeClock.clockIn));
      return NextResponse.json({ records: data });
    }

    if (action === "loyalty") {
      const customerId = u.searchParams.get("customerId");
      if (customerId) {
        const data = await db.select().from(loyalty).where(and(eq(loyalty.tenantId, session.tenantId), eq(loyalty.customerId, customerId))).get();
        const txns = await db.select().from(loyaltyTransactions).where(and(eq(loyaltyTransactions.tenantId, session.tenantId), eq(loyaltyTransactions.customerId, customerId))).orderBy(desc(loyaltyTransactions.created)).limit(50);
        return NextResponse.json({ loyalty: data, transactions: txns });
      }
      const data = await db.select().from(loyalty).where(and(eq(loyalty.tenantId, session.tenantId))).orderBy(desc(loyalty.points));
      return NextResponse.json({ loyalty: data });
    }

    if (action === "deliveries") {
      const status = u.searchParams.get("status");
      const conditions = status ? [eq(deliveries.status, status)] : [];
      const data = await db.select().from(deliveries).where(and(eq(deliveries.tenantId, session.tenantId), conditions.length ? and(...conditions) : undefined)).orderBy(desc(deliveries.created));
      return NextResponse.json({ deliveries: data });
    }

    if (action === "nfes") {
      const data = await db.select().from(nfes).where(and(eq(nfes.tenantId, session.tenantId))).orderBy(desc(nfes.created)).limit(100);
      return NextResponse.json({ nfes: data });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (e) {
    if (e instanceof HttpError) return apiError(e);
    console.error(e);
    return NextResponse.json({ error: "Erro ao carregar dados." }, { status: 500 });
  }
});
export const POST = withSession(async (req, session) => {
  try {
    const b = (await req.json()) as any;
    const db = getDb();
    if (["create-table", "delete-table", "add-points", "redeem-points", "emit-nfe"].includes(b.action)) requireAdmin(session);
    const allowedStatuses: Record<string, string[]> = { "update-ticket": ["pending", "preparing", "ready", "delivered", "cancelled"], "update-table": ["available", "occupied", "reserved"], "update-delivery": ["pending", "accepted", "picked", "delivered"] };
    if (allowedStatuses[b.action] && !allowedStatuses[b.action].includes(b.status)) throw new HttpError(400, "Estado inválido.");
    if (b.action === "clock-in" && session.role !== "admin") b.employee = session.name;
    if (b.action === "clock-out" && session.role !== "admin") {
      const entry = await db.select().from(timeClock).where(and(eq(timeClock.tenantId,session.tenantId),eq(timeClock.id,b.id),eq(timeClock.employee,session.name))).get();
      if (!entry) throw new HttpError(403,"Registro não autorizado.");
    }
    if (b.action === "create-delivery") {
      const sale = await db.select({id:sales.id}).from(sales).where(and(eq(sales.tenantId,session.tenantId),eq(sales.id,b.saleId),isNull(sales.cancelledAt))).get();
      if (!sale) throw new HttpError(404,"Venda não encontrada.");
    }

    if (b.action === "create-ticket") {
      const priced = await priceItems(db, session.tenantId, b.items);
      if (!b.items || !Array.isArray(b.items) || !b.items.length)
        return NextResponse.json({ error: "Pedido vazio." }, { status: 400 });
      const id = crypto.randomUUID();
      await db.insert(tickets).values({ ...({
        id, items: JSON.stringify(priced.lines), status: "pending", priority: b.priority || 0,
        total: priced.total, tableNum: b.table_num || "", employee: b.employee || "",
        branch: (await resolveBranch(session, b.branch))!, created: new Date().toISOString(), note: b.note || null,
      }), tenantId: session.tenantId });
      return NextResponse.json({ ok: true, id });
    }

    if (b.action === "update-ticket") {
      if (!b.id || !b.status) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
      const updates: any = { status: b.status };
      if (b.status === "preparing") updates.startedAt = new Date().toISOString();
      if (b.status === "ready") updates.readyAt = new Date().toISOString();
      await db.update(tickets).set(updates).where(and(eq(tickets.tenantId, session.tenantId), eq(tickets.id, b.id)));
      return NextResponse.json({ ok: true });
    }

    if (b.action === "update-table") {
      if (!b.id) return NextResponse.json({ error: "ID necessário." }, { status: 400 });
      await db.update(restaurantTables).set({ status: b.status, currentOrder: b.currentOrder || null }).where(and(eq(restaurantTables.tenantId, session.tenantId), eq(restaurantTables.id, b.id)));
      return NextResponse.json({ ok: true });
    }

    if (b.action === "create-table") {
      if (!b.number) return NextResponse.json({ error: "Número necessário." }, { status: 400 });
      const id = crypto.randomUUID();
      await db.insert(restaurantTables).values({ ...({
        id, number: b.number, name: b.name || `Mesa ${b.number}`,
        capacity: b.capacity || 4, status: "available", branch: (await resolveBranch(session, b.branch))!,
      }), tenantId: session.tenantId });
      return NextResponse.json({ ok: true, id });
    }

    if (b.action === "delete-table") {
      if (!b.id) return NextResponse.json({ error: "ID necessário." }, { status: 400 });
      await db.delete(restaurantTables).where(and(eq(restaurantTables.tenantId, session.tenantId), eq(restaurantTables.id, b.id)));
      return NextResponse.json({ ok: true });
    }

    if (b.action === "clock-in") {
      if (!b.employee) return NextResponse.json({ error: "Funcionário necessário." }, { status: 400 });
      const id = crypto.randomUUID();
      await db.insert(timeClock).values({ ...({ id, employee: b.employee, clockIn: new Date().toISOString(), branch: (await resolveBranch(session, b.branch))!, day: day() }), tenantId: session.tenantId });
      return NextResponse.json({ ok: true, id });
    }

    if (b.action === "clock-out") {
      if (!b.id) return NextResponse.json({ error: "ID necessário." }, { status: 400 });
      await db.update(timeClock).set({ clockOut: new Date().toISOString() }).where(and(eq(timeClock.tenantId, session.tenantId), eq(timeClock.id, b.id)));
      return NextResponse.json({ ok: true });
    }

    if (b.action === "add-points" || b.action === "redeem-points") {
      const points = money(b.points,1), redeem = b.action === "redeem-points";
      const customer = await db.select({id:customers.id}).from(customers).where(and(eq(customers.tenantId,session.tenantId),eq(customers.id,b.customerId))).get();
      if (!customer) throw new HttpError(404,"Cliente não encontrado.");
      await db.transaction(async tx => {
        const existing = await tx.select().from(loyalty).where(and(eq(loyalty.tenantId,session.tenantId),eq(loyalty.customerId,b.customerId))).get();
        if (redeem && (!existing || existing.points < points)) throw new HttpError(400,"Pontos insuficientes.");
        const balance = (existing?.points || 0) + (redeem ? -points : points);
        const tier = balance >= 1000 ? "gold" : balance >= 500 ? "prata" : "bronze";
        if (existing) await tx.update(loyalty).set({points:balance,tier,totalEarned:existing.totalEarned+(redeem?0:points),totalRedeemed:existing.totalRedeemed+(redeem?points:0)}).where(and(eq(loyalty.tenantId,session.tenantId),eq(loyalty.id,existing.id)));
        else await tx.insert(loyalty).values({id:crypto.randomUUID(),tenantId:session.tenantId,customerId:b.customerId,points:balance,totalEarned:points,tier});
        await tx.insert(loyaltyTransactions).values({id:crypto.randomUUID(),tenantId:session.tenantId,customerId:b.customerId,type:redeem?"redeemed":"earned",points:redeem?-points:points,description:text(b.description|| (redeem?"Resgate":"Bônus"),500),created:new Date().toISOString()});
      }, {behavior:"immediate"});
      return NextResponse.json({ok:true});
    }

    if (b.action === "create-delivery") {
      if (!b.saleId || !b.customerName || !b.customerAddress) return NextResponse.json({ error: "Dados obrigatórios." }, { status: 400 });
      const id = crypto.randomUUID();
      await db.insert(deliveries).values({ ...({
        id, saleId: b.saleId, customerName: b.customerName, customerPhone: b.customerPhone || "",
        customerAddress: b.customerAddress, status: "pending", branch: (await resolveBranch(session, b.branch))!,
        created: new Date().toISOString(), note: b.note || null,
      }), tenantId: session.tenantId });
      return NextResponse.json({ ok: true, id });
    }

    if (b.action === "update-delivery") {
      if (!b.id || !b.status) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
      const updates: any = { status: b.status };
      if (b.status === "picked") updates.pickedAt = new Date().toISOString();
      if (b.status === "delivered") updates.deliveredAt = new Date().toISOString();
      if (b.driver) updates.driver = b.driver;
      await db.update(deliveries).set(updates).where(and(eq(deliveries.tenantId, session.tenantId), eq(deliveries.id, b.id)));
      return NextResponse.json({ ok: true });
    }

    if (b.action === "emit-nfe") {
      throw new HttpError(503,"A emissão fiscal ainda não está integrada. Nenhuma nota foi emitida.");
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (e) {
    if (e instanceof HttpError) return apiError(e);
    console.error(e);
    return NextResponse.json({ error: "Erro ao processar." }, { status: 500 });
  }
});
