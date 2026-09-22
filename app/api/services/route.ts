import { NextResponse } from "next/server";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { tickets, restaurantTables, timeClock, loyalty, loyaltyTransactions, deliveries, nfes, sales } from "@/db/schema";

export const dynamic = "force-dynamic";

const day = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const action = u.searchParams.get("action") || "tickets";
    const db = getDb();

    if (action === "tickets") {
      const status = u.searchParams.get("status");
      const conditions = status ? [eq(tickets.status, status)] : [];
      const data = await db.select().from(tickets).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(tickets.created));
      return NextResponse.json({ tickets: data });
    }

    if (action === "tables") {
      const data = await db.select().from(restaurantTables).orderBy(restaurantTables.number);
      return NextResponse.json({ tables: data });
    }

    if (action === "time-clock") {
      const employee = u.searchParams.get("employee");
      const today = day();
      const conditions = [eq(timeClock.day, today)];
      if (employee) conditions.push(eq(timeClock.employee, employee));
      const data = await db.select().from(timeClock).where(and(...conditions)).orderBy(desc(timeClock.clockIn));
      return NextResponse.json({ records: data });
    }

    if (action === "loyalty") {
      const customerId = u.searchParams.get("customerId");
      if (customerId) {
        const data = await db.select().from(loyalty).where(eq(loyalty.customerId, customerId)).get();
        const txns = await db.select().from(loyaltyTransactions).where(eq(loyaltyTransactions.customerId, customerId)).orderBy(desc(loyaltyTransactions.created)).limit(50);
        return NextResponse.json({ loyalty: data, transactions: txns });
      }
      const data = await db.select().from(loyalty).orderBy(desc(loyalty.points));
      return NextResponse.json({ loyalty: data });
    }

    if (action === "deliveries") {
      const status = u.searchParams.get("status");
      const conditions = status ? [eq(deliveries.status, status)] : [];
      const data = await db.select().from(deliveries).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(deliveries.created));
      return NextResponse.json({ deliveries: data });
    }

    if (action === "nfes") {
      const data = await db.select().from(nfes).orderBy(desc(nfes.created)).limit(100);
      return NextResponse.json({ nfes: data });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao carregar dados." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as any;
    const db = getDb();

    if (b.action === "create-ticket") {
      if (!b.items || !Array.isArray(b.items) || !b.items.length)
        return NextResponse.json({ error: "Pedido vazio." }, { status: 400 });
      const id = crypto.randomUUID();
      await db.insert(tickets).values({
        id, items: JSON.stringify(b.items), status: "pending", priority: b.priority || 0,
        total: b.total || 0, tableNum: b.table_num || "", employee: b.employee || "",
        branch: b.branch || "principal", created: new Date().toISOString(), note: b.note || null,
      });
      return NextResponse.json({ ok: true, id });
    }

    if (b.action === "update-ticket") {
      if (!b.id || !b.status) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
      const updates: any = { status: b.status };
      if (b.status === "preparing") updates.startedAt = new Date().toISOString();
      if (b.status === "ready") updates.readyAt = new Date().toISOString();
      await db.update(tickets).set(updates).where(eq(tickets.id, b.id));
      return NextResponse.json({ ok: true });
    }

    if (b.action === "update-table") {
      if (!b.id) return NextResponse.json({ error: "ID necessário." }, { status: 400 });
      await db.update(restaurantTables).set({ status: b.status, currentOrder: b.currentOrder || null }).where(eq(restaurantTables.id, b.id));
      return NextResponse.json({ ok: true });
    }

    if (b.action === "create-table") {
      if (!b.number) return NextResponse.json({ error: "Número necessário." }, { status: 400 });
      const id = crypto.randomUUID();
      await db.insert(restaurantTables).values({
        id, number: b.number, name: b.name || `Mesa ${b.number}`,
        capacity: b.capacity || 4, status: "available", branch: b.branch || "principal",
      });
      return NextResponse.json({ ok: true, id });
    }

    if (b.action === "delete-table") {
      if (!b.id) return NextResponse.json({ error: "ID necessário." }, { status: 400 });
      await db.delete(restaurantTables).where(eq(restaurantTables.id, b.id));
      return NextResponse.json({ ok: true });
    }

    if (b.action === "clock-in") {
      if (!b.employee) return NextResponse.json({ error: "Funcionário necessário." }, { status: 400 });
      const id = crypto.randomUUID();
      await db.insert(timeClock).values({ id, employee: b.employee, clockIn: new Date().toISOString(), branch: b.branch || "principal", day: day() });
      return NextResponse.json({ ok: true, id });
    }

    if (b.action === "clock-out") {
      if (!b.id) return NextResponse.json({ error: "ID necessário." }, { status: 400 });
      await db.update(timeClock).set({ clockOut: new Date().toISOString() }).where(eq(timeClock.id, b.id));
      return NextResponse.json({ ok: true });
    }

    if (b.action === "add-points") {
      if (!b.customerId || !b.points) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
      const existing = await db.select().from(loyalty).where(eq(loyalty.customerId, b.customerId)).get();
      if (existing) {
        const newPoints = existing.points + b.points;
        const tier = newPoints >= 1000 ? "gold" : newPoints >= 500 ? "prata" : "bronze";
        await db.update(loyalty).set({ points: newPoints, totalEarned: existing.totalEarned + b.points, tier }).where(eq(loyalty.id, existing.id));
      } else {
        const tier = b.points >= 1000 ? "gold" : b.points >= 500 ? "prata" : "bronze";
        await db.insert(loyalty).values({ id: crypto.randomUUID(), customerId: b.customerId, points: b.points, totalEarned: b.points, tier });
      }
      await db.insert(loyaltyTransactions).values({ id: crypto.randomUUID(), customerId: b.customerId, type: "earned", points: b.points, description: b.description || "Compra", created: new Date().toISOString() });
      return NextResponse.json({ ok: true });
    }

    if (b.action === "redeem-points") {
      if (!b.customerId || !b.points) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
      const existing = await db.select().from(loyalty).where(eq(loyalty.customerId, b.customerId)).get();
      if (!existing || existing.points < b.points) return NextResponse.json({ error: "Pontos insuficientes." }, { status: 400 });
      await db.update(loyalty).set({ points: existing.points - b.points, totalRedeemed: existing.totalRedeemed + b.points }).where(eq(loyalty.id, existing.id));
      await db.insert(loyaltyTransactions).values({ id: crypto.randomUUID(), customerId: b.customerId, type: "redeemed", points: -b.points, description: b.description || "Resgate", created: new Date().toISOString() });
      return NextResponse.json({ ok: true });
    }

    if (b.action === "create-delivery") {
      if (!b.saleId || !b.customerName || !b.customerAddress) return NextResponse.json({ error: "Dados obrigatórios." }, { status: 400 });
      const id = crypto.randomUUID();
      await db.insert(deliveries).values({
        id, saleId: b.saleId, customerName: b.customerName, customerPhone: b.customerPhone || "",
        customerAddress: b.customerAddress, status: "pending", branch: b.branch || "principal",
        created: new Date().toISOString(), note: b.note || null,
      });
      return NextResponse.json({ ok: true, id });
    }

    if (b.action === "update-delivery") {
      if (!b.id || !b.status) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
      const updates: any = { status: b.status };
      if (b.status === "picked") updates.pickedAt = new Date().toISOString();
      if (b.status === "delivered") updates.deliveredAt = new Date().toISOString();
      if (b.driver) updates.driver = b.driver;
      await db.update(deliveries).set(updates).where(eq(deliveries.id, b.id));
      return NextResponse.json({ ok: true });
    }

    if (b.action === "emit-nfe") {
      if (!b.saleId) return NextResponse.json({ error: "Venda necessária." }, { status: 400 });
      const sale = await db.select().from(sales).where(eq(sales.id, b.saleId)).get();
      if (!sale) return NextResponse.json({ error: "Venda não encontrada." }, { status: 404 });
      const count = await db.select({ value: require("drizzle-orm").sql<number>`count(*)` }).from(nfes);
      const nfeNumber = (count[0]?.value || 0) + 1;
      await db.insert(nfes).values({
        id: crypto.randomUUID(), saleId: b.saleId, number: nfeNumber,
        cpfCnpj: b.cpfCnpj || "", created: new Date().toISOString(), status: "emitida",
      });
      return NextResponse.json({ ok: true, number: nfeNumber });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao processar." }, { status: 500 });
  }
}
