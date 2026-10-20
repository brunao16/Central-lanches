const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const config = {};
for (const line of env.split('\n')) {
  const [k, ...v] = line.split('=');
  if (k && v.length) config[k.trim()] = v.join('=').trim();
}
const { createClient } = require('@libsql/client');
const client = createClient({ url: config.TURSO_DATABASE_URL, authToken: config.TURSO_AUTH_TOKEN });

async function consolidate() {
  console.log('--- CONSOLIDANDO PARA FILIAL E CONTA ÚNICA ---');
  
  // 1. Migra vendas, gastos, pedidos, etc. para a filial 'principal'
  await client.execute("UPDATE sales SET branch = 'principal'");
  await client.execute("UPDATE expenses SET branch = 'principal'");
  await client.execute("UPDATE orders SET branch = 'principal'");
  await client.execute("UPDATE deliveries SET branch = 'principal'");
  await client.execute("UPDATE tickets SET branch = 'principal'");
  await client.execute("UPDATE time_clock SET branch = 'principal'");
  await client.execute("UPDATE restaurant_tables SET branch = 'principal'");
  
  // 2. Aponta usuário para 'principal'
  await client.execute("UPDATE users SET branch = 'principal'");

  // 3. Renomeia filial 'principal' para 'Central Lanches' e apaga as outras
  await client.execute("UPDATE branches SET name = 'Central Lanches', active = 1 WHERE id = 'principal'");
  await client.execute("DELETE FROM branches WHERE id != 'principal'");

  // 4. Mantém apenas a sua conta principal de administrador (washington / moraesguga.95@gmail.com)
  await client.execute("DELETE FROM users WHERE id IN ('admin-001', '674be710-69a4-4ecf-88aa-48ca7b04f657')");

  console.log('Sucesso!');
  const users = await client.execute("SELECT id, username, name, role, branch FROM users");
  console.log('USUÁRIOS RESTANTES:', users.rows);
  const branches = await client.execute("SELECT id, name FROM branches");
  console.log('FILIAIS RESTANTES:', branches.rows);
}

consolidate().catch(console.error);
