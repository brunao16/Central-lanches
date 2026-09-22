import { SignJWT, jwtVerify } from "jose";
import bcryptjs from "bcryptjs";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "central-lanches-secret-key-change-in-production-2024");

const PLAN_FEATURES: Record<string, { maxProducts: number; maxSales: number; features: string[] }> = {
  basico: { maxProducts: 50, maxSales: 500, features: ["caixa", "lanches", "gastos", "gestao"] },
  pro: { maxProducts: 200, maxSales: 5000, features: ["caixa", "lanches", "gastos", "gestao", "dashboard", "cozinha", "delivery", "fidelidade", "mesas", "ponto", "nfe", "pedido"] },
  enterprise: { maxProducts: -1, maxSales: -1, features: ["caixa", "lanches", "gastos", "gestao", "dashboard", "cozinha", "delivery", "fidelidade", "mesas", "ponto", "nfe", "pedido", "multi-branch", "api"] },
};

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export async function createToken(payload: { userId: string; email: string; role: string; tenantId: string; plan: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

export function getPlanFeatures(plan: string) {
  return PLAN_FEATURES[plan] || PLAN_FEATURES.basico;
}

export function canAccessFeature(plan: string, feature: string): boolean {
  const p = PLAN_FEATURES[plan];
  if (!p) return false;
  return p.features.includes(feature);
}
