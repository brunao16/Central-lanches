import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderService } from "@/lib/services/order.service";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["NOVO", "PREPARANDO", "PRONTO", "SAIU_ENTREGA", "ENTREGUE", "CANCELADO"]),
  cancelReason: z.string().max(200).optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = updateStatusSchema.parse(body);

    const order = await OrderService.updateStatus(id, validated.status, validated.cancelReason);
    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
