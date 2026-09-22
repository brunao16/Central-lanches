import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

if (!url) throw new Error("TURSO_DATABASE_URL is required");

const client = createClient({ url, authToken: token });

const sql = `
ALTER TABLE products ADD COLUMN photo TEXT;
ALTER TABLE products ADD COLUMN category TEXT NOT NULL DEFAULT 'Geral';
ALTER TABLE products ADD COLUMN stock INTEGER NOT NULL DEFAULT -1;

ALTER TABLE sales ADD COLUMN branch TEXT NOT NULL DEFAULT 'principal';
ALTER TABLE sales ADD COLUMN employee TEXT NOT NULL DEFAULT '';
ALTER TABLE sales ADD COLUMN note TEXT;

ALTER TABLE expenses ADD COLUMN branch TEXT NOT NULL DEFAULT 'principal';

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'caixa',
  branch TEXT NOT NULL DEFAULT 'principal',
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1
);

INSERT OR IGNORE INTO branches (id, name) VALUES ('principal', 'Principal');

INSERT OR IGNORE INTO users (id, username, password, name, role) VALUES ('admin-001', 'admin', 'admin123', 'Administrador', 'admin');
`;

async function main() {
  const statements = sql.split(";").filter(function(s) { return s.trim(); });
  for (const stmt of statements) {
    if (stmt.trim()) {
      try {
        await client.execute(stmt.trim());
        console.log("OK:", stmt.trim().slice(0, 60) + "...");
      } catch (e) {
        if (e.message && e.message.includes("duplicate column")) {
          console.log("SKIP:", stmt.trim().slice(0, 60) + "...");
        } else {
          console.error("ERR:", stmt.trim().slice(0, 60) + "...", e.message);
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
