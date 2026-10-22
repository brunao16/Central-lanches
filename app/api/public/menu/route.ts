import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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
