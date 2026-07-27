import { PrismaClient, VerificationStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) return;
  const pulseDate = new Date("2026-07-28T00:00:00.000Z");
  
  const sleepHours = 7.5;
  const hydrationLiters = undefined; // undefined simulates missing field

  // Mocking the calculations
  const overallScore = 50;
  const nutritionScore = 50;
  const activityScore = 50;

  const pulse = await prisma.healthPulse.upsert({
    where: { userId_pulseDate: { userId: user.id, pulseDate } },
    create: {
      userId: user.id,
      pulseDate,
      overallScore,
      nutritionScore,
      activityScore,
      sleepHours,
      hydrationLiters,
    },
    update: { overallScore, nutritionScore, activityScore, sleepHours, hydrationLiters },
  });

  console.log("Upserted pulse:", pulse);
}

main().catch(console.error).finally(() => prisma.$disconnect());
