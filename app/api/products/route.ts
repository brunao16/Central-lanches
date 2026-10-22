import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const activeOnly = searchParams.get("active") === "true";

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (activeOnly) where.active = true;

    const [categories, products] = await Promise.all([
      prisma.category.findMany({
        where: activeOnly ? { active: true } : undefined,
        orderBy: { order: "asc" },
      }),
      prisma.product.findMany({
        where,
        orderBy: { name: "asc" },
        include: { category: true },
      }),
    ]);

    return NextResponse.json({ categories, products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const productSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  description: z.string().default(""),
  price: z.number().int().min(0, "Preço deve ser positivo"),
  costPrice: z.number().int().min(0).default(0),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  imageUrl: z.string().url("URL de imagem inválida").optional().or(z.literal("")),
  active: z.boolean().default(true),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = productSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        name: validated.name,
        description: validated.description || "",
        price: validated.price,
        costPrice: validated.costPrice || 0,
        categoryId: validated.categoryId,
        imageUrl: validated.imageUrl || null,
        active: validated.active,
      },
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
