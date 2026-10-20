import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { users, branches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, createToken } from "@/lib/auth";
import { apiError, HttpError, requireSession, checkOrigin } from "@/lib/session";

export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const body = await req.json();
    if (body.action === "logout") {
      const response = NextResponse.json({ ok: true });
      response.cookies.set("cl_token", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
      return response;
    }
    if (body.action === "me") {
      const session = await requireSession(req);
      return NextResponse.json({ ok: true, user: { ...session, id: session.userId } });
    }
    const db = getDb();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || email.length > 254 || typeof body.password !== "string" || body.password.length > 72) throw new HttpError(400, "Confira o usuário e a senha (até 72 caracteres).");
    let user;
    if (body.action === "login") {
      user = await db.select().from(users).where(eq(users.username, email)).get();
      if (!user || !/^\$2[aby]\$/.test(user.password) || !await verifyPassword(body.password, user.password)) throw new HttpError(401, "Usuário ou senha incorretos.");
      if (user.active !== 1 || !user.tenantId) throw new HttpError(403, "Conta indisponível. Contate o administrador.");
    } else if (body.action === "register") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || body.password.length < 8 || typeof body.name !== "string" || !body.name.trim() || body.name.length > 150 || typeof body.restaurantName !== "string" || !body.restaurantName.trim() || body.restaurantName.length > 150) throw new HttpError(400, "Preencha nome, estabelecimento e email válido. Use uma senha de 8 a 72 caracteres.");
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, email)).get();
      if (existing) throw new HttpError(409, "Email já cadastrado.");
      const tenantId = crypto.randomUUID(), branchId = crypto.randomUUID();
      const password = await hashPassword(body.password);
      user = await db.transaction(async tx => {
        await tx.insert(branches).values({ id: branchId, tenantId, name: body.restaurantName.trim(), address: "", phone: "", active: 1 });
        const [created] = await tx.insert(users).values({ id: crypto.randomUUID(), tenantId, username: email, password, name: body.name.trim(), role: "admin", branch: branchId, active: 1 }).returning();
        return created;
      });
    } else throw new HttpError(400, "Ação inválida.");
    const token = await createToken({ userId: user.id, email: user.username, role: user.role, tenantId: user.tenantId, plan: user.plan });
    const response = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role, email: user.username, branch: user.branch, tenantId: user.tenantId, plan: user.plan } });
    response.cookies.set("cl_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
    return response;
  } catch (error) { return apiError(error); }
}
