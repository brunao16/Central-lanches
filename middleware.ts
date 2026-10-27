import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rotas públicas que NUNCA exigem login
  const isPublicRoute =
    pathname === "/login" ||
    pathname.startsWith("/menu") ||
    pathname.startsWith("/pedido") ||
    pathname === "/motoboy" ||
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/api/auth/login") ||
    (pathname === "/api/orders" && req.method === "POST") ||
    (pathname === "/api/orders" && req.method === "GET" && pathname.startsWith("/motoboy")) ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/favicon.svg" ||
    pathname === "/manifest.json" ||
    pathname === "/robots.txt";

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Checa se tem o cookie de autenticação do login
  const authCookie = req.cookies.get("admin_session_auth")?.value;
  if (authCookie === "central_authenticated_token_2026") {
    return NextResponse.next();
  }

  // Se for chamada de API administrativa sem autenticação
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Autenticação exigida. Faça login em /login." },
      { status: 401 }
    );
  }

  // Redireciona para tela de Login informando a rota original
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.svg|manifest.json|sw.js|robots.txt).*)",
  ],
};
