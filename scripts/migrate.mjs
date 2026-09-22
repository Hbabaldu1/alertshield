import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { Pool } from "pg";

const databaseUrl = process.env.POSTGRES_URL;
if (!databaseUrl) throw new Error("POSTGRES_URL is required");
const command = process.argv[2] ?? "up";
const directory = join(process.cwd(), "database/migrations");
const pool = new Pool({ connectionString: databaseUrl });

try {
  await pool.query("CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  const migrations = (await readdir(directory)).filter((file) => file.endsWith(".up.sql")).sort();
  if (command === "status") {
    const result = await pool.query<{ version: string; applied_at: string }>("SELECT version, applied_at FROM schema_migrations ORDER BY version");
    console.table(result.rows);
  } else if (command === "up") {
    const applied = new Set((await pool.query<{ version: string }>("SELECT version FROM schema_migrations")).rows.map((row) => row.version));
    for (const file of migrations) {
      const version = file.replace(/\.up\.sql$/, "");
      if (applied.has(version)) continue;
      const sql = await readFile(join(directory, file), "utf8");
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations(version) VALUES ($1)", [version]);
        await client.query("COMMIT");
        console.log(`Applied ${version}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally { client.release(); }
    }
  } else {
    throw new Error(`Unsupported migration command: ${command}. Use up or status.`);
  }
} finally {
  await pool.end();
}
