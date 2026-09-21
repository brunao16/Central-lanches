# Central Lanches - Deploy Vercel

## Pre-requisitos
- Conta no [GitHub](https://github.com)
- Conta no [Vercel](https://vercel.com) (grátis)
- Conta no [Turso](https://turso.tech) (grátis)

## Passo 1: Criar banco no Turso

1. Acesse https://turso.tech e crie uma conta
2. Clique em "Create Database"
3. Nome: `central-lanches`
4. Região: São Paulo (ou mais próxima)
5. Copie a URL e o Token

## Passo 2: Push para GitHub

```bash
cd "C:\Users\WasHington\Desktop\central-lanches"
git init
git add .
git commit -m "Central Lanches - versão inicial"
```

Crie um repo no GitHub e faça push:
```bash
git remote add origin https://github.com/SEU-USER/central-lanches.git
git branch -M main
git push -u origin main
```

## Passo 3: Deploy na Vercel

1. Acesse https://vercel.com
2. Clique em "Add New Project"
3. Importe o repositório do GitHub
4. Configure as variáveis de ambiente:

| Variável | Valor |
|----------|-------|
| `TURSO_DATABASE_URL` | `libsql://central-lanches-SEU-USUARIO.turso.io` |
| `TURSO_AUTH_TOKEN` | `eyJ...` (token do Turso) |

5. Clique em "Deploy"

## Passo 4: Criar tabelas no banco

Após o primeiro deploy, acesse o terminal da Vercel ou rode localmente:

```bash
npx drizzle-kit push
```

Isso cria as tabelas products, sales e expenses automaticamente.

## Pronto!

Acesse a URL que a Vercel gerar (ex: central-lanches.vercel.app)

## Estrutura

```
central-lanches/
├── app/
│   ├── api/
│   │   ├── records/route.ts    # CRUD de produtos, vendas e gastos
│   │   └── receipt/route.ts    # Comprovantes
│   ├── globals.css             # Estilos
│   ├── layout.tsx              # Layout principal
│   └── page.tsx                # Tela principal (Caixa, Lanches, Gastos, Gestão)
├── components/ui/
│   ├── tabs.tsx                # Componente de abas
│   └── radio-group.tsx         # Grupo de radio buttons
├── db/
│   ├── index.ts                # Conexão com Turso
│   └── schema.ts               # Schema do banco
├── drizzle.config.ts           # Config Drizzle
├── package.json
├── tailwind.config.js
└── next.config.js
```

## Funcionalidades

- **Caixa**: PDV completo com cardápio, pedido e pagamento
- **Lanches**: Cadastro e gerenciamento do cardápio
- **Gastos**: Registro de despesas com comprovante
- **Gestão**: Relatórios de vendas, gastos e saldo

## Tecnologias

- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Drizzle ORM
- Turso (SQLite serverless)
- TypeScript
