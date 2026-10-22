import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { pin } = await req.json();
    const adminPin = process.env.ADMIN_PIN?.trim();

    if (!adminPin || pin === adminPin) {
      const response = NextResponse.json({ success: true });
      response.cookies.set("admin_pin_auth", adminPin || "authorized", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 dias de duração
      });
      return response;
    }

    return NextResponse.json({ error: "PIN incorreto." }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
