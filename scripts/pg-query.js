import { Pool } from "pg";

const pool = new Pool({
  connectionString: "postgresql://postgres:postgres@localhost:5432/nutriverse?schema=public",
});

async function main() {
  const result = await pool.query("SELECT id, \"dailyProteinTargetGrams\", \"dailySleepTargetHours\" FROM health_profiles LIMIT 1;");
  console.log("Profiles:", result.rows);
  
  const pulses = await pool.query("SELECT * FROM health_pulses ORDER BY \"createdAt\" DESC LIMIT 5;");
  console.log("Recent pulses:", pulses.rows);
}

main().catch(console.error).finally(() => pool.end());
