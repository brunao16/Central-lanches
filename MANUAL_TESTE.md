# 🧪 MANUAL DE TESTES DE INTEGRAÇÃO E SEGURANÇA — UAIFOOD

Este manual orienta o passo a passo para validar todas as etapas de segurança, autenticação e pedidos reais no Supabase e na aplicação.

---

## 1. Como aplicar as Migrações no Banco de Dados Supabase
Acesse o **Dashboard do Supabase** do seu projeto (`vafnozlbgtrpgfvcmyig`):
1. No menu lateral, clique em **SQL Editor** -> **New query**.
2. Abra e cole o conteúdo de cada migração na seguinte ordem:
   - `supabase/migrations/01_auth_roles_triggers.sql` *(Configura trigger automática de profiles e papel courier)*
   - `supabase/migrations/02_complete_rls_security.sql` *(Ativa RLS estrita em todas as 12 tabelas e policies)*
   - `supabase/migrations/03_coupons_and_atomic_orders.sql` *(Cria tabela de cupons e função atômica de pedidos)*
   - `supabase/seed.sql` *(Insere a cidade de Passos - MG, categorias e cupons iniciais)*
3. Clique no botão verde **Run** em cada uma.

---

## 2. Testando a Autenticação e Papéis Seguros (Etapa 1)
1. **Cadastro como cliente:**
   - Acesse `/login`, marque "Não tem uma conta? Cadastre-se".
   - Digite seu nome, e-mail e senha.
   - Mesmo que alguém force envio via Postman com `{ role: "admin" }`, o endpoint `/api/auth/signup` ignora e grava estritamente como `customer`.
2. **Promovendo seu usuário a Administrador:**
   - No SQL Editor do Supabase, execute:
     ```sql
     UPDATE public.profiles SET role = 'admin' WHERE email = 'seu_email@exemplo.com';
     ```
   - Faça login novamente. O sistema irá redirecioná-lo diretamente para a rota `/admin`.
3. **Proteção de Rota:**
   - Se um usuário comum ou deslogado tentar acessar `/admin`, o `middleware.ts` intercepta e redireciona para `/` ou `/login`.

---

## 3. Testando as Permissões do Banco (RLS) (Etapa 2)
1. No SQL Editor do Supabase, rode o script `supabase/tests_rls.sql`:
   - Apenas restaurantes aprovados (`status = 'approved'`) são visíveis publicamente.
   - Visitantes não autenticados não conseguem ler pedidos de clientes nem alterar dados.
   - Donos de restaurantes não conseguem alterar a taxa de comissão (`commission_rate_percent`) do próprio estabelecimento.

---

## 4. Testando Criação Segura de Pedidos (Etapa 3)
1. Abra o carrinho em `/carrinho` com itens reais.
2. Tente alterar valores via DevTools:
   - O servidor **recalcula** os preços consultando a tabela `products` no banco e ignora qualquer valor em centavos vindo do front-end.
   - O cupom `BEMVINDO10` é verificado no banco de dados na tabela `coupons`.
   - Se o pedido for abaixo do pedido mínimo (`min_order_cents`), a API rejeita com mensagem em português claro.

---

## 5. Testando Pagamento Pix Asaas e Webhook Seguro (Etapa 4)
1. Configure as variáveis de ambiente no arquivo `.env.local` e na Vercel:
   - `ASAAS_API_KEY`: sua chave de API do Asaas (Sandbox ou Produção).
   - `ASAAS_WEBHOOK_ACCESS_TOKEN`: token secreto configurado no Asaas para validação do webhook.
2. Ao selecionar **Pix**, o sistema solicita a criação do Pix no Asaas e retorna QR Code e Copia-e-Cola reais.
3. Quando o Asaas notifica o webhook em `/api/asaas/webhook`:
   - O token `asaas-access-token` do cabeçalho é validado com comparação em tempo constante.
   - O webhook consulta a cobrança no Asaas para confirmar valor e idempotência.
   - O pedido passa para `payment_status = 'paid'` e `status = 'confirmed'`.
