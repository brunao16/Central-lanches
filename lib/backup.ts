import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { products, sales, expenses, branches } from "@/db/schema";
import { Session, HttpError, requireAdmin } from "@/lib/session";
import { validId, money, text, date } from "@/lib/checkout";

export async function exportBackup(session: Session) {
  requireAdmin(session);
  const db = getDb();
  return db.transaction(async tx => ({
    version: 1, tenantId: session.tenantId, created: new Date().toISOString(),
    products: await tx.select().from(products).where(eq(products.tenantId, session.tenantId)),
    sales: await tx.select().from(sales).where(eq(sales.tenantId, session.tenantId)),
    expenses: await tx.select().from(expenses).where(eq(expenses.tenantId, session.tenantId)),
  }));
}
export async function importBackup(session: Session, data: any) {
  requireAdmin(session);
  if (!data || (data.tenantId && data.tenantId !== session.tenantId)) throw new HttpError(400, "O backup pertence a outro estabelecimento.");
  for (const key of ["products", "sales", "expenses"]) if (!Array.isArray(data[key]) || data[key].length > 10000) throw new HttpError(400, "Backup inválido ou muito grande.");
  return getDb().transaction(async tx => {
    const allowed = new Set((await tx.select({ id: branches.id }).from(branches).where(eq(branches.tenantId, session.tenantId))).map(b => b.id));
    const branch = (v: unknown) => { if (typeof v !== "string" || !allowed.has(v)) throw new HttpError(400, "Backup contém uma filial não autorizada."); return v; };
    const id = (v: unknown) => { if (!validId(v)) throw new HttpError(400, "Backup contém um identificador inválido."); return v; };
    const timestamp = (v: unknown) => { if (typeof v !== "string" || !Number.isFinite(Date.parse(v))) throw new HttpError(400, "Data do backup inválida."); return v; };
    let imported = 0;
    for (const p of data.products) {
      const productId = id(p.id);
      if (!Number.isSafeInteger(p.stock) || p.stock < -1 || p.stock > 1000000 || ![0,1].includes(p.active)) throw new HttpError(400, "Produto do backup inválido.");
      const existing = await tx.select({ id: products.id }).from(products).where(and(eq(products.id, productId), eq(products.tenantId, session.tenantId))).get();
      if (existing) continue;
      await tx.insert(products).values({ id: productId, tenantId: session.tenantId, name: text(p.name), price: money(p.price,1), cost: money(p.cost??0), stock: p.stock, active: p.active, category: text(p.category||"Geral",80), description: typeof p.description === "string" ? p.description.slice(0,500) : "", photo: typeof p.photo === "string" && /^https:\/\//.test(p.photo) ? p.photo : null }); imported++;
    }
    for (const s of data.sales) {
      const saleId = id(s.id), rows = JSON.parse(s.lines);
      if (!Array.isArray(rows) || !rows.length || rows.length>100 || !["Pix","Dinheiro","Cartão"].includes(s.payment)) throw new HttpError(400, "Venda do backup inválida.");
      const lines = rows.map((l: any) => { if (!Number.isInteger(l.qty) || l.qty<1 || l.qty>999) throw new HttpError(400, "Quantidade inválida no backup."); return {id:id(l.id), name:text(l.name), price:money(l.price,1), qty:l.qty}; });
      const tip=money(s.tip??0), discount=money(s.discount??0), total=money(s.total), received=money(s.received);
      if (lines.reduce((sum: number,l: {price:number;qty:number})=>sum+l.price*l.qty,0)-discount+tip!==total || received<total) throw new HttpError(400,"Valores da venda não conferem.");
      const existing=await tx.select({id:sales.id}).from(sales).where(and(eq(sales.id,saleId),eq(sales.tenantId,session.tenantId))).get();
      if(existing) continue;
      await tx.insert(sales).values({id:saleId,tenantId:session.tenantId,created:timestamp(s.created),day:date(s.day),lines:JSON.stringify(lines),payment:s.payment,total,received,tip,discount,branch:branch(s.branch),employee:typeof s.employee==="string"?s.employee.slice(0,150):"",note:typeof s.note==="string"?s.note.slice(0,500):null,coupon:typeof s.coupon==="string"?s.coupon.slice(0,50):null,cancelledAt:s.cancelledAt?timestamp(s.cancelledAt):null,cancelledBy:s.cancelledAt?session.userId:null}); imported++;
    }
    for (const e of data.expenses) {
      const expenseId=id(e.id);
      if(await tx.select({id:expenses.id}).from(expenses).where(and(eq(expenses.id,expenseId),eq(expenses.tenantId,session.tenantId))).get()) continue;
      await tx.insert(expenses).values({id:expenseId,tenantId:session.tenantId,day:date(e.day),created:timestamp(e.created),merchant:text(e.merchant),amount:money(e.amount,1),branch:branch(e.branch),receipt:typeof e.receipt==="string"&&/^https:\/\//.test(e.receipt)?e.receipt:null});imported++;
    }
    return {ok:true, imported};
  }, {behavior:"immediate"});
}
