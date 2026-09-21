import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { expenses } from "@/db/schema";

export async function GET(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id || !/^[a-zA-Z0-9-]{10,80}$/.test(id)) {
      return new NextResponse("Não encontrado", { status: 404 });
    }

    const db = getDb();
    const expense = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, id))
      .get();

    if (!expense?.receipt) {
      return new NextResponse("Não encontrado", { status: 404 });
    }

    // For now, return a placeholder since we removed R2
    // In production, you would use Vercel Blob or similar
    return new NextResponse("Comprovante não disponível nesta versão", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch {
    return new NextResponse("Foto indisponível", { status: 503 });
  }
}
