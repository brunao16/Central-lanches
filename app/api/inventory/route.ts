import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const inventorySchema = z.object({
  name: z.string().min(2, "Nome do insumo obrigatório"),
  unit: z.string().default("kg"),
  quantity: z.number().min(0),
  minQuantity: z.number().min(0).default(5),
  cost: z.number().int().min(0).default(0),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = inventorySchema.parse(body);

    const item = await prisma.inventoryItem.create({
      data: validated,
    });
    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const adjustSchema = z.object({
  id: z.string(),
  delta: z.number(), // positivo para entrada, negativo para saída
});

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, delta } = adjustSchema.parse(body);

    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });

    const newQty = Math.max(0, item.quantity + delta);
    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: { quantity: newQty },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
