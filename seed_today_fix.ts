import { prisma } from "./src/lib/prisma";
import { VerificationStatus, ActivityType } from "@prisma/client";
import { calendarDayKey } from "./src/server/economy/economy-policy";

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found");
    return;
  }
  
  const now = new Date();
  const timezone = "Asia/Jakarta";
  
  // Create Health Pulse for TODAY in user's timezone!
  const dayKey = calendarDayKey(now, timezone);
  const pulseDate = new Date(`${dayKey}T00:00:00.000Z`);
  
  await prisma.healthPulse.upsert({
    where: { userId_pulseDate: { userId: user.id, pulseDate } },
    create: {
      userId: user.id,
      pulseDate,
      sleepHours: 8.5,
      hydrationLiters: 2.5,
      overallScore: 85,
      nutritionScore: 90,
      activityScore: 100,
    },
    update: {
      sleepHours: 8.5,
      hydrationLiters: 2.5,
      nutritionScore: 90,
      activityScore: 100,
    }
  });

  console.log("Successfully seeded TODAY's Health Pulse for", dayKey);
}

main().catch(console.error);
