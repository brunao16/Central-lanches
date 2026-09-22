import { NextResponse } from "next/server";
import { eq, and, gte, lte, sql, desc, like, or } from "drizzle-orm";
import { getDb } from "@/db";
import { products, sales, expenses, users, branches, coupons } from "@/db/schema";

export const dynamic = "force-dynamic";

const json = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

const day = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

const validId = (v: unknown) => typeof v === "string" && /^[a-zA-Z0-9-]{10,80}$/.test(v);

function money(v: unknown) {
  if (!Number.isSafeInteger(v) || Number(v) < 1 || Number(v) > 100000000) throw new Error("Informe um valor válido.");
  return Number(v);
}

function name(v: unknown) {
  if (typeof v !== "string" || !v.trim() || v.length > 150) throw new Error("Preencha o nome (até 150 caracteres).");
  return v.trim();
}

function date(v: unknown) {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(Date.parse(v)) || new Date(v).toISOString().slice(0, 10) !== v)
    throw new Error("Data inválida.");
  return v;
}

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const action = u.searchParams.get("action") || "records";
    const db = getDb();

    if (action === "records") {
      const from = date(u.searchParams.get("from") || day().slice(0, 7) + "-01");
      const to = date(u.searchParams.get("to") || day());
      const branch = u.searchParams.get("branch") || "";
      const search = u.searchParams.get("search") || "";
      const page = parseInt(u.searchParams.get("page") || "1");
      const limit = parseInt(u.searchParams.get("limit") || "200");
      const offset = (page - 1) * limit;

      if (from > to) return json({ error: "Confira o período." }, 400);

      const conditions = [gte(sales.day, from), lte(sales.day, to)];
      if (branch) conditions.push(eq(sales.branch, branch));
      if (search) {
        conditions.push(
          or(
            like(sales.lines, `%${search}%`),
            like(sales.payment, `%${search}%`),
            like(sales.employee, `%${search}%`)
          )!
        );
      }

      const [p, s, e] = await Promise.all([
        db.select().from(products).orderBy(products.name),
        db.select().from(sales).where(and(...conditions)).orderBy(desc(sales.created)).limit(limit).offset(offset),
        db.select().from(expenses).where(and(gte(expenses.day, from), lte(expenses.day, to), branch ? eq(expenses.branch, branch) : undefined)).orderBy(desc(expenses.day)).limit(200),
      ]);

      const [revenueResult] = await db.select({ value: sql<number>`coalesce(sum(${sales.total}), 0)` }).from(sales).where(and(...conditions));
      const [costsResult] = await db.select({ value: sql<number>`coalesce(sum(${expenses.amount}), 0)` }).from(expenses).where(and(gte(expenses.day, from), lte(expenses.day, to)));
      const [countResult] = await db.select({ value: sql<number>`count(*)` }).from(sales).where(and(...conditions));

      return json({
        products: p,
        sales: s,
        expenses: e,
        totals: { revenue: revenueResult.value, costs: costsResult.value, count: countResult.value },
      });
    }

    if (action === "dashboard") {
      const from = date(u.searchParams.get("from") || day().slice(0, 7) + "-01");
      const to = date(u.searchParams.get("to") || day());
      const branch = u.searchParams.get("branch") || "";

      const conditions = [gte(sales.day, from), lte(sales.day, to)];
      if (branch) conditions.push(eq(sales.branch, branch));

      const [revenueResult] = await db.select({ value: sql<number>`coalesce(sum(${sales.total}), 0)` }).from(sales).where(and(...conditions));
      const [costsResult] = await db.select({ value: sql<number>`coalesce(sum(${expenses.amount}), 0)` }).from(expenses).where(and(gte(expenses.day, from), lte(expenses.day, to)));
      const [countResult] = await db.select({ value: sql<number>`count(*)` }).from(sales).where(and(...conditions));

      const dailySales = await db
        .select({
          day: sales.day,
          total: sql<number>`coalesce(sum(${sales.total}), 0)`,
          count: sql<number>`count(*)`,
        })
        .from(sales)
        .where(and(...conditions))
        .groupBy(sales.day)
        .orderBy(sales.day);

      const paymentStats = await db
        .select({
          payment: sales.payment,
          total: sql<number>`coalesce(sum(${sales.total}), 0)`,
          count: sql<number>`count(*)`,
        })
        .from(sales)
        .where(and(...conditions))
        .groupBy(sales.payment);

      const topProducts = await db
        .select({
          name: sql<string>`json_extract(${sales.lines}, '$[0].name')`,
          total: sql<number>`coalesce(sum(${sales.total}), 0)`,
        })
        .from(sales)
        .where(and(...conditions))
        .groupBy(sql`json_extract(${sales.lines}, '$[0].name')`)
        .orderBy(desc(sql<number>`coalesce(sum(${sales.total}), 0)`))
        .limit(10);

      return json({
        totals: { revenue: revenueResult.value, costs: costsResult.value, count: countResult.value },
        dailySales,
        paymentStats,
        topProducts,
      });
    }

    if (action === "branches") {
      const b = await db.select().from(branches).where(eq(branches.active, 1));
      return json({ branches: b });
    }

    if (action === "users") {
      const u = await db.select().from(users).where(eq(users.active, 1));
      return json({ users: u });
    }

    return json({ error: "Ação inválida." }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: "Não foi possível carregar os registros." }, 503);
  }
}

