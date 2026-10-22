import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { id: "default" },
    });
    const zones = await prisma.deliveryZone.findMany({
      orderBy: { neighborhood: "asc" },
    });
    const tables = await prisma.table.findMany({
      orderBy: { number: "asc" },
    });

    return NextResponse.json({ setting, zones, tables });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const updateSettingsSchema = z.object({
  restaurantName: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  pixKey: z.string().optional(),
  openingHours: z.string().optional(),
  deliveryFee: z.number().int().min(0).optional(),
  rewardThreshold: z.number().int().min(1).optional(),
  rewardDiscount: z.number().int().min(0).optional(),
});

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const validated = updateSettingsSchema.parse(body);

    const setting = await prisma.setting.upsert({
      where: { id: "default" },
      update: validated,
      create: {
        id: "default",
        ...validated,
      },
    });

    return NextResponse.json({ success: true, setting });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
