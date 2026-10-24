import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vafnozlbgtrpgfvcmyig.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhZm5vemxiZ3RycGdmdmNteWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MDY0MzAsImV4cCI6MjEwODI4MjQzMH0.ZtSdgDtTtx4CYD2imicIJh5T7pqDW_XLBcuFtgMdyTo';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Atualiza a sessão e busca o usuário atual com segurança criptográfica
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. Proteger rotas autenticadas gerais
  const protectedRoutes = ['/admin', '/painel/restaurante', '/entregador'];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Se for rota restrita por papel, verificar no perfil
  if (isProtected && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'customer';

    // Rota /admin: Apenas administradores
    if (pathname.startsWith('/admin') && role !== 'admin') {
      const homeUrl = new URL('/', request.url);
      return NextResponse.redirect(homeUrl);
    }

    // Rota /painel/restaurante: Donos de restaurante ou admin
    if (pathname.startsWith('/painel/restaurante') && role !== 'restaurant_owner' && role !== 'admin') {
      const cadastroUrl = new URL('/cadastro-restaurante', request.url);
      return NextResponse.redirect(cadastroUrl);
    }

    // Rota /entregador: Entregadores ou admin
    if (pathname.startsWith('/entregador') && role !== 'courier' && role !== 'admin') {
      const homeUrl = new URL('/', request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
