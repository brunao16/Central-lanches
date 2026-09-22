import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

if (!url) throw new Error("TURSO_DATABASE_URL is required");

const client = createClient({ url, authToken: token });

const sql = `
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY NOT NULL,
  created TEXT NOT NULL,
  day TEXT NOT NULL,
  items TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total INTEGER NOT NULL DEFAULT 0,
  branch TEXT NOT NULL DEFAULT 'principal',
  table_num TEXT NOT NULL DEFAULT '',
  note TEXT,
  ready_at TEXT,
  delivered_at TEXT
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  visits INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  created TEXT NOT NULL,
  favorite INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'percent',
  value INTEGER NOT NULL DEFAULT 0,
  uses_left INTEGER NOT NULL DEFAULT 1,
  valid_until TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO settings (key, value) VALUES ('daily_goal', '50000');
INSERT OR IGNORE INTO settings (key, value) VALUES ('tip_enabled', 'true');
INSERT OR IGNORE INTO settings (key, value) VALUES ('split_enabled', 'true');
`;

async function main() {
  const statements = sql.split(";").filter(function(s) { return s.trim(); });
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
  console.log("\nMigracao concluida!");
  process.exit(0);
}

main().catch(function(e) {
  console.error("Erro:", e);
  process.exit(1);
});
