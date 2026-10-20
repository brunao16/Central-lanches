import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  console.log("Running v5 migration: plan column + tenant_id...");

  try {
    await db.execute(`ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'basico'`);
    console.log("✅ Added plan column to users table");
  } catch (e) {
    if (e.message?.includes("duplicate column")) {
      console.log("⚠️  plan column already exists, skipping");
    } else {
      console.error("❌ Error adding plan column:", e.message);
    }
  }

  try {
    await db.execute(`ALTER TABLE users ADD COLUMN tenant_id TEXT NOT NULL DEFAULT ''`);
    console.log("✅ Added tenant_id column to users table");
  } catch (e) {
    if (e.message?.includes("duplicate column")) {
      console.log("⚠️  tenant_id column already exists, skipping");
    } else {
      console.error("❌ Error adding tenant_id column:", e.message);
    }
  }

  console.log("✅ Migration v5 complete!");
}

migrate().catch(console.error);
