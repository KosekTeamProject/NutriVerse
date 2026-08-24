import { VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  calendarDayKey,
  utcDayBoundsForKey,
} from "@/server/economy/economy-policy";
import {
  calculateHealthPulseScore,
  nutritionAttainmentScore,
  sleepDurationScore,
  targetAttainmentScore,
  weightGoalScore,
  type PulseDimensionScores,
} from "@/server/health/health-pulse-policy";

const WEIGHT_FRESHNESS_MS = 30 * 86_400_000;

export async function refreshDailyHealthPulse(input: {
  userId: string;
  occurredAt?: Date;
  dayKey?: string;
  sleepHours?: number;
}) {
  const occurredAt = input.occurredAt ?? new Date();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: input.userId },
    include: { healthProfile: true, settings: true },
  });
  const timezone = user.settings?.timezone ?? "Asia/Jakarta";
  const dayKey = input.dayKey ?? calendarDayKey(occurredAt, timezone);
  const bounds = utcDayBoundsForKey(dayKey, timezone);
  const pulseDate = new Date(`${dayKey}T00:00:00.000Z`);

  const [existing, previous, nutrition, activity, water, latestWeight] =
    await Promise.all([
      prisma.healthPulse.findUnique({
        where: { userId_pulseDate: { userId: input.userId, pulseDate } },
      }),
      prisma.healthPulse.findFirst({
        where: { userId: input.userId, pulseDate: { lt: pulseDate } },
        orderBy: { pulseDate: "desc" },
      }),
      prisma.nutritionEntry.aggregate({
        where: {
          userId: input.userId,
          loggedAt: { gte: bounds.start, lt: bounds.end },
        },
        _count: { _all: true },
        _sum: { calories: true, protein: true, fiber: true },
      }),
      prisma.activitySession.aggregate({
        where: {
          userId: input.userId,
          verificationStatus: VerificationStatus.VERIFIED,
          endTime: { gte: bounds.start, lt: bounds.end },
        },
        _count: { _all: true },
        _sum: { activeDurationSeconds: true },
      }),
      prisma.waterLog.aggregate({
        where: {
          userId: input.userId,
          loggedAt: { gte: bounds.start, lt: bounds.end },
        },
        _sum: { volumeMl: true },
      }),
      prisma.healthMetric.findFirst({
        where: { userId: input.userId, weightKg: { not: null }, recordedAt: { lt: bounds.end } },
        select: { weightKg: true, recordedAt: true },
        orderBy: { recordedAt: "desc" },
      }),
    ]);

  const profile = user.healthProfile;
  const sleepHours = input.sleepHours ?? existing?.sleepHours ?? undefined;
  const loggedHydrationLiters = (water._sum.volumeMl ?? 0) / 1_000;
  const hydrationLiters =
    loggedHydrationLiters > 0
      ? loggedHydrationLiters
      : (existing?.hydrationLiters ?? 0);
  const weightIsFresh =
    latestWeight?.weightKg !== null &&
    latestWeight?.weightKg !== undefined &&
    bounds.end.getTime() - latestWeight.recordedAt.getTime() <=
      WEIGHT_FRESHNESS_MS;
  const targetWeight = profile?.targetWeightKg ?? profile?.weightKg;

  const scores: PulseDimensionScores = {
    ...(nutrition._count._all > 0
      ? {
          nutrition: nutritionAttainmentScore({
            calories: nutrition._sum.calories ?? 0,
            protein: nutrition._sum.protein ?? 0,
            fiber: nutrition._sum.fiber ?? 0,
            calorieTarget: profile?.dailyCalorieTarget ?? 2_000,
            proteinTarget: profile?.dailyProteinTargetGrams ?? 80,
            fiberTarget: profile?.dailyFiberTargetGrams ?? 25,
          }),
        }
      : {}),
    ...(activity._count._all > 0
      ? {
          activity: targetAttainmentScore(
            (activity._sum.activeDurationSeconds ?? 0) / 60,
            profile?.dailyActiveTargetMinutes ?? 30,
          ),
        }
      : {}),
    ...(sleepHours !== undefined
      ? {
          sleep: sleepDurationScore(
            sleepHours,
            profile?.dailySleepTargetHours ?? 8,
          ),
        }
      : {}),
    ...(hydrationLiters > 0
      ? {
          hydration: targetAttainmentScore(
            hydrationLiters * 1_000,
            profile?.dailyWaterTargetMl ?? 2_000,
          ),
        }
      : {}),
    ...(weightIsFresh && latestWeight?.weightKg && targetWeight
      ? { weight: weightGoalScore(latestWeight.weightKg, targetWeight) }
      : {}),
  };
  const calculated = calculateHealthPulseScore({
    scores,
    previousScore: previous?.overallScore,
    previousCompleteness:
      previous && previous.overallScore > 0 ? 100 : 0,
  });

  const pulse = await prisma.healthPulse.upsert({
    where: { userId_pulseDate: { userId: input.userId, pulseDate } },
    create: {
      userId: input.userId,
      pulseDate,
      overallScore: calculated.overallScore,
      nutritionScore: scores.nutrition ?? 0,
      activityScore: scores.activity ?? 0,
      sleepHours,
      hydrationLiters: hydrationLiters > 0 ? hydrationLiters : null,
    },
    update: {
      overallScore: calculated.overallScore,
      nutritionScore: scores.nutrition ?? 0,
      activityScore: scores.activity ?? 0,
      ...(input.sleepHours !== undefined ? { sleepHours } : {}),
      hydrationLiters: hydrationLiters > 0 ? hydrationLiters : null,
    },
  });

  return { pulse, timezone, dayKey, scores, ...calculated };
}
