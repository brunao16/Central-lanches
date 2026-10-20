export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || "";
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

export const PLANS = {
  basico: { name: "Básico", price: 4900, interval: "month", stripePriceId: process.env.STRIPE_PRICE_BASICO || "" },
  pro: { name: "Pro", price: 12900, interval: "month", stripePriceId: process.env.STRIPE_PRICE_PRO || "" },
  enterprise: { name: "Empresa", price: 29900, interval: "month", stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE || "" },
};

export async function stripeRequest(path: string, options: RequestInit = {}) {
  if (!STRIPE_SECRET_KEY) throw new Error("Stripe não configurado. Adicione STRIPE_SECRET_KEY no .env");
  const auth = Buffer.from(`${STRIPE_SECRET_KEY}:`).toString("base64");
  const r = await fetch(`https://api.stripe.com/v1${path}`, {
    ...options,
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...options.headers,
    },
  });
  const data = await r.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}
