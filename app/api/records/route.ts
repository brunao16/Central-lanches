import { NextResponse } from "next/server";
import { eq, and, gte, lte, sql, desc, like, or, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { products, sales, expenses, users, branches, coupons } from "@/db/schema";
import { withSession, requireAdmin, resolveBranch, HttpError } from "@/lib/session";
import { hashPassword } from "@/lib/auth";
import { exportBackup, importBackup } from "@/lib/backup";
import { checkout, cancelSale, priceCoupon, priceItems, day, date, validId, money, text } from "@/lib/checkout";

export const dynamic = "force-dynamic";
const json = (data: unknown) => NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });

export const GET = withSession(async (req, session) => {
  const u = new URL(req.url), db = getDb();
  const action = u.searchParams.get("action") || "records";
  if (action === "backup") return json(await exportBackup(session));
  if (action === "branches") return json({ branches: await db.select({ id: branches.id, name: branches.name }).from(branches).where(and(eq(branches.tenantId, session.tenantId), eq(branches.active, 1), session.role !== "admin" ? eq(branches.id, session.branch) : undefined)) });
  if (action === "users") {
    requireAdmin(session);
    return json({ users: await db.select({ id: users.id, username: users.username, name: users.name, role: users.role, branch: users.branch, active: users.active }).from(users).where(eq(users.tenantId, session.tenantId)) });
  }
  if (!["records", "dashboard"].includes(action)) throw new HttpError(400, "Ação inválida.");
  const from = date(u.searchParams.get("from") || day().slice(0,7) + "-01"), to = date(u.searchParams.get("to") || day());
  if (from > to) throw new HttpError(400, "Confira o período.");
  const branch = await resolveBranch(session, u.searchParams.get("branch"), true);
  const search = (u.searchParams.get("search") || "").slice(0, 150);
  const page = Number(u.searchParams.get("page") || 1), limit = Number(u.searchParams.get("limit") || 200);
  if (!Number.isInteger(page) || page < 1 || page > 100000 || !Number.isInteger(limit) || limit < 1 || limit > 200) throw new HttpError(400, "Paginação inválida.");
  const sc = and(eq(sales.tenantId, session.tenantId), isNull(sales.cancelledAt), gte(sales.day, from), lte(sales.day, to), branch ? eq(sales.branch, branch) : undefined, search ? or(like(sales.lines, `%${search}%`), like(sales.payment, `%${search}%`), like(sales.employee, `%${search}%`)) : undefined);
  const ec = and(eq(expenses.tenantId, session.tenantId), gte(expenses.day, from), lte(expenses.day, to), branch ? eq(expenses.branch, branch) : undefined);
  const [revenue, costs, count] = await Promise.all([
    db.select({ value: sql<number>`coalesce(sum(${sales.total}),0)` }).from(sales).where(sc).get(),
    db.select({ value: sql<number>`coalesce(sum(${expenses.amount}),0)` }).from(expenses).where(ec).get(),
    db.select({ value: sql<number>`count(*)` }).from(sales).where(sc).get(),
  ]);
  const totals = { revenue: revenue?.value || 0, costs: costs?.value || 0, count: count?.value || 0 };
  if (action === "dashboard") {
    const data = await db.select().from(sales).where(sc);
    const ranking = new Map<string, { name: string; total: number; qty: number }>();
    for (const sale of data) for (const line of JSON.parse(sale.lines)) {
      const p = ranking.get(line.id) || { name: line.name, total: 0, qty: 0 };
      p.total += line.price * line.qty; p.qty += line.qty; ranking.set(line.id, p);
    }
    const dailySales = await db.select({ day: sales.day, total: sql<number>`sum(${sales.total})`, count: sql<number>`count(*)` }).from(sales).where(sc).groupBy(sales.day).orderBy(sales.day);
    const paymentStats = await db.select({ payment: sales.payment, total: sql<number>`sum(${sales.total})`, count: sql<number>`count(*)` }).from(sales).where(sc).groupBy(sales.payment);
    return json({ totals, dailySales, paymentStats, topProducts: [...ranking.values()].sort((a,b) => b.total-a.total).slice(0,10) });
  }
  const [p,s,e] = await Promise.all([
    db.select().from(products).where(eq(products.tenantId, session.tenantId)).orderBy(products.name),
    db.select().from(sales).where(sc).orderBy(desc(sales.created)).limit(limit).offset((page-1)*limit),
    db.select().from(expenses).where(ec).orderBy(desc(expenses.day)).limit(200),
  ]);
  return json({ products:p, sales:s, expenses:e, totals });
});

