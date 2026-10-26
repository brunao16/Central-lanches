import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    // Credenciais solicitadas: login: central / senha: central26
    const VALID_USER = process.env.ADMIN_USER?.trim() || "central";
    const VALID_PASS = process.env.ADMIN_PASSWORD?.trim() || "central26";

    if (username === VALID_USER && password === VALID_PASS) {
      const response = NextResponse.json({ success: true });
      response.cookies.set("admin_session_auth", "central_authenticated_token_2026", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 dias conectado
      });
      return response;
    }

    return NextResponse.json(
      { error: "Usuário ou senha incorretos." },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("admin_session_auth");
  return response;
}
