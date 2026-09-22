import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "central-lanches-secret-key-change-in-production-2024");

const PUBLIC_PATHS = ["/home", "/login", "/register", "/api/auth", "/cardapio", "/pedido"];
const API_PUBLIC_PATHS = ["/api/auth", "/api/receipt", "/api/webhook"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (API_PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const token = req.cookies.get("cl_token")?.value;
    if (token && (pathname.startsWith("/login") || pathname.startsWith("/register"))) {
      try {
        await jwtVerify(token, SECRET);
        return NextResponse.redirect(new URL("/", req.url));
      } catch {}
    }
    return NextResponse.next();
  }

  const token = req.cookies.get("cl_token")?.value || req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const response = pathname.startsWith("/api/") ? NextResponse.next() : NextResponse.next();
    response.headers.set("x-user-id", payload.userId as string);
    response.headers.set("x-user-role", payload.role as string);
    response.headers.set("x-tenant-id", payload.tenantId as string);
    response.headers.set("x-user-plan", payload.plan as string);
    return response;
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Token inválido." }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("cl_token");
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
