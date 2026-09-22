import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;
if (!url) throw new Error("TURSO_DATABASE_URL is required");
const client = createClient({ url, authToken: token });

const sql = `
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id TEXT PRIMARY KEY NOT NULL,
  number INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  capacity INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'available',
  current_order TEXT,
  branch TEXT NOT NULL DEFAULT 'principal'
);

CREATE TABLE IF NOT EXISTS time_clock (
  id TEXT PRIMARY KEY NOT NULL,
  employee TEXT NOT NULL,
  clock_in TEXT NOT NULL,
  clock_out TEXT,
  branch TEXT NOT NULL DEFAULT 'principal',
  day TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS loyalty (
  id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_redeemed INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'bronze'
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT NOT NULL,
  type TEXT NOT NULL,
  points INTEGER NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deliveries (
  id TEXT PRIMARY KEY NOT NULL,
  sale_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  driver TEXT NOT NULL DEFAULT '',
  created TEXT NOT NULL,
  picked_at TEXT,
  delivered_at TEXT,
  branch TEXT NOT NULL DEFAULT 'principal',
  note TEXT
);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY NOT NULL,
  items TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  table_num TEXT NOT NULL DEFAULT '',
  employee TEXT NOT NULL DEFAULT '',
  branch TEXT NOT NULL DEFAULT 'principal',
  created TEXT NOT NULL,
  started_at TEXT,
  ready_at TEXT,
  note TEXT
);

CREATE TABLE IF NOT EXISTS nfes (
  id TEXT PRIMARY KEY NOT NULL,
  sale_id TEXT NOT NULL,
  number INTEGER NOT NULL,
  cpf_cnpj TEXT NOT NULL DEFAULT '',
  created TEXT NOT NULL,
  xml TEXT,
  status TEXT NOT NULL DEFAULT 'emitida'
);
`;

async function main() {
  const statements = sql.split(";").filter(s => s.trim());
  for (const stmt of statements) {
    if (stmt.trim()) {
      try {
        await client.execute(stmt.trim());
        console.log("OK:", stmt.trim().slice(0, 50) + "...");
      } catch (e) {
        if (e.message && (e.message.includes("duplicate") || e.message.includes("already exists"))) {
          console.log("SKIP:", stmt.trim().slice(0, 50) + "...");
        } else {
          console.error("ERR:", stmt.trim().slice(0, 50) + "...", e.message);
        }
      }
    }
  }
  console.log("\nMigracao v4 concluida!");
  process.exit(0);
}

main().catch(e => { console.error("Erro:", e); process.exit(1); });
