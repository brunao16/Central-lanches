import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users, branches } from "@/db/schema";
import { verifyToken } from "@/lib/auth";

export type Session = { userId: string; name: string; email: string; role: string; branch: string; tenantId: string; plan: string };
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function apiError(error: unknown) {
  if (error instanceof HttpError) return NextResponse.json({ error: error.message }, { status: error.status });
  const message = error instanceof Error ? error.message : "";
  const schemaError = /no such (table|column)|has no column/i.test(message);
  console.error("Application request failed:", schemaError ? "Database schema needs migration" : "Check server configuration and database connectivity");
  return NextResponse.json({ error: schemaError ? "O banco precisa ser atualizado. Contate o responsável pelo sistema." : "Não foi possível acessar os dados. Tente novamente em instantes." }, { status: 503 });
}
export function checkOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return;
  const expectedHost = req.headers.get("host") || new URL(req.url).host;
  let supplied: URL;
  try { supplied = new URL(origin); } catch { throw new HttpError(403, "Origem não autorizada."); }
  if (supplied.host !== expectedHost || !["http:", "https:"].includes(supplied.protocol)) throw new HttpError(403, "Origem não autorizada.");
}
export async function requireSession(req: Request): Promise<Session> {
  const cookie = req.headers.get("cookie")?.split(";").map(x => x.trim()).find(x => x.startsWith("cl_token="))?.slice(9);
  const token = cookie || req.headers.get("authorization")?.replace(/^Bearer /, "");
  const payload = token ? await verifyToken(token) : null;
  if (!payload || typeof payload.userId !== "string") throw new HttpError(401, "Sua sessão expirou. Entre novamente.");
  const user = await getDb().select().from(users).where(and(eq(users.id, payload.userId), eq(users.active, 1))).get();
  if (!user?.tenantId) throw new HttpError(401, "Entre novamente para continuar.");
  return { userId: user.id, name: user.name, email: user.username, role: user.role, branch: user.branch, tenantId: user.tenantId, plan: user.plan };
}
export function requireAdmin(session: Session) {
  if (session.role !== "admin") throw new HttpError(403, "Esta ação exige um administrador.");
}
export async function resolveBranch(session: Session, requested?: string | null, all = false) {
  if (!requested || requested === "principal") return all && session.role === "admin" && !requested ? undefined : session.branch;
  if (session.role !== "admin" && requested !== session.branch) throw new HttpError(403, "Filial não autorizada.");
  const branch = await getDb().select().from(branches).where(and(eq(branches.id, requested), eq(branches.tenantId, session.tenantId), eq(branches.active, 1))).get();
  if (!branch) throw new HttpError(403, "Filial não autorizada.");
  return branch.id;
}
export function withSession(handler: (req: Request, session: Session) => Promise<Response>) {
  return async (req: Request) => {
    try {
      if (!["GET", "HEAD"].includes(req.method)) {
        checkOrigin(req);
      }
      return await handler(req, await requireSession(req));
    } catch (error) { return apiError(error); }
  };
}
