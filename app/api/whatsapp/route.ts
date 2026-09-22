import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { sales } from "@/db/schema";

export const dynamic = "force-dynamic";

function brl(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v / 100);
}

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as { saleId: string; phone?: string };
    if (!b.saleId) return NextResponse.json({ error: "ID da venda necessário." }, { status: 400 });

    const db = getDb();
    const sale = await db.select().from(sales).where(eq(sales.id, b.saleId)).get();
    if (!sale) return NextResponse.json({ error: "Venda não encontrada." }, { status: 404 });

    const items = JSON.parse(sale.lines);
    const itemsText = items.map((x: any) => `  ${x.qty}x ${x.name} - ${brl(x.price * x.qty)}`).join("\n");
    const change = sale.payment === "Dinheiro" ? `\n💰 Troco: ${brl(sale.received - sale.total)}` : "";

    const message = `🍔 *Central Lanches - Comprovante*

📅 ${new Date(sale.created).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}

📋 *Pedido:*
${itemsText}

💰 *Total: ${brl(sale.total)}*
💳 Pagamento: ${sale.payment}${change}

Obrigado pela preferência! 😊`;

    const phone = b.phone?.replace(/\D/g, "");
    const whatsappUrl = phone
      ? `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    return NextResponse.json({ ok: true, url: whatsappUrl, message });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao gerar comprovante." }, { status: 500 });
  }
}
