"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const FEATURES = [
  { icon: "⚡", title: "Caixa Rápido", desc: "Abra pedidos em segundos com interface intuitiva para sua equipe." },
  { icon: "📊", title: "Dashboard Completo", desc: "KPIs, gráficos, tendências e alertas inteligentes em tempo real." },
  { icon: "🍽️", title: "Cardápio Digital", desc: "Clientes pedem pelo celular. QR code na mesa, sem app." },
  { icon: "👨‍🍳", title: "Cozinha Integrada", desc: "Pedidos vão direto para a tela da cozinha com timer e prioridade." },
  { icon: "🛵", title: "Delivery Próprio", desc: "Gerencie entregas sem depender de plataformas terceiras." },
  { icon: "⭐", title: "Fidelidade", desc: "Pontos, níveis e recompensas para manter seus clientes voltando." },
  { icon: "📄", title: "NF-e Automática", desc: "Emissão de nota fiscal direto do sistema, sem complicação." },
  { icon: "⏰", title: "Controle de Ponto", desc: "Registro de entrada e saída dos funcionários integrado." },
  { icon: "📦", title: "Controle de Estoque", desc: "Alertas automáticos quando produtos estão acabando." },
];

const PLANS = [
  {
    name: "Básico",
    price: "49",
    period: "/mês",
    desc: "Perfeito para começar",
    features: ["Caixa e gestão", "Cardápio digital", "Relatórios básicos", "1 usuário", "Suporte por email"],
    highlighted: false,
    cta: "Começar Grátis",
  },
  {
    name: "Pro",
    price: "129",
    period: "/mês",
    desc: "Para restaurantes em crescimento",
    features: ["Tudo do Básico +", "Dashboard avançado", "Cozinha integrada", "Delivery próprio", "Fidelidade", "NF-e", "Ponto eletrônico", "Até 10 usuários", "Suporte prioritário"],
    highlighted: true,
    cta: "Começar Grátis",
  },
  {
    name: "Empresa",
    price: "299",
    period: "/mês",
    desc: "Para redes e franquias",
    features: ["Tudo do Pro +", "Multi-filiais", "API completa", "Usuários ilimitados", "Backup automático", "Gerente de conta dedicado", "SLA garantido"],
    highlighted: false,
    cta: "Falar com Vendas",
  },
];

