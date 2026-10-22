import { NextResponse } from "next/server";
import { DashboardService } from "@/lib/services/dashboard.service";

export async function GET() {
  try {
    const data = await DashboardService.getMetrics();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
