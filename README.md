# UaiFood / Central Lanches - Marketplace de Delivery

Plataforma completa de delivery focada em cidades do interior, iniciando por **Passos - MG**. Modelo de comissão de 10% sobre vendas, sem mensalidade para os restaurantes parceiros.

---

## 🛠️ Stack Tecnológica

- **Next.js 16 (App Router)** & **React 19** com TypeScript rigoroso
- **Tailwind CSS 4** com paleta exclusiva de tons quentes (terracota `#C84B31` e neutros quentes)
- **Supabase** (PostgreSQL, Auth com SSR Cookies HTTP-only, Realtime e RLS com 12 tabelas protegidas)
- **Asaas Gateway** (Cobranças Pix com QR Code dinâmico, Webhook idempotente e split de pagamentos)

---

## 🚀 Como Rodar o Projeto Localmente

### 1. Clonar o repositório e instalar dependências
```bash
git clone https://github.com/brunao16/Central-lanches.git
cd Central-lanches
npm install
```

### 2. Configurar as variáveis de ambiente
Copie o arquivo `.env.example` para `.env.local`:
```bash
cp .env.example .env.local
```
Preencha as seguintes chaves:
- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto no Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave pública anon do Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave secreta de serviço do Supabase
- `ASAAS_API_KEY`: Token de API do Asaas (Sandbox ou Produção)
- `ASAAS_WEBHOOK_TOKEN`: Token secreto cadastrado no Webhook do Asaas

### 3. Executar as migrações no Supabase
Execute os scripts SQL na aba **SQL Editor** do Supabase na seguinte ordem:
1. `supabase/migrations/01_auth_roles_triggers.sql` (Criação de papéis e trigger de perfil)
2. `supabase/migrations/02_complete_rls_security.sql` (Políticas de segurança RLS em todas as tabelas)
3. `supabase/migrations/03_coupons_and_atomic_orders.sql` (Tabela de cupons e gravação atômica de pedidos)
4. `supabase/seed.sql` (Dados iniciais de Passos - MG, categorias e cupons de boas-vindas)

### 4. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
Acesse em seu navegador: [http://localhost:3000](http://localhost:3000)

---

## 🛡️ Arquitetura de Segurança & Regras de Negócio

1. **Autenticação Segura com SSR Cookies:**
   - Sessões gerenciadas via cookies HTTP-only pelo `@supabase/ssr`.
   - Rotas `/admin`, `/painel/restaurante` e `/entregador` rigorosamente protegidas por middleware com validação de perfil (`profiles.role`).
2. **Cálculo de Preços Server-Side:**
   - Preços enviados pelo cliente são totalmente ignorados na API `/api/orders`. O servidor busca os valores diretamente no banco de dados e calcula taxas, comissões e descontos de cupom.
3. **Webhook do Asaas com Proteção Criptográfica:**
   - Validação de token em tempo constante (`crypto.timingSafeEqual`) contra ataques de temporização.
   - Verificação em tempo real do status na API oficial do Asaas antes de confirmar o pagamento do pedido.
4. **Privacidade e LGPD:**
   - Entregadores só têm acesso ao endereço exato e telefone do cliente após aceitarem e iniciarem a corrida.

---

## 📋 Checklist de Entrada em Produção (Go-Live)

- [x] Migrações e RLS aplicadas no PostgreSQL do Supabase.
- [x] Webhook configurado no Asaas apontando para `https://central-lanches-oficial.vercel.app/api/asaas/webhook`.
- [x] Headers de segurança HTTP ativados no `next.config.ts`.
- [x] Build de produção validado (`npm run build`).
- [ ] Cadastrar o primeiro restaurante oficial parceiro de Passos - MG via `/cadastro-restaurante`.
- [ ] Ativar a loja no `/painel/restaurante` e realizar um pedido teste com Pix real de R$ 1,00.