const TESTIMONIALS = [
  { name: "Carlos Silva", role: "Dono do Burguer House", text: "Triplicou nossas vendas online. O cardápio digital é incrível.", rating: 5 },
  { name: "Ana Santos", role: "Gerente Pizza Total", text: "A cozinha integrada reduziu o tempo de preparo em 40%.", rating: 5 },
  { name: "Pedro Lima", role: "CEO Food Park", text: "Gerencio 3 filiais no mesmo painel. Economia de R$2.000/mês.", rating: 5 },
];

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: "#1a1a2e" }}>
      <style jsx>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 120px 24px 80px; background: linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 50%, #2d1b69 100%); color: white; position: relative; overflow: hidden; }
        .hero::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(232,25,44,0.15) 0%, transparent 60%); animation: pulse 8s ease-in-out infinite; }
        @keyframes pulse { 0%,100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 0.8; } }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 20px; border-radius: 100px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); font-size: 13px; margin-bottom: 32px; backdrop-filter: blur(10px); }
        .hero h1 { font-size: clamp(36px, 6vw, 72px); font-weight: 800; line-height: 1.1; margin-bottom: 24px; max-width: 800px; }
        .hero h1 span { background: linear-gradient(135deg, #e8192c, #ff6b35); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero p { font-size: 18px; color: rgba(255,255,255,0.7); max-width: 560px; margin-bottom: 40px; line-height: 1.6; }
        .hero-actions { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; }
        .btn-hero { padding: 16px 32px; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; border: none; transition: all .2s; }
        .btn-hero-primary { background: linear-gradient(135deg, #e8192c, #ff4757); color: white; box-shadow: 0 4px 24px rgba(232,25,44,0.4); }
        .btn-hero-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(232,25,44,0.5); }
        .btn-hero-secondary { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.3); }
        .btn-hero-secondary:hover { background: rgba(255,255,255,0.2); }
        .stats-bar { display: flex; justify-content: center; gap: 48px; padding: 40px 24px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; }
        .stat { text-align: center; }
        .stat strong { font-size: 32px; color: #e8192c; display: block; }
        .stat span { font-size: 13px; color: #6c757d; }
        .section { padding: 100px 24px; }
        .section-title { text-align: center; margin-bottom: 60px; }
        .section-title h2 { font-size: 36px; font-weight: 800; margin-bottom: 16px; }
        .section-title p { font-size: 16px; color: #6c757d; max-width: 500px; margin: 0 auto; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; max-width: 1100px; margin: 0 auto; }
        .feature-card { padding: 32px; border-radius: 16px; background: white; border: 1px solid #e9ecef; transition: all .2s; }
        .feature-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.08); border-color: #e8192c; }
        .feature-icon { font-size: 32px; margin-bottom: 16px; }
        .feature-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
        .feature-card p { font-size: 14px; color: #6c757d; line-height: 1.5; }
        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; max-width: 1000px; margin: 0 auto; }
        .plan-card { padding: 40px 32px; border-radius: 20px; background: white; border: 2px solid #e9ecef; text-align: center; transition: all .2s; position: relative; }
        .plan-card.popular { border-color: #e8192c; transform: scale(1.05); box-shadow: 0 20px 60px rgba(232,25,44,0.15); }
        .plan-badge { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); padding: 6px 20px; border-radius: 100px; background: linear-gradient(135deg, #e8192c, #ff4757); color: white; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        .plan-card h3 { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
        .plan-card .price { font-size: 48px; font-weight: 800; color: #e8192c; }
        .plan-card .price span { font-size: 16px; color: #6c757d; font-weight: 400; }
        .plan-card .desc { font-size: 14px; color: #6c757d; margin-bottom: 24px; }
        .plan-features { text-align: left; margin-bottom: 32px; }
        .plan-features li { padding: 8px 0; font-size: 14px; list-style: none; display: flex; align-items: center; gap: 8px; }
        .plan-features li::before { content: "✓"; color: #16a34a; font-weight: 700; }
        .btn-plan { width: 100%; padding: 14px; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; border: 2px solid #e8192c; background: white; color: #e8192c; transition: all .2s; }
        .btn-plan:hover { background: #e8192c; color: white; }
        .btn-plan.primary { background: linear-gradient(135deg, #e8192c, #ff4757); color: white; border: none; }
        .testimonials { background: #f8f9fa; }
        .testimonial-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; max-width: 1000px; margin: 0 auto; }
        .testimonial-card { padding: 32px; border-radius: 16px; background: white; border: 1px solid #e9ecef; }
        .testimonial-stars { color: #f59e0b; font-size: 18px; margin-bottom: 16px; }
        .testimonial-text { font-size: 15px; line-height: 1.6; margin-bottom: 16px; color: #495057; }
        .testimonial-author { font-weight: 700; font-size: 14px; }
        .testimonial-role { font-size: 13px; color: #6c757d; }
        .cta-section { text-align: center; padding: 100px 24px; background: linear-gradient(135deg, #0c0c1d, #1a1a3e); color: white; }
        .cta-section h2 { font-size: 40px; font-weight: 800; margin-bottom: 16px; }
        .cta-section p { font-size: 16px; color: rgba(255,255,255,0.7); margin-bottom: 32px; }
        footer { padding: 40px 24px; text-align: center; font-size: 13px; color: #6c757d; border-top: 1px solid #e9ecef; }
        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 16px 32px; display: flex; align-items: center; justify-content: space-between; transition: all .3s; }
        .nav.scrolled { background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); box-shadow: 0 1px 20px rgba(0,0,0,0.1); }
        .nav-brand { font-size: 20px; font-weight: 800; color: white; text-decoration: none; }
        .nav.scrolled .nav-brand { color: #1a1a2e; }
        .nav-links { display: flex; gap: 24px; align-items: center; }
        .nav-links a { color: rgba(255,255,255,0.8); text-decoration: none; font-size: 14px; font-weight: 500; }
        .nav.scrolled .nav-links a { color: #6c757d; }
        .nav-cta { padding: 10px 24px; border-radius: 8px; background: #e8192c; color: white !important; font-weight: 600; }
        @media (max-width: 768px) { .stats-bar { flex-direction: column; gap: 24px; } .hero h1 { font-size: 32px; } .section { padding: 60px 16px; } .pricing-grid { grid-template-columns: 1fr; } .plan-card.popular { transform: scale(1); } }
      `}</style>

      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <Link href="/home" className="nav-brand">🍔 Central Lanches</Link>
        <div className="nav-links">
          <a href="#features">Funcionalidades</a>
          <a href="#pricing">Planos</a>
          <a href="#testimonials">Depoimentos</a>
          <Link href="/login" className="nav-cta">Entrar</Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-badge">🚀 Novo: Delivery integrado + NF-e automática</div>
        <h1>O sistema completo para seu <span>restaurante</span></h1>
        <p>Caixa, cardápio digital, cozinha, delivery, fidelidade e gestão — tudo em uma plataforma. Sem complicação, sem comissão.</p>
        <div className="hero-actions">
          <Link href="/register" className="btn-hero btn-hero-primary">Testar 7 Dias Grátis</Link>
          <a href="#features" className="btn-hero btn-hero-secondary">Ver funcionalidades</a>
        </div>
      </section>

      <div className="stats-bar">
        <div className="stat"><strong>500+</strong><span>Restaurantes ativos</span></div>
        <div className="stat"><strong>R$ 12M+</strong><span>Vendas processadas</span></div>
        <div className="stat"><strong>4.9/5</strong><span>Avaliação média</span></div>
        <div className="stat"><strong>99.9%</strong><span>Uptime garantido</span></div>
      </div>

      <section className="section" id="features">
        <div className="section-title">
          <h2>Tudo que seu restaurante precisa</h2>
          <p>Do primeiro pedido ao relatório mensal. Uma plataforma completa.</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="pricing" style={{ background: "#f8f9fa" }}>
        <div className="section-title">
          <h2>Planos para cada tamanho</h2>
          <p>Comece grátis. Escale sem limites.</p>
        </div>
        <div className="pricing-grid">
          {PLANS.map((plan, i) => (
            <div className={`plan-card ${plan.highlighted ? "popular" : ""}`} key={i}>
              {plan.highlighted && <div className="plan-badge">Mais popular</div>}
              <h3>{plan.name}</h3>
              <div className="price">R${plan.price}<span>{plan.period}</span></div>
              <p className="desc">{plan.desc}</p>
              <ul className="plan-features">
                {plan.features.map((f, j) => <li key={j}>{f}</li>)}
              </ul>
              <Link href="/register" className={`btn-plan ${plan.highlighted ? "primary" : ""}`}>{plan.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="section testimonials" id="testimonials">
        <div className="section-title">
          <h2>O que dizem nossos clientes</h2>
          <p>Restaurantes que já transformaram seus negócios.</p>
        </div>
        <div className="testimonial-grid">
          {TESTIMONIALS.map((t, i) => (
            <div className="testimonial-card" key={i}>
              <div className="testimonial-stars">{"★".repeat(t.rating)}</div>
              <p className="testimonial-text">&ldquo;{t.text}&rdquo;</p>
              <div className="testimonial-author">{t.name}</div>
              <div className="testimonial-role">{t.role}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <h2>Pronto para transformar seu restaurante?</h2>
        <p>Comece hoje. Cancele quando quiser. Sem taxas de setup.</p>
        <Link href="/register" className="btn-hero btn-hero-primary" style={{ display: "inline-block" }}>Criar Conta Grátis</Link>
      </section>

      <footer>
        <p>© 2026 Central Lanches. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