export const POST = withSession(async (req, session) => {
  const db = getDb();
  if (req.headers.get("content-type")?.includes("multipart/form-data")) {
    const f = await req.formData(), action = f.get("action"), id = f.get("id");
    if (!validId(id)) throw new HttpError(400, "Identificador inválido.");
    if (action === "upload-product-photo") {
      requireAdmin(session);
      const product = await db.select().from(products).where(and(eq(products.id,id),eq(products.tenantId,session.tenantId))).get();
      if (!product) throw new HttpError(404, "Produto não encontrado.");
      const file = f.get("photo");
      if (!(file instanceof File) || !file.size || file.size > 5*1024*1024 || !["image/jpeg","image/png","image/webp"].includes(file.type)) throw new HttpError(400, "Use JPG, PNG ou WebP de até 5 MB.");
      const { put } = await import("@vercel/blob");
      const blob = await put(`products/${session.tenantId}/${id}`, file, { access:"public" });
      await db.update(products).set({photo:blob.url}).where(and(eq(products.id,id),eq(products.tenantId,session.tenantId)));
      return json({ok:true,url:blob.url});
    }
    if (action !== "upload-receipt") throw new HttpError(400,"Ação inválida.");
    const existing = await db.select().from(expenses).where(and(eq(expenses.id,id),eq(expenses.tenantId,session.tenantId))).get();
    if (existing) return json({ok:true});
    const merchant = text(f.get("merchant")), amount = money(Number(f.get("amount")),1), dt = date(f.get("day"));
    const branch = await resolveBranch(session, f.get("branch") as string);
    const file = f.get("receipt"); let receipt: string|null = null;
    if (file instanceof File && file.size) {
      if (file.size > 8*1024*1024 || !["image/jpeg","image/png","image/webp"].includes(file.type)) throw new HttpError(400,"Use JPG, PNG ou WebP de até 8 MB.");
      const { put } = await import("@vercel/blob");
      receipt = (await put(`receipts/${session.tenantId}/${id}`, file, { access:"public" })).url;
    }
    await db.insert(expenses).values({id,tenantId:session.tenantId,day:dt,merchant,amount,receipt,branch:branch!,created:new Date().toISOString()});
    return json({ok:true});
  }
  const b = await req.json();
  if (b.action === "sale" || b.action === "quick-sale") return json(await checkout(session,b));
  if (b.action === "apply-coupon") {
    const { total } = await priceItems(db,session.tenantId,b.items);
    const {discount,coupon} = await priceCoupon(db,session.tenantId,b.code,total);
    return json({ok:true,discount,code:coupon?.code});
  }
  if (b.action === "update-profile") {
    const name = text(b.name), email = text(b.email,254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400,"Email inválido.");
    const existing = await db.select({id:users.id}).from(users).where(eq(users.username,email)).get();
    if (existing && existing.id !== session.userId) throw new HttpError(409,"Email já cadastrado.");
    await db.update(users).set({name,username:email}).where(and(eq(users.id,session.userId),eq(users.tenantId,session.tenantId)));
    return json({ok:true});
  }
  requireAdmin(session);
  if (b.action === "create-user") {
    const username=text(b.username,254).toLowerCase(), name=text(b.name);
    if (typeof b.password !== "string" || b.password.length < 8 || b.password.length > 72 || !["admin","caixa"].includes(b.role || "caixa")) throw new HttpError(400,"Use senha de 8 a 72 caracteres e perfil válido.");
    const branch=await resolveBranch(session,b.branch);
    if (await db.select({id:users.id}).from(users).where(eq(users.username,username)).get()) throw new HttpError(409,"Usuário já existe.");
    await db.insert(users).values({id:crypto.randomUUID(),tenantId:session.tenantId,username,password:await hashPassword(b.password),name,role:b.role||"caixa",branch:branch!,plan:session.plan});
    return json({ok:true});
  }
  if (b.action === "create-branch") {
    await db.insert(branches).values({id:crypto.randomUUID(),tenantId:session.tenantId,name:text(b.name),address:b.address||"",phone:b.phone||""});
    return json({ok:true});
  }
  if (b.action === "create-coupon") {
    const code=text(b.code,50).toUpperCase(), value=money(b.value,1), type=b.type||"percent", uses=b.uses_left??1;
    if (!["percent","fixed"].includes(type) || (type==="percent" && value>100) || !Number.isInteger(uses) || uses<1) throw new HttpError(400,"Cupom inválido.");
    if (await db.select().from(coupons).where(and(eq(coupons.tenantId,session.tenantId),eq(coupons.code,code))).get()) throw new HttpError(409,"Cupom já existe.");
    await db.insert(coupons).values({id:crypto.randomUUID(),tenantId:session.tenantId,code,value,type,uses_left:uses,valid_until:date(b.valid_until||"2099-12-31")});
    return json({ok:true});
  }
  if (b.action === "import") return json(await importBackup(session, b.data));
  if (!validId(b.id)) throw new HttpError(400,"Identificador inválido.");
  if (b.action === "delete-sale" || b.action === "restore-sale") return json(await cancelSale(session,b.id,b.action==="restore-sale"));
  if (b.action === "product") {
    const name=text(b.name), price=money(b.price,1), cost=money(b.cost??0), stock=b.stock??-1;
    if (!Number.isSafeInteger(stock) || stock < -1 || stock > 1000000 || typeof b.description !== "string" || b.description.length>500) throw new HttpError(400,"Confira descrição e estoque.");
    const values={name,price,cost,stock,description:b.description,category:text(b.category||"Geral",80)};
    const existing=await db.select().from(products).where(and(eq(products.id,b.id),eq(products.tenantId,session.tenantId))).get();
    if(existing) await db.update(products).set(values).where(and(eq(products.id,b.id),eq(products.tenantId,session.tenantId)));
    else await db.insert(products).values({id:b.id,tenantId:session.tenantId,...values});
    return json({ok:true});
  }
  if (b.action === "toggle" || b.action === "delete-product") {
    if(b.action === "toggle" && typeof b.active !== "boolean") throw new HttpError(400,"Estado inválido.");
    const updated=await db.update(products).set({active:b.action==="delete-product"?0:b.active?1:0}).where(and(eq(products.id,b.id),eq(products.tenantId,session.tenantId))).returning({id:products.id});
    if(!updated.length) throw new HttpError(404,"Produto não encontrado.");
    return json({ok:true});
  }
  throw new HttpError(400,"Operação inválida.");
});
