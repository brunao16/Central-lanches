import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Garante que a categoria Adicionais e a Maionese d'Casa Caseira existam
    let catAdicionais = await prisma.category.findFirst({
      where: { name: "Adicionais" },
    });
    if (!catAdicionais) {
      catAdicionais = await prisma.category.create({
        data: { name: "Adicionais", order: 99, active: true },
      });
    }

    const existingMaionese = await prisma.product.findFirst({
      where: { name: "Maionese d'Casa Caseira" },
    });
    if (!existingMaionese) {
      await prisma.product.create({
        data: {
          name: "Maionese d'Casa Caseira",
          description: "Nossa maionese verde caseira e artesanal especial da casa.",
          price: 300,
          categoryId: catAdicionais.id,
          active: true,
          imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
        },
      });
    }

    const [setting, categories, products, zones] = await Promise.all([
      prisma.setting.findUnique({ where: { id: "default" } }),
      prisma.category.findMany({
        where: { active: true },
        orderBy: { order: "asc" },
      }),
      prisma.product.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
      }),
      prisma.deliveryZone.findMany({
        where: { active: true },
        orderBy: { neighborhood: "asc" },
      }),
    ]);

    return NextResponse.json({
      setting,
      categories,
      products,
      zones,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
