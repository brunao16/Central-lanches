import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  price: z.number().int().min(0).optional(),
  costPrice: z.number().int().min(0).optional(),
  categoryId: z.string().optional(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  active: z.boolean().optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = updateProductSchema.parse(body);

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...validated,
        imageUrl: validated.imageUrl === "" ? null : validated.imageUrl,
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
