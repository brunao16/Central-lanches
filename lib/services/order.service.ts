import { prisma } from "@/lib/prisma";

export interface CreateOrderItemInput {
  productId?: string;
  productName: string;
  unitPrice: number; // centavos
  quantity: number;
  notes?: string;
}

export interface CreateOrderInput {
  type: string;
  tableNumber?: number;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryFee?: number;
  discount?: number;
  paymentMethod: string;
  amountReceived?: number;
  notes?: string;
  items: CreateOrderItemInput[];
}

export class OrderService {
  private static async getNextOrderCode(): Promise<string> {
    const count = await prisma.order.count();
    const nextNum = 1000 + count + 1;
    return `#${nextNum}`;
  }

  static async createOrder(data: CreateOrderInput) {
    if (!data.items || data.items.length === 0) {
      throw new Error("O pedido deve conter ao menos um item.");
    }

    const subtotal = data.items.reduce((acc, item) => {
      return acc + item.unitPrice * item.quantity;
    }, 0);

    const deliveryFee = data.type === "DELIVERY" ? (data.deliveryFee || 0) : 0;
    const discount = data.discount || 0;
    const total = Math.max(0, subtotal + deliveryFee - discount);

    let changeDue: number | undefined = undefined;
    if (data.paymentMethod === "DINHEIRO" && data.amountReceived) {
      changeDue = Math.max(0, data.amountReceived - total);
    }

    const code = await this.getNextOrderCode();

    let customerId: string | undefined = undefined;
    if (data.customerPhone && data.customerPhone.trim()) {
      const cleanPhone = data.customerPhone.replace(/\D/g, "");
      if (cleanPhone) {
        const earnedPoints = Math.floor(total / 1000);
        const customer = await prisma.customer.upsert({
          where: { phone: cleanPhone },
          update: {
            name: data.customerName || undefined,
            address: data.deliveryAddress || undefined,
            points: { increment: earnedPoints },
          },
          create: {
            name: data.customerName || "Cliente",
            phone: cleanPhone,
            address: data.deliveryAddress || null,
            points: earnedPoints,
          },
        });
        customerId = customer.id;
      }
    }

    const order = await prisma.order.create({
      data: {
        code,
        type: data.type,
        status: "NOVO",
        customerId,
        customerName: data.customerName || null,
        customerPhone: data.customerPhone || null,
        tableNumber: data.tableNumber || null,
        deliveryAddress: data.deliveryAddress || null,
        subtotal,
        deliveryFee,
        discount,
        total,
        paymentMethod: data.paymentMethod,
        paid: true,
        amountReceived: data.amountReceived || null,
        changeDue,
        notes: data.notes || null,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId || null,
            productName: item.productName,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            totalPrice: item.unitPrice * item.quantity,
            notes: item.notes || null,
          })),
        },
      },
      include: {
        items: true,
        customer: true,
      },
    });

    if (data.type === "MESA" && data.tableNumber) {
      await prisma.table.updateMany({
        where: { number: data.tableNumber },
        data: { occupied: true },
      });
    }

    const openRegister = await prisma.cashRegister.findFirst({
      where: { status: "ABERTO" },
      orderBy: { openedAt: "desc" },
    });

    if (openRegister) {
      await prisma.cashMovement.create({
        data: {
          registerId: openRegister.id,
          type: "VENDA",
          amount: total,
          description: `Venda pedido ${order.code} (${order.type} - ${order.paymentMethod})`,
          orderId: order.id,
        },
      });
    }

    return order;
  }

  static async updateStatus(orderId: string, status: string, cancelReason?: string) {
    return await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        cancelReason: cancelReason || undefined,
      },
      include: {
        items: true,
      },
    });
  }
}