export async function POST(req: Request) {
  try {
    const db = getDb();
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const f = await req.formData();
      const action = f.get("action") as string;

      if (action === "upload-receipt") {
        const id = f.get("id");
        if (!validId(id)) return json({ error: "Identificador inválido." }, 400);
        const existing = await db.select().from(expenses).where(eq(expenses.id, id as string)).get();
        if (existing) return json({ ok: true });

        const merchantName = name(f.get("merchant"));
        const amountValue = money(Number(f.get("amount")));
        const dt = date(f.get("day"));
        const file = f.get("receipt") as File | null;
        let receiptUrl: string | null = null;

        if (file && file.size > 0) {
          if (file.size > 8 * 1024 * 1024) return json({ error: "Escolha uma imagem de até 8 MB." }, 400);
          if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
            return json({ error: "Use uma foto JPG, PNG ou WebP." }, 400);

          try {
            const { put } = await import("@vercel/blob");
            const blob = await put(`receipts/${id}`, file, { access: "public" });
            receiptUrl = blob.url;
          } catch (e) {
            console.error("Blob upload error:", e);
          }
        }

        await db.insert(expenses).values({
          id: id as string,
          day: dt,
          merchant: merchantName,
          amount: amountValue,
          receipt: receiptUrl,
          created: new Date().toISOString(),
          branch: (f.get("branch") as string) || "principal",
        });
        return json({ ok: true });
      }

      if (action === "upload-product-photo") {
        const id = f.get("id");
        if (!validId(id)) return json({ error: "Identificador inválido." }, 400);
        const file = f.get("photo") as File;
        if (!file || file.size === 0) return json({ error: "Selecione uma foto." }, 400);
        if (file.size > 5 * 1024 * 1024) return json({ error: "Foto de até 5 MB." }, 400);

        try {
          const { put } = await import("@vercel/blob");
          const blob = await put(`products/${id}`, file, { access: "public" });
          await db.update(products).set({ photo: blob.url }).where(eq(products.id, id as string));
          return json({ ok: true, url: blob.url });
        } catch (e) {
          return json({ error: "Erro ao enviar foto." }, 500);
        }
      }

      return json({ error: "Ação inválida." }, 400);
    }

    const b = (await req.json()) as any;

    if (b.action === "login") {
      if (!b.username || !b.password) return json({ error: "Preencha usuário e senha." }, 400);
      const user = await db.select().from(users).where(and(eq(users.username, b.username), eq(users.password, b.password), eq(users.active, 1))).get();
      if (!user) return json({ error: "Usuário ou senha incorretos." }, 401);
      return json({ ok: true, user: { id: user.id, name: user.name, role: user.role, branch: user.branch } });
    }

    if (b.action === "create-user") {
      if (!b.username || !b.password || !b.name) return json({ error: "Preencha todos os campos." }, 400);
      try {
        await db.insert(users).values({ id: crypto.randomUUID(), username: b.username, password: b.password, name: b.name, role: b.role || "caixa", branch: b.branch || "principal" });
        return json({ ok: true });
      } catch (e: any) {
        if (e.message?.includes("UNIQUE")) return json({ error: "Usuário já existe." }, 400);
        throw e;
      }
    }

    if (b.action === "create-branch") {
      if (!b.name) return json({ error: "Nome da filial é obrigatório." }, 400);
      await db.insert(branches).values({ id: crypto.randomUUID(), name: b.name, address: b.address || "", phone: b.phone || "" });
      return json({ ok: true });
    }

    if (!validId(b.id)) return json({ error: "Identificador inválido." }, 400);

    if (b.action === "product") {
      const n = name(b.name);
      const p = money(b.price);
      if (typeof b.description !== "string" || b.description.length > 500) return json({ error: "Descrição muito longa." }, 400);
      const existing = await db.select().from(products).where(eq(products.id, b.id)).get();
      if (existing) {
        await db.update(products).set({ name: n, description: b.description, price: p, category: b.category || "Geral", stock: b.stock ?? -1, cost: b.cost ?? 0 }).where(eq(products.id, b.id));
      } else {
        await db.insert(products).values({ id: b.id, name: n, description: b.description, price: p, active: 1, category: b.category || "Geral", stock: b.stock ?? -1, cost: b.cost ?? 0 });
      }
      return json({ ok: true });
    }

    if (b.action === "toggle") {
      if (typeof b.active !== "boolean") return json({ error: "Estado inválido." }, 400);
      await db.update(products).set({ active: b.active ? 1 : 0 }).where(eq(products.id, b.id));
      return json({ ok: true });
    }

    if (b.action === "delete-product") {
      await db.delete(products).where(eq(products.id, b.id));
      return json({ ok: true });
    }

    if (b.action === "apply-coupon") {
      if (!b.code) return json({ error: "Informe o código do cupom." }, 400);
      const coupon = await db.select().from(coupons).where(and(eq(coupons.code, b.code.toUpperCase()), eq(coupons.active, 1))).get();
      if (!coupon) return json({ error: "Cupom não encontrado." }, 404);
      if (coupon.uses_left <= 0) return json({ error: "Cupom esgotado." }, 400);
      if (new Date(coupon.valid_until) < new Date()) return json({ error: "Cupom expirado." }, 400);
      let discount = 0;
      if (coupon.type === "percent") {
        discount = Math.round((b.subtotal || 0) * coupon.value / 100);
      } else {
        discount = Math.min(coupon.value, b.subtotal || 0);
      }
      await db.update(coupons).set({ uses_left: coupon.uses_left - 1 }).where(eq(coupons.id, coupon.id));
      return json({ ok: true, discount, type: coupon.type, value: coupon.value });
    }

    if (b.action === "create-coupon") {
      if (!b.code || !b.value) return json({ error: "Preencha código e valor." }, 400);
      try {
        await db.insert(coupons).values({ id: crypto.randomUUID(), code: b.code.toUpperCase(), type: b.type || "percent", value: b.value, uses_left: b.uses_left || 1, valid_until: b.valid_until || "2099-12-31" });
        return json({ ok: true });
      } catch (e: any) {
        if (e.message?.includes("UNIQUE")) return json({ error: "Cupom já existe." }, 400);
        throw e;
      }
    }

    if (b.action === "quick-sale") {
      if (!b.items || !Array.isArray(b.items) || !b.items.length) return json({ error: "Pedido vazio." }, 400);
      const id = crypto.randomUUID();
      let total = 0;
      const lines = b.items.map((item: any) => { total += (item.price || 0) * (item.qty || 1); return { id: item.id || "avulso", name: item.name, price: item.price, qty: item.qty || 1 }; });
      await db.insert(sales).values({
        id, created: new Date().toISOString(), day: day(), lines: JSON.stringify(lines),
        payment: b.payment || "Dinheiro", total, received: total,
        branch: b.branch || "principal", employee: b.employee || "",
      });
      return json({ ok: true, total });
    }

    if (b.action === "sale") {
      const existingSale = await db.select().from(sales).where(eq(sales.id, b.id)).get();
      if (existingSale) return json({ ok: true });
      if (!["Dinheiro", "Pix", "Cartão"].includes(b.payment) || !Array.isArray(b.items) || !b.items.length || b.items.length > 100)
        return json({ error: "Confira o pedido e o pagamento." }, 400);

      const activeProducts = await db.select().from(products).where(eq(products.active, 1));
      let total = 0;
      const seen = new Set<string>();
      const lines = [];

      for (const i of b.items) {
        const p = activeProducts.find((p) => p.id === i.id);
        if (!p || !Number.isInteger(i.qty) || i.qty < 1 || i.qty > 999 || seen.has(i.id)) throw new Error("Confira os itens do pedido.");
        seen.add(i.id);
        total += p.price * i.qty;
        lines.push({ id: p.id, name: p.name, price: p.price, qty: i.qty });
        if (p.stock >= 0) {
          const newStock = p.stock - i.qty;
          if (newStock < 0) throw new Error(`Estoque insuficiente para ${p.name}.`);
          await db.update(products).set({ stock: newStock }).where(eq(products.id, p.id));
        }
      }

      money(total);
      if (b.expectedTotal !== total) return json({ error: "Um preço mudou. Atualize o cardápio e confira o pedido." }, 409);

      const received = b.payment === "Dinheiro" ? money(b.received) : total;
      if (received < total) return json({ error: "Valor recebido insuficiente." }, 400);

      await db.insert(sales).values({
        id: b.id,
        created: new Date().toISOString(),
        day: day(),
        lines: JSON.stringify(lines),
        payment: b.payment,
        total,
        received,
        branch: b.branch || "principal",
        employee: b.employee || "",
        note: b.note || null,
      });
      return json({ ok: true, total, change: received - total });
    }

    if (b.action === "delete-sale") {
      await db.delete(sales).where(eq(sales.id, b.id));
      return json({ ok: true });
    }

    return json({ error: "Operação inválida." }, 400);
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "";
    const user = /Informe|Preencha|inválid|Confira|Data|Estoque/.test(message);
    return json({ error: user ? message : "Não foi possível salvar." }, user ? 400 : 503);
  }
}
