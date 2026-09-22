import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { expenses } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id || !/^[a-zA-Z0-9-]{10,80}$/.test(id)) {
      return new NextResponse("Não encontrado", { status: 404 });
    }

    const db = getDb();
    const expense = await db.select().from(expenses).where(eq(expenses.id, id)).get();

    if (!expense?.receipt) {
      return new NextResponse("Comprovante não encontrado", { status: 404 });
    }

    if (expense.receipt.startsWith("http")) {
      return NextResponse.redirect(expense.receipt);
    }

    return new NextResponse("Comprovante não disponível", { status: 200 });
  } catch {
    return new NextResponse("Foto indisponível", { status: 503 });
  }
}
