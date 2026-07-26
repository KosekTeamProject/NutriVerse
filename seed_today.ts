import { prisma } from "./src/lib/prisma";
import { VerificationStatus, ActivityType } from "@prisma/client";

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found");
    return;
  }
  
  const now = new Date();
  
  // 1. Add Activity
  await prisma.activitySession.create({
    data: {
      userId: user.id,
      activityType: ActivityType.WALK,
      startTime: new Date(now.getTime() - 3600000), // 1 hour ago
      endTime: now,
      durationSeconds: 3600,
      activeDurationSeconds: 3000,
      distanceMeters: 5000,
      verificationStatus: VerificationStatus.VERIFIED,
    }
  });

  // 2. Add Nutrition
  const foodItem = await prisma.foodItem.findFirst();
  await prisma.nutritionEntry.create({
    data: {
      userId: user.id,
      foodItemId: foodItem?.id,
      foodName: foodItem?.name ?? "Salad Ayam Sehat",
      portionGrams: 200,
      calories: 450,
      protein: 40,
      carbs: 20,
      fat: 15,
      fiber: 8,
      sugar: 5,
      sodiumMg: 300,
      mealType: "LUNCH",
      source: "MANUAL",
      loggedAt: now,
    }
  });

  // 3. Add Sleep & Hydration
  const dayKey = now.toISOString().slice(0, 10);
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

  // 4. Add WaterLog just in case
  await prisma.waterLog.create({
    data: {
      userId: user.id,
      volumeMl: 2500,
      loggedAt: now,
    }
  });

  console.log("Successfully seeded today's data for Health Pulse!");
}

main().catch(console.error);
