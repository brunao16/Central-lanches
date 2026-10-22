import { prisma } from "@/lib/prisma";
import { OrderType, OrderStatus, PaymentMethod } from "@prisma/client";

export interface CreateOrderItemInput {
  productId?: string;
  productName: string;
  unitPrice: number; // centavos
  quantity: number;
  notes?: string;
}

export interface CreateOrderInput {
  type: OrderType;
  tableNumber?: number;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryFee?: number; // centavos
  discount?: number; // centavos
  paymentMethod: PaymentMethod;
  amountReceived?: number; // centavos (se dinheiro)
  notes?: string;
  items: CreateOrderItemInput[];
}

export class OrderService {
  /**
   * Gera o próximo código de pedido único (#1001, #1002...).
   */
  private static async getNextOrderCode(): Promise<string> {
    const count = await prisma.order.count();
    const nextNum = 1000 + count + 1;
    return `#${nextNum}`;
  }

  /**
   * Cria um pedido completo com transação bancária garantindo:
   * 1. Criação do pedido e itens
   * 2. Cadastro/atualização automática do cliente e pontos de fidelidade
   * 3. Registro automático no caixa aberto se o pedido for pago
   * 4. Ocupação da mesa se for pedido presencial
   */
  static async createOrder(data: CreateOrderInput) {
    if (!data.items || data.items.length === 0) {
      throw new Error("O pedido deve conter ao menos um item.");
    }

    // Calcula subtotal e total
    const subtotal = data.items.reduce((acc, item) => {
      return acc + item.unitPrice * item.quantity;
    }, 0);

    const deliveryFee = data.type === OrderType.DELIVERY ? (data.deliveryFee || 0) : 0;
    const discount = data.discount || 0;
    const total = Math.max(0, subtotal + deliveryFee - discount);

    // Troco se for dinheiro
    let changeDue: number | undefined = undefined;
    if (data.paymentMethod === PaymentMethod.DINHEIRO && data.amountReceived) {
      changeDue = Math.max(0, data.amountReceived - total);
    }

    const code = await this.getNextOrderCode();

    return await prisma.$transaction(async (tx) => {
      // 1. Cliente & Fidelidade (1 ponto a cada R$ 10,00 gastos)
      let customerId: string | undefined = undefined;
      if (data.customerPhone && data.customerPhone.trim()) {
        const cleanPhone = data.customerPhone.replace(/\D/g, "");
        if (cleanPhone) {
          const earnedPoints = Math.floor(total / 1000); // 1000 centavos = R$ 10
          const customer = await tx.customer.upsert({
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

      // 2. Criação do Pedido
      const order = await tx.order.create({
        data: {
          code,
          type: data.type,
          status: OrderStatus.NOVO,
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

      // 3. Ocupa mesa se for pedido de mesa
      if (data.type === OrderType.MESA && data.tableNumber) {
        await tx.table.updateMany({
          where: { number: data.tableNumber },
          data: { occupied: true },
        });
      }

      // 4. Se houver caixa aberto, registra a entrada da venda
      const openRegister = await tx.cashRegister.findFirst({
        where: { status: "ABERTO" },
        orderBy: { openedAt: "desc" },
      });

      if (openRegister) {
        await tx.cashMovement.create({
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
    });
  }

  /**
   * Atualiza status do pedido (Novo -> Preparando -> Pronto -> Entregue).
   */
  static async updateStatus(orderId: string, status: OrderStatus, cancelReason?: string) {
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
