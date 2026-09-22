import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { users, branches } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { hashPassword, verifyPassword, createToken, getPlanFeatures } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;
  const db = getDb();

  if (action === "login") {
    if (!body.email || !body.password) {
      return NextResponse.json({ error: "Preencha email e senha." }, { status: 400 });
    }
    const user = await db.select().from(users).where(eq(users.username, body.email)).get();
    if (!user) {
      return NextResponse.json({ error: "Email ou senha incorretos." }, { status: 401 });
    }
    const valid = await verifyPassword(body.password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Email ou senha incorretos." }, { status: 401 });
    }
    if (user.active !== 1) {
      return NextResponse.json({ error: "Conta desativada. Entre em contato." }, { status: 403 });
    }
    const token = await createToken({
      userId: user.id,
      email: user.username,
      role: user.role,
      tenantId: user.branch,
      plan: (user as any).plan || "basico",
    });
    const response = NextResponse.json({
      ok: true,
      token,
      user: { id: user.id, name: user.name, role: user.role, email: user.username, plan: (user as any).plan || "basico" },
    });
    response.cookies.set("cl_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  }

  if (action === "register") {
    if (!body.email || !body.password || !body.name || !body.restaurantName) {
      return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 });
    }
    if (body.password.length < 6) {
      return NextResponse.json({ error: "Senha deve ter no mínimo 6 caracteres." }, { status: 400 });
    }
    const existing = await db.select().from(users).where(eq(users.username, body.email)).get();
    if (existing) {
      return NextResponse.json({ error: "Email já cadastrado." }, { status: 409 });
    }
    const tenantId = crypto.randomUUID();
    const hashedPassword = await hashPassword(body.password);
    const branchId = crypto.randomUUID();

    await db.insert(branches).values({
      id: branchId,
      name: body.restaurantName,
      address: "",
      phone: "",
      active: 1,
    });

    await db.insert(users).values({
      id: crypto.randomUUID(),
      username: body.email,
      password: hashedPassword,
      name: body.name,
      role: "admin",
      branch: branchId,
      active: 1,
    });

    const user = await db.select().from(users).where(eq(users.username, body.email)).get();
    if (!user) {
      return NextResponse.json({ error: "Erro ao criar conta." }, { status: 500 });
    }

    const token = await createToken({
      userId: user.id,
      email: user.username,
      role: user.role,
      tenantId: branchId,
      plan: "basico",
    });

    const response = NextResponse.json({
      ok: true,
      token,
      user: { id: user.id, name: user.name, role: user.role, email: user.username, plan: "basico" },
    });
    response.cookies.set("cl_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  }

  if (action === "me") {
    if (!body.token) {
      return NextResponse.json({ error: "Token necessário." }, { status: 401 });
    }
    const { verifyToken } = await import("@/lib/auth");
    const payload = await verifyToken(body.token);
    if (!payload) {
      return NextResponse.json({ error: "Token inválido." }, { status: 401 });
    }
    const user = await db.select().from(users).where(eq(users.id, payload.userId as string)).get();
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, role: user.role, email: user.username, plan: (user as any).plan || "basico" },
    });
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
}
