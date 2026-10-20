import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose/jwt/verify";

import { jwtSecret } from "@/lib/jwt-secret";

const PUBLIC_PATHS = ["/home", "/login", "/register", "/api/auth", "/cardapio", "/pedido"];
const API_PUBLIC_PATHS = ["/api/auth", "/api/menu", "/api/public-orders"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (API_PUBLIC_PATHS.some((p) => (pathname === p || pathname.startsWith(p + "/")))) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((p) => (pathname === p || pathname.startsWith(p + "/")))) {
    const token = req.cookies.get("cl_token")?.value;
    if (token && (pathname.startsWith("/login") || pathname.startsWith("/register"))) {
      try {
        await jwtVerify(token, jwtSecret(), { algorithms: ["HS256"] });
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
    await jwtVerify(token, jwtSecret(), { algorithms: ["HS256"] });
    return NextResponse.next();
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon.svg|manifest.json|sw.js|icons/).*)"],
};
