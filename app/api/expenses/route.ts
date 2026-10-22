import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const isRecurring = searchParams.get("recurring");

    const where: any = {};
    if (category) where.category = category;
    if (isRecurring !== null && isRecurring !== undefined) {
      where.isRecurring = isRecurring === "true";
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
    });

    const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    return NextResponse.json({ expenses, total });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const expenseSchema = z.object({
  description: z.string().min(2, "Descrição obrigatória"),
  category: z.enum([
    "INSUMOS",
    "ALUGUEL",
    "FUNCIONARIOS",
    "ENERGIA_AGUA",
    "EQUIPAMENTOS",
    "MARKETING",
    "OUTROS",
  ]),
  amount: z.number().int().positive("Valor deve ser positivo"),
  date: z.string().optional(),
  paymentMethod: z.enum(["DINHEIRO", "PIX", "DEBITO", "CREDITO", "MISTO"]).default("PIX"),
  isRecurring: z.boolean().default(false),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = expenseSchema.parse(body);

    const expense = await prisma.expense.create({
      data: {
        description: validated.description,
        category: validated.category,
        amount: validated.amount,
        date: validated.date ? new Date(validated.date) : new Date(),
        paymentMethod: validated.paymentMethod,
        isRecurring: validated.isRecurring,
        notes: validated.notes || null,
      },
    });

    return NextResponse.json({ success: true, expense }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
