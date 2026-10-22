# 🍔 Central Lanches - Sistema de Caixa & Gestão

Sistema completo e profissional de ponto de venda (PDV), gestão de pedidos, cozinha (KDS), delivery, controle financeiro, estoque e cardápio digital para lanchonetes.

Construído com **Next.js (App Router)**, **TypeScript estrito**, **Tailwind CSS**, **Prisma ORM** e **PostgreSQL** (compatível com Neon, Supabase e Vercel Postgres).

---

## 🚀 Funcionalidades Principais

1. **Acesso Direto (Sem Tela de Login):**
   - Abrir a raiz `/` entra diretamente no painel de gestão e caixa.
   - Proteção opcional por PIN (variável `ADMIN_PIN` de 4 a 6 dígitos com cookie de 30 dias). Se vazia, tudo abre sem pedir nada.
2. **Caixa / PDV (`/caixa`):**
   - Grade visual de produtos com busca e categorias.
   - Observações por item ("sem cebola", "ponto da carne", etc.).
   - Tipos de atendimento: **Balcão**, **Mesa**, **Delivery** e **Retirada**.
   - Pagamentos: **Pix**, **Dinheiro com cálculo de troco**, **Débito**, **Crédito**.
   - Abertura e fechamento de caixa, sangrias, suprimentos e conferência da gaveta.
   - Impressão térmica de comprovante de 80mm com formatação CSS `@media print`.
3. **Cozinha KDS (`/cozinha`):**
   - Quadro Kanban em colunas: *Novos*, *Em Preparo* e *Prontos*.
   - Timer e destaque visual para pedidos atrasados (>25min).
   - Atualização automática em tempo real a cada 5 segundos (polling).
4. **Delivery (`/delivery`):**
   - Gestão de pedidos com endereço e telefone.
   - Botão direto para **WhatsApp (`wa.me`)** com mensagem pronta notificando o cliente.
   - Despacho e confirmação de entrega.
5. **Cardápio Digital do Cliente (`/menu`):**
   - Interface mobile-first pública para clientes fazerem pedidos pelo celular ou via QR Code da mesa (`/menu?mesa=2`).
   - Sacola de compras, seleção de bairro com taxa calculada e acompanhamento do pedido em tempo real (`/pedido/[codigo]`).
6. **Gestão de Produtos & Cardápio (`/cardapio`):**
   - Cadastro, edição e exclusão de itens, fotos, descrições, preços de venda e custos.
7. **Controle de Gastos (`/gastos`):**
   - Lançamento de despesas categorizadas (insumos, aluguel, funcionários, contas).
8. **Estoque de Insumos (`/estoque`):**
   - Cadastro com unidade de medida, quantidade mínima e alerta visual de estoque baixo.
9. **Clientes & Fidelidade (`/clientes`):**
   - Cadastro automático pelo WhatsApp nas vendas com pontuação automática (1 ponto a cada R$ 10).
10. **Dashboard & Analytics (`/`):**
    - Gráfico de vendas por hora (Recharts), faturamento diário/semanal/mensal, ticket médio e lucro estimado.
11. **Relatórios (`/relatorios`):**
    - Exportação de CSV de vendas, despesas e catálogo de produtos.
12. **Configurações (`/configuracoes`):**
    - Dados da lanchonete, horários, chave Pix e taxas de entrega.

---

## 🛠️ Como Rodar Localmente

### 1. Clonar e Instalar Dependências
```bash
git clone https://github.com/brunao16/Central-lanches.git
cd Central-lanches
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz (copie do `.env.example`):
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/central_lanches?schema=public"
ADMIN_PIN=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **Dica:** Você pode usar uma instância PostgreSQL gratuita do [Neon.tech](https://neon.tech) ou [Supabase](https://supabase.com).

### 3. Rodar as Migrations e o Seed
```bash
# Aplica as tabelas no banco de dados
npx prisma migrate deploy

# Popula o banco com categorias, 15 produtos, mesas, taxas e estoque
npx prisma db seed
```

### 4. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000).

---

## ☁️ Publicação na Vercel

1. Suba o projeto para o seu repositório no GitHub.
2. Acesse a **[Vercel](https://vercel.com)** e importe o repositório.
3. Configure a variável de ambiente no painel da Vercel (**Settings** ➔ **Environment Variables**):
   - `DATABASE_URL`: Cole a connection string do seu banco PostgreSQL (Neon ou Supabase com Pooler ativado).
   - `ADMIN_PIN`: Deixe vazio para acesso aberto ou defina um PIN (ex: `1234`).
4. O comando de build já configurado no `package.json` é:
   ```json
   "build": "prisma generate && next build"
   ```
5. Para rodar as migrations em produção, você pode executar uma vez pelo terminal:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```
   ou adicionar `prisma migrate deploy && prisma generate && next build` no Build Command da Vercel.

---

## 🔒 Segurança e SEO

- **Privacidade Total:** Todas as páginas administrativas incluem `metadata.robots: { index: false, follow: false }` e o arquivo `public/robots.txt` bloqueia qualquer robô de busca com `Disallow: /`.
- **Valores em Centavos:** Todos os valores financeiros são armazenados como números inteiros (centavos) para total precisão matemática sem erros de ponto flutuante.
