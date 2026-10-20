import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tickets } from "@/db/schema";
import { apiError, HttpError, checkOrigin } from "@/lib/session";
import { storefront } from "@/lib/storefront";
import { priceItems, validId } from "@/lib/checkout";
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const b = await req.json();
    if (!validId(b.id)) throw new HttpError(400, "Identificador inválido.");
    const store = await storefront(b.branch || null);
    const info = [b.note || "", b.customerName || "", b.phone || "", b.address || "", b.table_num || ""];
    if (info.some(x => typeof x !== "string" || x.length > 500)) throw new HttpError(400, "Confira os dados do pedido.");
    if (!["table", "pickup", "delivery"].includes(b.orderType) || (b.orderType === "delivery" && (!b.customerName?.trim() || !b.phone?.trim() || !b.address?.trim()))) throw new HttpError(400, "Preencha nome, telefone e endereço para entrega.");
    await getDb().transaction(async tx => {
      const existing = await tx.select({ id: tickets.id }).from(tickets).where(and(eq(tickets.id, b.id), eq(tickets.tenantId, store.tenantId))).get();
      if (existing) return;
      const { lines, total } = await priceItems(tx, store.tenantId, b.items);
      if (total !== b.expectedTotal) throw new HttpError(409, "Os preços mudaram. Atualize o cardápio.");
      await tx.insert(tickets).values({ id: b.id, tenantId: store.tenantId, branch: store.id, items: JSON.stringify(lines), total, tableNum: b.table_num || "", note: `${b.orderType}: ${info.slice(0,4).filter(Boolean).join(" | ")}`, created: new Date().toISOString() });
    }, { behavior: "immediate" });
    return NextResponse.json({ ok: true, id: b.id });
  } catch (e) { return apiError(e); }
}
