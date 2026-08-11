import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/nutriverse";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found.");
    return;
  }
  console.log("User:", user.id);

  // Check today's health pulse
  const pulses = await prisma.healthPulse.findMany({
    where: { userId: user.id },
    orderBy: { pulseDate: "desc" },
    take: 5,
  });

  console.log("Recent pulses:", pulses);
}

main().catch(console.error).finally(() => prisma.$disconnect());
