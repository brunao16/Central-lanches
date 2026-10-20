import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { products } from "@/db/schema";
import { apiError } from "@/lib/session";
import { storefront } from "@/lib/storefront";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const store = await storefront(new URL(req.url).searchParams.get("branch"));
    const menu = await getDb().select({ id: products.id, name: products.name, description: products.description, price: products.price, photo: products.photo, category: products.category, stock: products.stock, active: products.active }).from(products).where(and(eq(products.tenantId, store.tenantId), eq(products.active, 1))).orderBy(products.name);
    return NextResponse.json({ products: menu, store: { id: store.id, name: store.name } }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { return apiError(e); }
}
