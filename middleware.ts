import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Redireciona /login e /register diretamente para a raiz do painel
  if (pathname === "/login" || pathname.startsWith("/login/") || pathname === "/register" || pathname.startsWith("/register/")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon.svg|manifest.json|sw.js|icons/).*)"],
};
