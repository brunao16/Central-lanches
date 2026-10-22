import { NextResponse } from "next/server";
import { CashService } from "@/lib/services/cash.service";
import { z } from "zod";

export async function GET() {
  try {
    const register = await CashService.getCurrentRegister();
    return NextResponse.json({ register });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const openSchema = z.object({
  action: z.literal("open"),
  initialAmount: z.number().int().min(0),
  notes: z.string().optional(),
});

const bleedSchema = z.object({
  action: z.literal("bleed"),
  amount: z.number().int().positive(),
  description: z.string().min(1),
});

const supplySchema = z.object({
  action: z.literal("supply"),
  amount: z.number().int().positive(),
  description: z.string().min(1),
});

const closeSchema = z.object({
  action: z.literal("close"),
  finalAmount: z.number().int().min(0),
  notes: z.string().optional(),
});

const cashActionSchema = z.discriminatedUnion("action", [
  openSchema,
  bleedSchema,
  supplySchema,
  closeSchema,
]);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = cashActionSchema.parse(body);

    if (validated.action === "open") {
      const register = await CashService.openRegister(validated.initialAmount, validated.notes);
      return NextResponse.json({ success: true, register });
    }

    if (validated.action === "bleed") {
      const movement = await CashService.addBleed(validated.amount, validated.description);
      return NextResponse.json({ success: true, movement });
    }

    if (validated.action === "supply") {
      const movement = await CashService.addSupply(validated.amount, validated.description);
      return NextResponse.json({ success: true, movement });
    }

    if (validated.action === "close") {
      const register = await CashService.closeRegister(validated.finalAmount, validated.notes);
      return NextResponse.json({ success: true, register });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
