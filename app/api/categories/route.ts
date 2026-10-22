import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const categorySchema = z.object({
  name: z.string().min(2, "Nome da categoria obrigatório"),
  order: z.number().int().default(0),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = categorySchema.parse(body);

    const category = await prisma.category.create({
      data: validated,
    });
    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
