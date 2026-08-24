import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
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
    await client.query("SELECT pg_advisory_lock($1)", [72_707_369]);
    const migrationRows = await client.query<{
      migration_name: string;
      finished_at: Date | null;
      rolled_back_at: Date | null;
    }>(
      `SELECT "migration_name", "finished_at", "rolled_back_at"
       FROM "_prisma_migrations"`,
    );
    const unfinished = migrationRows.rows.find(
      (row) => row.finished_at === null && row.rolled_back_at === null,
    );
    if (unfinished) {
      throw new Error(
        `Migrasi ${unfinished.migration_name} belum selesai; periksa sebelum deploy baru.`,
      );
    }
    const applied = new Set(
      migrationRows.rows
        .filter(
          (row) => row.finished_at !== null && row.rolled_back_at === null,
        )
        .map((row) => row.migration_name),
    );
    const pending = migrationNames.filter((name) => !applied.has(name));
    if (!pending.length) {
      console.log("No pending migrations to deploy.");
      return;
    }

    for (const migrationName of pending) {
      const sql = await readFile(
        resolve(migrationsRoot, migrationName, "migration.sql"),
        "utf8",
      );
      const checksum = createHash("sha256").update(sql).digest("hex");
      const id = randomUUID();
      await client.query("BEGIN");
      try {
        await client.query("SET LOCAL lock_timeout = '10s'");
        await client.query("SET LOCAL statement_timeout = '60s'");
        await client.query(
          `INSERT INTO "_prisma_migrations"
            ("id", "checksum", "migration_name", "started_at", "applied_steps_count")
           VALUES ($1, $2, $3, NOW(), 0)`,
          [id, checksum, migrationName],
        );
        await client.query(sql);
        await client.query(
          `UPDATE "_prisma_migrations"
           SET "finished_at" = NOW(), "applied_steps_count" = 1
           WHERE "id" = $1`,
          [id],
        );
        await client.query("COMMIT");
        console.log(`Applied migration: ${migrationName}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client
      .query("SELECT pg_advisory_unlock($1)", [72_707_369])
      .catch(() => undefined);
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
