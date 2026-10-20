# Correções do Central Lanches

## Publicação concluída

Atualização publicada em 25/09/2026 no endereço https://central-lanches-theta.vercel.app.
Deployment: `dpl_DzPU7jpq9FW2BAjr7uuFqa55Zi9D`.
As 16 tabelas foram migradas com bloqueio de gravação e cópia de segurança anterior em
`work/database-backups/before-migration-1790390919671.json`.
Conferência após a migração: 2 produtos, 1 venda, 1 gasto, 3 usuários e 3 filiais preservados.
Login e cardápio responderam normalmente; o cardápio retornou os 2 produtos e os dados
privados recusaram acesso sem autenticação. A chave de sessão da produção foi configurada;
sessões antigas exigem novo login. As limitações das integrações externas abaixo permanecem.

## Validação local

```powershell
npm install
npm test
npm run typecheck
node scripts/preview.cjs build
node scripts/preview.cjs start
```

A prévia usa exclusivamente a cópia migrada indicada em `work/preview-db.json`, no endereço `http://127.0.0.1:3100`. O arquivo `.env` original continua apontando para o banco existente. A prévia não altera esse banco.

O teste de migração preservou os 2 produtos, 1 venda, 1 gasto, 3 usuários e 3 filiais. Os três cadastros antigos foram confirmados pelo proprietário como pertencentes ao mesmo negócio; o identificador de estabelecimento usado é `principal`.

## Mudanças

- Layout responsivo do caixa, busca de produtos e estados separados de carregamento, falha e cardápio vazio.
- Autenticação por cookie HttpOnly, encerramento real da sessão, validação de usuário ativo e remoção da chave JWT padrão.
- Senhas de funcionários protegidas com hash; respostas de usuários não incluem senhas.
- Todas as consultas de dados operacionais delimitadas pelo estabelecimento da sessão. Ações administrativas validadas no servidor.
- Venda, estoque, cupom e fidelidade gravados em uma única transação. O preço é recalculado pelo servidor; descontos e gorjetas são persistidos.
- Cancelamento preserva a venda e restitui estoque/cupom. Restauração recupera os valores originais, sujeita à disponibilidade de estoque.
- Cardápio público próprio, sem expor vendas ou custos, e pedidos públicos com preços validados e prevenção de repetição.
- Despesas e receitas filtradas pela mesma filial; ranking considera todos os itens; exportações escapam conteúdo HTML e fórmulas de planilha.
- Backup completo de produtos, vendas e gastos, incluindo cancelamentos. Importação transacional de registros ausentes, limitada ao mesmo estabelecimento.
- Next.js 15.5.26 e dependências atualizadas. A auditoria da instalação retornou zero vulnerabilidades conhecidas.

## Publicação e banco online

Não publique o código novo antes de preparar a atualização do banco. As colunas novas são obrigatórias.

1. Suspenda temporariamente as gravações na versão antiga e faça a publicação de forma coordenada.
2. Configure `LEGACY_TENANT_ID=principal` para os dados antigos confirmados neste projeto.
3. Execute `npm run db:check` para conferir a conexão e `npm run db:migrate` para migrar. A migração exige uma cópia de segurança para bancos existentes e a grava automaticamente em `work/database-backups` antes de alterar as tabelas. Campos desconhecidos interrompem a migração para evitar perda de dados.
4. Publique a versão corrigida com `JWT_SECRET` aleatória de pelo menos 32 caracteres e as variáveis de banco e armazenamento da produção.
5. Confira login, produtos, caixa, relatório e cardápio público antes de retomar as vendas.

O script `scripts/clone-database.cjs` lê o banco online e cria uma nova cópia local para ensaiar a migração. Ele nunca migra o banco de origem.

## Integrações que ainda dependem de configuração externa

- A emissão fiscal anterior apenas gravava uma linha como “emitida”, sem integração fiscal. Agora a aplicação informa que nenhuma nota foi emitida. É necessário integrar um emissor fiscal antes de oferecer essa função como emissão real.
- A cobrança exige configuração Stripe e vínculo de cliente confiável no banco. Identificadores enviados pelo navegador não concedem acesso ao portal de cobrança de outros clientes. A implementação original não possui sincronização completa de assinatura por webhook.
- Comprovantes previamente gravados em armazenamento público continuam públicos para quem já tem o endereço. A rota que os localiza agora exige autenticação e valida o estabelecimento.
- Uma credencial Turso embutida em um script antigo foi removida do código atual. Ela pode permanecer no histórico Git e deve ser revogada/substituída no provedor antes da publicação.

As alterações locais de cobrança, pacote e configuração que já existiam antes desta revisão foram preservadas.
