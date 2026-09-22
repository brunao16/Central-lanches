"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlanBadge } from "@/components/plan-gate";

const PLANS = [
  {
    id: "basico",
    name: "Básico",
    price: 49,
    desc: "Para quem está começando",
    features: ["Caixa e gestão", "Cardápio digital", "Relatórios básicos", "1 filial", "Suporte por email"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 129,
    desc: "Para restaurantes em crescimento",
    features: ["Tudo do Básico +", "Dashboard avançado", "Cozinha integrada", "Delivery próprio", "Fidelidade", "NF-e", "Ponto eletrônico", "Até 10 usuários", "Suporte prioritário"],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Empresa",
    price: 299,
    desc: "Para redes e franquias",
    features: ["Tudo do Pro +", "Multi-filiais", "API completa", "Usuários ilimitados", "Backup automático", "Gerente de conta", "SLA 99.9%"],
  },
];

export default function BillingPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("cl_user");
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, sans-serif" }}>Carregando…</div>;

  const currentPlan = user?.plan || "basico";
  const currentPlanData = PLANS.find((p) => p.id === currentPlan) || PLANS[0];

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <style jsx>{`
        .header { background: white; border-bottom: 1px solid #e9ecef; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
        .header h1 { font-size: 18px; font-weight: 700; }
        .container { max-width: 900px; margin: 0 auto; padding: 32px 24px; }
        .current { background: white; border-radius: 16px; padding: 32px; border: 2px solid #e9ecef; margin-bottom: 32px; }
        .current h2 { font-size: 20px; font-weight: 700; margin-bottom: 16px; }
        .plan-info { display: flex; align-items: center; gap: 24px; }
        .plan-price { font-size: 48px; font-weight: 800; color: #e8192c; }
        .plan-price span { font-size: 16px; color: #6c757d; font-weight: 400; }
        .plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .plan-card { background: white; border-radius: 16px; padding: 32px 24px; border: 2px solid #e9ecef; text-align: center; transition: all .2s; position: relative; }
        .plan-card.popular { border-color: #e8192c; transform: scale(1.02); }
        .plan-card.current { border-color: #16a34a; }
        .badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); padding: 4px 16px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
        .badge-pop { background: #e8192c; color: white; }
        .badge-current { background: #16a34a; color: white; }
        .plan-card h3 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
        .plan-card .desc { font-size: 13px; color: #6c757d; margin-bottom: 16px; }
        .plan-card .price { font-size: 36px; font-weight: 800; color: #e8192c; margin-bottom: 20px; }
        .plan-card .price span { font-size: 14px; color: #6c757d; font-weight: 400; }
        .features { text-align: left; margin-bottom: 24px; }
        .features li { padding: 6px 0; font-size: 13px; list-style: none; display: flex; align-items: center; gap: 8px; }
        .features li::before { content: "✓"; color: #16a34a; font-weight: 700; font-size: 12px; }
        .btn { width: 100%; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; border: none; transition: all .2s; text-decoration: none; display: inline-block; text-align: center; }
        .btn-primary { background: linear-gradient(135deg, #e8192c, #ff4757); color: white; }
        .btn-primary:hover { transform: translateY(-1px); }
        .btn-outline { background: white; color: #e8192c; border: 2px solid #e8192c; }
        .btn-outline:hover { background: #fff0f0; }
        .btn-success { background: #16a34a; color: white; }
        .btn-disabled { background: #e9ecef; color: #6c757d; cursor: not-allowed; }
        .btn-ghost { background: transparent; color: #6c757d; }
        .btn-ghost:hover { color: #1a1a2e; }
        .trial { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
        .trial strong { color: #92400e; }
        .trial p { font-size: 13px; color: #92400e; }
        .section { margin-top: 40px; }
        .section h3 { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
        .faq { background: white; border-radius: 12px; border: 1px solid #e9ecef; }
        .faq-item { padding: 16px 20px; border-bottom: 1px solid #f3f4f6; }
        .faq-item:last-child { border: none; }
        .faq-q { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
        .faq-a { font-size: 13px; color: #6c757d; }
        @media (max-width: 768px) { .plans-grid { grid-template-columns: 1fr; } .plan-card.popular { transform: none; } }
      `}</style>

      <div className="header">
        <Link href="/" style={{ textDecoration: "none", color: "inherit" }}><h1>← Central Lanches</h1></Link>
        <PlanBadge plan={currentPlan} />
      </div>

      <div className="container">
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Plano e Cobrança</h1>
        <p style={{ fontSize: 14, color: "#6c757d", marginBottom: 32 }}>Gerencie sua assinatura e veja seus benefícios.</p>

        <div className="trial">
          <span style={{ fontSize: 24 }}>🎁</span>
          <div>
            <strong>Período de teste</strong>
            <p>Seu teste grátis de 7 dias está ativo. Acesse todos os recursos do plano Pro.</p>
          </div>
        </div>

        <div className="current">
          <h2>Seu plano atual</h2>
          <div className="plan-info">
            <div>
              <div className="plan-price">R${currentPlanData.price}<span>/mês</span></div>
              <p style={{ fontSize: 14, color: "#6c757d", marginTop: 8 }}>{currentPlanData.desc}</p>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: "#6c757d", marginBottom: 8 }}>Incluso no seu plano:</p>
              <ul className="features">
                {currentPlanData.features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Escolher outro plano</h2>
        <div className="plans-grid">
          {PLANS.map((plan) => (
            <div key={plan.id} className={`plan-card ${plan.popular ? "popular" : ""} ${plan.id === currentPlan ? "current" : ""}`}>
              {plan.popular && <div className="badge badge-pop">Mais popular</div>}
              {plan.id === currentPlan && <div className="badge badge-current">Atual</div>}
              <h3>{plan.name}</h3>
              <p className="desc">{plan.desc}</p>
              <div className="price">R${plan.price}<span>/mês</span></div>
              <ul className="features">
                {plan.features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
              {plan.id === currentPlan ? (
                <button className="btn btn-success" disabled>Plano atual</button>
              ) : plan.price > currentPlanData.price ? (
                <button className="btn btn-primary">Fazer upgrade</button>
              ) : (
                <button className="btn btn-outline">Fazer downgrade</button>
              )}
            </div>
          ))}
        </div>

        <div className="section">
          <h3>Perguntas frequentes</h3>
          <div className="faq">
            <div className="faq-item">
              <div className="faq-q">Posso cancelar a qualquer momento?</div>
              <div className="faq-a">Sim. Cancele quando quiser, sem multa. Você continua usando até o fim do período pago.</div>
            </div>
            <div className="faq-item">
              <div className="faq-q">Como funciona o pagamento?</div>
              <div className="faq-a">Aceitamos cartão de crédito, boleto e Pix. O pagamento é recorrente mensal.</div>
            </div>
            <div className="faq-item">
              <div className="faq-q">Posso mudar de plano depois?</div>
              <div className="faq-a">Sim. Upgrade é imediato. Downgrade aplica no próximo ciclo de cobrança.</div>
            </div>
            <div className="faq-item">
              <div className="faq-q">Meus dados ficam seguros?</div>
              <div className="faq-a">Sim. Backup diário automático, criptografia em trânsito e repouso. Dados isolados por restaurante.</div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Link href="/" style={{ color: "#6c757d", fontSize: 14, textDecoration: "none" }}>← Voltar para o painel</Link>
        </div>
      </div>
    </div>
  );
}
