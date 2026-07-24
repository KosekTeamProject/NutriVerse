import "dotenv/config";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DIRECT_URL atau DATABASE_URL belum dikonfigurasi.");
}

async function main() {
  const migrationsRoot = resolve("prisma/migrations");
  const migrationNames = (
    await readdir(migrationsRoot, { withFileTypes: true })
  )
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const client = new pg.Client({
    connectionString,
    connectionTimeoutMillis: 15_000,
  });

  await client.connect();
  try {
    const appliedResult = await client.query<{
      migration_name: string;
    }>(
      `SELECT "migration_name"
       FROM "_prisma_migrations"
       WHERE "finished_at" IS NOT NULL
         AND "rolled_back_at" IS NULL`,
    );
    const applied = new Set(
      appliedResult.rows.map((row) => row.migration_name),
    );
    const pending = migrationNames.filter((name) => !applied.has(name));
    if (!pending.length) {
      console.log("No pending migrations to validate.");
      return;
    }
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '10s'");
    await client.query("SET LOCAL statement_timeout = '60s'");
    for (const migrationName of pending) {
      const sql = await readFile(
        resolve(migrationsRoot, migrationName, "migration.sql"),
        "utf8",
      );
      await client.query(sql);
    }
    await client.query("ROLLBACK");
    console.log(
      `Validated and rolled back: ${pending.join(", ")}`,
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
