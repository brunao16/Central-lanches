import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const cleanCode = code.startsWith("%23") ? decodeURIComponent(code) : (code.startsWith("#") ? code : `#${code}`);

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { code: cleanCode },
          { id: code },
        ],
      },
      include: {
        items: true,
      },
    });

    if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

    return NextResponse.json({
      order: {
        code: order.code,
        status: order.status,
        type: order.type,
        customerName: order.customerName,
        total: order.total,
        deliveryAddress: order.deliveryAddress,
        createdAt: order.createdAt,
        items: order.items.map((i) => ({
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          notes: i.notes,
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
