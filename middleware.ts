import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Imagens e arquivos estáticos da pasta public NUNCA exigem login
  const isStaticFile =
    pathname.startsWith("/_next") ||
    pathname.match(/\.(png|jpg|jpeg|webp|svg|ico|gif|woff2?|css|js|json|txt)$/i);

  if (isStaticFile) {
    return NextResponse.next();
  }

  // Rotas públicas de clientes e entregador (motoboy tem acesso liberado sem login no celular)
  const isPublicRoute =
    pathname === "/login" ||
    pathname.startsWith("/menu") ||
    pathname.startsWith("/pedido") ||
    pathname.startsWith("/motoboy") ||
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/orders");

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Checa se tem o cookie de autenticação do login admin
  const authCookie = req.cookies.get("admin_session_auth")?.value;
  const isAuthenticated = authCookie === "central_authenticated_token_2026";

  // Se acessar a raiz "/", se não for admin logado, direciona para o Cardápio de Clientes
  if (pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.next();
    }
    const url = req.nextUrl.clone();
    url.pathname = "/menu";
    return NextResponse.redirect(url);
  }

  if (isAuthenticated) {
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
