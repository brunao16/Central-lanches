import { prisma } from "@/lib/prisma";

export class CashService {
  static async getCurrentRegister() {
    return await prisma.cashRegister.findFirst({
      where: { status: "ABERTO" },
      include: {
        movements: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { openedAt: "desc" },
    });
  }

  static async openRegister(initialAmountCents: number, notes?: string) {
    const existing = await this.getCurrentRegister();
    if (existing) {
      throw new Error("Já existe um caixa aberto no momento.");
    }

    return await prisma.cashRegister.create({
      data: {
        initialAmount: initialAmountCents,
        status: "ABERTO",
        notes: notes || null,
        movements: {
          create: {
            type: "ABERTURA",
            amount: initialAmountCents,
            description: "Fundo de troco inicial",
          },
        },
      },
      include: {
        movements: true,
      },
    });
  }

  static async addBleed(amountCents: number, description: string) {
    const register = await this.getCurrentRegister();
    if (!register) throw new Error("Não há caixa aberto para realizar sangria.");

    return await prisma.cashMovement.create({
      data: {
        registerId: register.id,
        type: "SANGRIA",
        amount: amountCents,
        description: description || "Sangria de caixa",
      },
    });
  }

  static async addSupply(amountCents: number, description: string) {
    const register = await this.getCurrentRegister();
    if (!register) throw new Error("Não há caixa aberto para realizar suprimento.");

    return await prisma.cashMovement.create({
      data: {
        registerId: register.id,
        type: "SUPRIMENTO",
        amount: amountCents,
        description: description || "Suprimento de troco",
      },
    });
  }

  static async closeRegister(finalAmountCents: number, notes?: string) {
    const register = await this.getCurrentRegister();
    if (!register) throw new Error("Não há caixa aberto para fechar.");

    let expected = register.initialAmount;
    for (const mov of register.movements) {
      if (mov.type === "VENDA" || mov.type === "SUPRIMENTO") {
        expected += mov.amount;
      } else if (mov.type === "SANGRIA") {
        expected -= mov.amount;
      }
    }

    return await prisma.cashRegister.update({
      where: { id: register.id },
      data: {
        status: "FECHADO",
        closedAt: new Date(),
        finalAmount: finalAmountCents,
        expectedAmount: expected,
        notes: notes || null,
        movements: {
          create: {
            type: "FECHAMENTO",
            amount: finalAmountCents,
            description: `Fechamento do caixa. Esperado: R$ ${(expected / 100).toFixed(2)}, Contado: R$ ${(finalAmountCents / 100).toFixed(2)}`,
          },
        },
      },
      include: {
        movements: true,
      },
    });
  }
}
