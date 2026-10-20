import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { products, sales, coupons, loyalty, loyaltyTransactions, customers } from "@/db/schema";
import { HttpError, Session, resolveBranch, requireAdmin } from "@/lib/session";

export const day = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
export const validId = (v: unknown): v is string => typeof v === "string" && /^[a-zA-Z0-9-]{10,80}$/.test(v);
export function money(v: unknown, minimum = 0): number {
  if (!Number.isSafeInteger(v) || Number(v) < minimum || Number(v) > 100000000) throw new HttpError(400, "Informe um valor válido.");
  return Number(v);
}
export function text(v: unknown, max = 150): string {
  if (typeof v !== "string" || !v.trim() || v.length > max) throw new HttpError(400, "Preencha os campos corretamente.");
  return v.trim();
}
export function date(v: unknown): string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(Date.parse(v)) || new Date(v).toISOString().slice(0, 10) !== v) throw new HttpError(400, "Data inválida.");
  return v;
}
type Db = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export async function priceItems(db: Db | Tx, tenantId: string, items: unknown) {
  if (!Array.isArray(items) || !items.length || items.length > 100) throw new HttpError(400, "Confira os itens do pedido.");
  const catalog = await db.select().from(products).where(and(eq(products.tenantId, tenantId), eq(products.active, 1)));
  const seen = new Set<string>();
  const lines = items.map(i => {
    const p = catalog.find(p => p.id === i?.id);
    if (!p || !Number.isInteger(i.qty) || i.qty < 1 || i.qty > 999 || seen.has(p.id)) throw new HttpError(400, "Confira os itens do pedido.");
    if (p.stock >= 0 && p.stock < i.qty) throw new HttpError(409, `Estoque insuficiente para ${p.name}.`);
    seen.add(p.id);
    return { id: p.id, name: p.name, price: p.price, qty: i.qty as number, category: p.category };
  });
  return { lines, total: money(lines.reduce((sum, i) => sum + i.price * i.qty, 0), 1) };
}
export async function priceCoupon(db: Db | Tx, tenantId: string, code: unknown, subtotal: number) {
  if (!code) return { discount: 0, coupon: null };
  const normalized = text(code, 50).toUpperCase();
  const coupon = await db.select().from(coupons).where(and(eq(coupons.tenantId, tenantId), eq(coupons.code, normalized), eq(coupons.active, 1))).get();
  if (!coupon || coupon.uses_left < 1 || coupon.valid_until < day()) throw new HttpError(400, "Cupom indisponível ou expirado.");
  const discount = Math.min(subtotal, coupon.type === "percent" ? Math.round(subtotal * coupon.value / 100) : coupon.value);
  return { discount: money(discount), coupon };
}
export async function checkout(session: Session, b: any) {
  if (!validId(b.id)) throw new HttpError(400, "Identificador inválido.");
  const branch = await resolveBranch(session, b.branch);
  return getDb().transaction(async tx => {
    const existing = await tx.select().from(sales).where(and(eq(sales.id, b.id), eq(sales.tenantId, session.tenantId))).get();
    if (existing) {
      if (existing.cancelledAt) throw new HttpError(409, "Esta venda foi cancelada.");
      return { ok: true, total: existing.total, change: existing.received - existing.total };
    }
    if (!["Dinheiro", "Pix", "Cartão"].includes(b.payment)) throw new HttpError(400, "Confira o pagamento.");
    const { lines, total: subtotal } = await priceItems(tx, session.tenantId, b.items);
    const { discount, coupon } = await priceCoupon(tx, session.tenantId, b.coupon, subtotal);
    const tip = money(b.tip ?? 0);
    if (b.expectedTotal !== subtotal || (b.discount ?? 0) !== discount) throw new HttpError(409, "O preço ou desconto mudou. Confira o pedido novamente.");
    const total = money(subtotal - discount + tip);
    const received = b.payment === "Dinheiro" ? money(b.received) : total;
    if (received < total) throw new HttpError(400, "Valor recebido insuficiente.");
    const split = b.split ?? 1;
    if (!Number.isInteger(split) || split < 1 || split > 100) throw new HttpError(400, "Divisão de pagamento inválida.");
    if (b.note != null && (typeof b.note !== "string" || b.note.length > 500)) throw new HttpError(400, "Observação muito longa.");
    for (const line of lines) {
      const updated = await tx.update(products).set({ stock: sql`case when ${products.stock} < 0 then -1 else ${products.stock} - ${line.qty} end` }).where(and(eq(products.tenantId, session.tenantId), eq(products.id, line.id), sql`(${products.stock} = -1 or ${products.stock} >= ${line.qty})`)).returning({ id: products.id });
      if (!updated.length) throw new HttpError(409, "O estoque mudou. Confira o pedido.");
    }
    if (coupon) {
      const used = await tx.update(coupons).set({ uses_left: sql`${coupons.uses_left} - 1` }).where(and(eq(coupons.id, coupon.id), eq(coupons.tenantId, session.tenantId), gte(coupons.uses_left, 1))).returning({ id: coupons.id });
      if (!used.length) throw new HttpError(409, "Cupom esgotado.");
    }
    let customerId: string | null = null;
    if (b.customerId) {
      const customer = await tx.select().from(customers).where(and(eq(customers.id, b.customerId), eq(customers.tenantId, session.tenantId))).get();
      if (!customer) throw new HttpError(400, "Cliente inválido.");
      customerId = customer.id;
    }
    await tx.insert(sales).values({ id: b.id, tenantId: session.tenantId, created: new Date().toISOString(), day: day(), lines: JSON.stringify(lines), payment: b.payment, total, received, branch: branch!, employee: session.name, tip, discount, coupon: coupon?.code ?? null, split, note: b.note || null, customer_id: customerId });
    if (customerId) {
      const pts = Math.floor((subtotal - discount) / 100);
      const existing = await tx.select().from(loyalty).where(and(eq(loyalty.tenantId, session.tenantId), eq(loyalty.customerId, customerId))).get();
      if (existing) await tx.update(loyalty).set({ points: existing.points + pts, totalEarned: existing.totalEarned + pts }).where(and(eq(loyalty.id, existing.id), eq(loyalty.tenantId, session.tenantId)));
      else await tx.insert(loyalty).values({ id: crypto.randomUUID(), tenantId: session.tenantId, customerId, points: pts, totalEarned: pts });
      await tx.insert(loyaltyTransactions).values({ id: crypto.randomUUID(), tenantId: session.tenantId, customerId, type: "earned", points: pts, description: `Venda ${b.id}`, created: new Date().toISOString() });
    }
    return { ok: true, total, change: received - total };
  }, { behavior: "immediate" });
}
export async function cancelSale(session: Session, id: string, restore = false) {
  requireAdmin(session);
  return getDb().transaction(async tx => {
    const sale = await tx.select().from(sales).where(and(eq(sales.id, id), eq(sales.tenantId, session.tenantId))).get();
    if (!sale) throw new HttpError(404, "Venda não encontrada.");
    if (Boolean(sale.cancelledAt) !== restore) return { ok: true };
    for (const line of JSON.parse(sale.lines)) {
      const updated = await tx.update(products).set({ stock: sql`case when ${products.stock} < 0 then -1 else ${products.stock} + ${restore ? -line.qty : line.qty} end` }).where(and(eq(products.id, line.id), eq(products.tenantId, session.tenantId), restore ? sql`(${products.stock} = -1 or ${products.stock} >= ${line.qty})` : undefined)).returning({ id: products.id });
      if (restore && !updated.length) throw new HttpError(409, "Estoque insuficiente para restaurar esta venda.");
    }
    if (sale.coupon) {
      const updated = await tx.update(coupons).set({ uses_left: sql`${coupons.uses_left} + ${restore ? -1 : 1}` }).where(and(eq(coupons.tenantId, session.tenantId), eq(coupons.code, sale.coupon), restore ? gte(coupons.uses_left, 1) : undefined)).returning({ id: coupons.id });
      if (restore && !updated.length) throw new HttpError(409, "Cupom indisponível para restaurar esta venda.");
    }
    if (sale.customer_id) {
      const pts = Math.floor((sale.total - sale.tip) / 100) * (restore ? 1 : -1);
      await tx.update(loyalty).set({ points: sql`${loyalty.points} + ${pts}`, totalEarned: sql`${loyalty.totalEarned} + ${pts}` }).where(and(eq(loyalty.tenantId, session.tenantId), eq(loyalty.customerId, sale.customer_id)));
      await tx.insert(loyaltyTransactions).values({ id: crypto.randomUUID(), tenantId: session.tenantId, customerId: sale.customer_id, type: restore ? "earned" : "reversal", points: pts, description: `${restore ? "Restauração" : "Cancelamento"} ${id}`, created: new Date().toISOString() });
    }
    await tx.update(sales).set({ cancelledAt: restore ? null : new Date().toISOString(), cancelledBy: restore ? null : session.userId }).where(and(eq(sales.id, id), eq(sales.tenantId, session.tenantId)));
    return { ok: true };
  }, { behavior: "immediate" });
}
