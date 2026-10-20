import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { branches } from "@/db/schema";
import { HttpError } from "@/lib/session";

export async function storefront(branchId: string | null) {
  const list = await getDb().select({ id: branches.id, tenantId: branches.tenantId, name: branches.name }).from(branches).where(and(eq(branches.active, 1), branchId ? eq(branches.id, branchId) : undefined)).limit(2);
  if (list.length !== 1) throw new HttpError(404, "Abra o link do cardápio fornecido pelo estabelecimento.");
  return list[0];
}
