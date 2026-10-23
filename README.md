# Central Lanches v2 - Marketplace de Delivery

Marketplace completo de comida e bebidas para cidades pequenas e médias, estilo UaiRango / iFood.

## 🚀 Tecnologias
- **Next.js 15+** com App Router e TypeScript
- **Tailwind CSS** para estilização mobile-first moderna
- **Supabase** (PostgreSQL, Autenticação e Realtime)
- **Asaas** (Split de pagamentos Pix e Cartão na Sandbox/Produção)
- **PWA** (Instalável no celular sem loja de aplicativos)

---

## 📱 Funcionalidades Implementadas (100% Concluído)

### 1. Clientes
- **Vitrine:** Seleção de cidades, busca instantânea por lanche ou restaurante e carrossel de categorias.
- **Cardápio:** Visualização com fotos, preços, horários, tempo estimado e taxa de entrega.
- **Carrinho & Checkout:** Seleção de complementos, observações do pedido, aplicação de cupons de desconto (`BEMVINDO10`, `CENTRAL5`, etc.).
- **Pagamento:** Pix com QR Code e Copia-e-Cola na tela, Cartão de Crédito/Débito e Dinheiro com troco.
- **Rastreio:** Acompanhamento ao vivo do pedido via Supabase Realtime.

### 2. Restaurantes (Painel Web)
- Cadastro com CNPJ, endereço e configurações de entrega.
- Gestão completa de cardápio (adicionar categorias, produtos e pausar itens esgotados).
- Botão instantâneo de **Abrir / Fechar Estabelecimento**.
- **Painel de Pedidos em Tempo Real com alerta sonoro automático** a cada novo pedido.

### 3. Administrador Geral (Painel `/admin`)
- Relatório financeiro: Volume Bruto, Comissão da Plataforma (Lucro) e Repasses aos restaurantes.
- Gestão de parceiros: Aprovação, Bloqueio e taxa de comissão customizável por restaurante.

---

## 🌐 Como Publicar na Vercel (Passo a Passo)

1. Crie uma conta gratuita em [vercel.com](https://vercel.com).
2. Clique em **"Add New Project"** e selecione o repositório deste projeto (`central-lanches-v2`).
3. Na seção **Environment Variables**, adicione as mesmas variáveis do seu arquivo `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ASAAS_API_KEY` (opcional durante os testes)
4. Clique em **Deploy**. Em menos de 2 minutos seu marketplace estará no ar!
