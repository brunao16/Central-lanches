import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error("TURSO_DATABASE_URL is required");
}

const client = createClient({ url, authToken: token });

const sql = `
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '' NOT NULL,
  price INTEGER NOT NULL,
  active INTEGER DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY NOT NULL,
  created TEXT NOT NULL,
  day TEXT NOT NULL,
  lines TEXT NOT NULL,
  payment TEXT NOT NULL,
  total INTEGER NOT NULL,
  received INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS sales_day ON sales (day);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY NOT NULL,
  day TEXT NOT NULL,
  merchant TEXT NOT NULL,
  amount INTEGER NOT NULL,
  receipt TEXT,
  created TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS expenses_day ON expenses (day);
`;

async function main() {
  const statements = sql.split(";").filter((s) => s.trim());
  for (const stmt of statements) {
    if (stmt.trim()) {
      await client.execute(stmt.trim());
    }
  }
  console.log("Tabelas criadas com sucesso!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Erro:", e);
  process.exit(1);
});
