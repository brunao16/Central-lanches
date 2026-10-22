import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const adminPin = process.env.ADMIN_PIN?.trim();

  // Se não houver ADMIN_PIN configurado, tudo abre livremente
  if (!adminPin) {
    return NextResponse.next();
  }

  // Rotas públicas que NUNCA exigem PIN
  const isPublicRoute =
    pathname.startsWith("/menu") ||
    pathname.startsWith("/pedido") ||
    pathname === "/pin" ||
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/favicon.svg" ||
    pathname === "/manifest.json" ||
    pathname === "/robots.txt";

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Checa cookie de PIN autorizado
  const authPinCookie = req.cookies.get("admin_pin_auth")?.value;
  if (authPinCookie === adminPin) {
    return NextResponse.next();
  }

  // Se for chamada de API administrativa sem PIN
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "PIN administrativo exigido ou incorreto." },
      { status: 401 }
    );
  }

  // Redireciona para tela simples de PIN informando o retorno
  const url = req.nextUrl.clone();
  url.pathname = "/pin";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.svg|manifest.json|sw.js|robots.txt).*)",
  ],
};
