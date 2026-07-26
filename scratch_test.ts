import { prisma } from "./src/lib/prisma";
import { buildProgressOverview } from "./src/server/progress/progress-service";

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found");
    return;
  }
  
  // Create a pulse
  const now = new Date();
  const dayKey = now.toISOString().slice(0, 10);
  const pulseDate = new Date(`${dayKey}T00:00:00.000Z`);
  
  await prisma.healthPulse.upsert({
    where: { userId_pulseDate: { userId: user.id, pulseDate } },
    create: {
      userId: user.id,
      pulseDate,
      sleepHours: 8,
      hydrationLiters: 1.5,
      overallScore: 80,
    },
    update: {
      sleepHours: 8,
      hydrationLiters: 1.5,
    }
  });

  // Call buildProgressOverview
  const overview = await buildProgressOverview(user.id);
  console.log("Current health pulse dimensions:", JSON.stringify(overview.healthPulse.current.dimensions, null, 2));
}

main().catch(console.error);
