"use client";

const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  basico: { label: "Básico", color: "#6c757d", bg: "#f8f9fa" },
  pro: { label: "Pro", color: "#e8192c", bg: "#fff0f0" },
  enterprise: { label: "Empresa", color: "#7c3aed", bg: "#f5f3ff" },
};

export function PlanBadge({ plan }: { plan: string }) {
  const config = PLAN_CONFIG[plan] || PLAN_CONFIG.basico;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, background: config.bg, color: config.color, fontSize: 11, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase" as const }}>
      {plan === "enterprise" && "🏢 "}{plan === "pro" && "⭐ "}{config.label}
    </span>
  );
}

export function UpgradePrompt({ feature, currentPlan }: { feature: string; currentPlan: string }) {
  const plans = ["basico", "pro", "enterprise"];
  const currentIdx = plans.indexOf(currentPlan);
  const nextPlan = plans[Math.min(currentIdx + 1, plans.length - 1)];
  const config = PLAN_CONFIG[nextPlan] || PLAN_CONFIG.pro;

  return (
    <div style={{ padding: 40, textAlign: "center", background: "white", borderRadius: 16, border: "2px dashed #e9ecef", maxWidth: 400, margin: "40px auto" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Recurso disponível no plano {config.label}</h3>
      <p style={{ fontSize: 14, color: "#6c757d", marginBottom: 24 }}>
        O <strong>{feature}</strong> está disponível a partir do plano <strong>{config.label}</strong>.
      </p>
      <a href="/billing" style={{ display: "inline-block", padding: "12px 32px", borderRadius: 10, background: `linear-gradient(135deg, ${config.color}, ${config.color}dd)`, color: "white", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
        Fazer upgrade →
      </a>
    </div>
  );
}

export function canAccess(userPlan: string, feature: string): boolean {
  const planFeatures: Record<string, string[]> = {
    basico: ["caixa", "lanches", "gastos", "gestao"],
    pro: ["caixa", "lanches", "gastos", "gestao", "dashboard", "cozinha", "delivery", "fidelidade", "mesas", "ponto", "nfe", "pedido"],
    enterprise: ["caixa", "lanches", "gastos", "gestao", "dashboard", "cozinha", "delivery", "fidelidade", "mesas", "ponto", "nfe", "pedido", "multi-branch", "api"],
  };
  return planFeatures[userPlan]?.includes(feature) ?? false;
}
