import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DB_URL || "libsql://central-lanches-washington.aws-us-west-2.turso.io",
  authToken: process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTAwMzYyMDgsImlkIjoiMDFhMGM2NzctOTEwMS03ZTM4LWE3YTctOTJiMjQyZjhkNWZkIiwia2lkIjoiX0JkalJZUmFzTmh4LTJnNXU4MWRGSEJyQkNEYmNwZFVFTW1zbHRjT2pHWSIsInJpZCI6IjUyNDQwYjAzLTM4NDYtNDU0Zi1iMzA0LTAxYjg4ZjFjMmJlYyJ9.8NKhyadNZOD_iDUtPiW-7izOH7krVv7x962vp-IxZIezgUvpaSsNhH7WAN5fL04dyDSTMPLYDMNgKgzv_eOnAw",
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
