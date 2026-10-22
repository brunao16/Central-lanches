import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderService } from "@/lib/services/order.service";
import { z } from "zod";

const createOrderSchema = z.object({
  type: z.enum(["BALCAO", "MESA", "DELIVERY", "RETIRADA"]),
  tableNumber: z.number().int().optional(),
  customerName: z.string().max(100).optional(),
  customerPhone: z.string().max(20).optional(),
  deliveryAddress: z.string().max(250).optional(),
  deliveryFee: z.number().int().min(0).optional(),
  discount: z.number().int().min(0).optional(),
  paymentMethod: z.enum(["DINHEIRO", "PIX", "DEBITO", "CREDITO", "MISTO"]),
  amountReceived: z.number().int().min(0).optional(),
  notes: z.string().max(300).optional(),
  items: z.array(
    z.object({
      productId: z.string().optional(),
      productName: z.string().min(1),
      unitPrice: z.number().int().min(0),
      quantity: z.number().int().min(1),
      notes: z.string().max(200).optional(),
    })
  ).min(1, "O pedido deve ter ao menos 1 item"),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const orders = await prisma.order.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        customer: true,
      },
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao buscar pedidos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = createOrderSchema.parse(body);

    const order = await OrderService.createOrder(validated);
    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Erro ao criar pedido" }, { status: 500 });
  }
}
