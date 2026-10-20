import { withSession, requireAdmin } from "@/lib/session";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { stripeRequest, PLANS } from "@/lib/stripe";

export const POST = withSession(async (req, session) => {
  requireAdmin(session);
  const body = await req.json();
  const { action, plan } = body;
  const email = session.email, userId = session.userId;
  const user = await getDb().select({ customerId: users.stripeCustomerId }).from(users).where(and(eq(users.id, session.userId), eq(users.tenantId, session.tenantId))).get();

  if (action === "checkout") {
    const planData = PLANS[plan as keyof typeof PLANS];
    if (!planData) {
      return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
    }

    try {
      if (!planData.stripePriceId) {
        return NextResponse.json({
          mode: "setup",
          message: "Stripe não configurado. Adicione as variáveis de ambiente STRIPE_SECRET_KEY, STRIPE_PRICE_BASICO, STRIPE_PRICE_PRO, STRIPE_PRICE_ENTERPRISE no painel do Vercel.",
        });
      }

      const session = await stripeRequest("/checkout/sessions", {
        method: "POST",
        body: new URLSearchParams({
          "mode": "subscription",
          "customer_email": email || "",
          "line_items[0][price]": planData.stripePriceId,
          "line_items[0][quantity]": "1",
          "success_url": `${process.env.NEXT_PUBLIC_APP_URL || "https://central-lanches-theta.vercel.app"}/billing?success=true`,
          "cancel_url": `${process.env.NEXT_PUBLIC_APP_URL || "https://central-lanches-theta.vercel.app"}/billing?canceled=true`,
          "metadata[userId]": userId || "",
          "metadata[plan]": plan,
          
        }).toString(),
      });

      return NextResponse.json({ url: session.url });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (action === "portal") {
    try {
      const customerId = user?.customerId;
      if (!customerId) {
        return NextResponse.json({ error: "Customer ID necessário." }, { status: 400 });
      }

      const portal = await stripeRequest("/billing_portal/sessions", {
        method: "POST",
        body: new URLSearchParams({
          "customer": customerId,
          "return_url": `${process.env.NEXT_PUBLIC_APP_URL || "https://central-lanches-theta.vercel.app"}/billing`,
        }).toString(),
      });

      return NextResponse.json({ url: portal.url });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (action === "status") {
    try {
      const customerId = user?.customerId;
      if (!customerId) {
        return NextResponse.json({ subscriptions: [] });
      }

      const subs = await stripeRequest(`/customers/${customerId}/subscriptions`);
      return NextResponse.json({ subscriptions: subs.data || [] });
    } catch (e: any) {
      return NextResponse.json({ subscriptions: [] });
    }
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
});
