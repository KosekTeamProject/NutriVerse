import { CompanionSender } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildProgressOverview } from "@/server/progress/progress-service";

function limitedText(value: string, maximum: number) {
  return value.trim().slice(0, maximum);
}

export type CompanionVerifiedContext = Awaited<
  ReturnType<typeof buildCompanionVerifiedContext>
>;

/**
 * Builds a privacy-minimized context from the authenticated user's own rows.
 * It intentionally excludes email, auth identifiers, raw GPS coordinates,
 * storage URLs, and journals that were not explicitly shared with Nora.
 */
export async function buildCompanionVerifiedContext(userId: string) {
  const [overview, user, recentRows, memories, sharedJournals] =
    await Promise.all([
      buildProgressOverview(userId),
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          name: true,
          healthProfile: {
            select: {
              activityLevel: true,
              healthGoals: true,
              preferredActivities: true,
              dietaryPreferences: true,
              allergies: true,
              dailyStepTarget: true,
              dailyCalorieTarget: true,
              dailyProteinTargetGrams: true,
              dailyFiberTargetGrams: true,
              dailyWaterTargetMl: true,
              dailySleepTargetHours: true,
              dailyActiveTargetMinutes: true,
            },
          },
          companionPreference: {
            select: { companionName: true },
          },
        },
      }),
      prisma.companionConversation.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { sender: true, content: true },
      }),
      prisma.companionMemory.findMany({
        where: { userId },
        orderBy: [{ importance: "desc" }, { updatedAt: "desc" }],
        take: 12,
        select: {
          memoryKey: true,
          memoryValue: true,
          category: true,
          importance: true,
        },
      }),
      prisma.journalEntry.findMany({
        where: { userId, allowCompanion: true },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { title: true, content: true, mood: true, createdAt: true },
      }),
    ]);

  const pulse = overview.healthPulse.current;
  const profile = user.healthProfile;
  return {
    companionName: user.companionPreference?.companionName ?? "Nora",
    profile: {
      displayName: limitedText(user.name, 80),
      healthGoal: profile?.healthGoals
        ? limitedText(profile.healthGoals, 300)
        : null,
      activityLevel: profile?.activityLevel
        ? limitedText(profile.activityLevel, 80)
        : null,
      preferredActivities: profile?.preferredActivities.slice(0, 10) ?? [],
      dietaryPreferences: profile?.dietaryPreferences.slice(0, 10) ?? [],
      allergies: profile?.allergies.slice(0, 10) ?? [],
    },
    targets: {
      steps: profile?.dailyStepTarget ?? 8_000,
      caloriesKcal: profile?.dailyCalorieTarget ?? 2_000,
      proteinGrams: profile?.dailyProteinTargetGrams ?? 80,
      fiberGrams: profile?.dailyFiberTargetGrams ?? 25,
      waterMl: profile?.dailyWaterTargetMl ?? 2_000,
      sleepHours: profile?.dailySleepTargetHours ?? 8,
      activeMinutes: profile?.dailyActiveTargetMinutes ?? 30,
    },
    progress: {
      date: overview.date,
      timezone: overview.timezone,
      healthPulse: {
        score: pulse.score,
        completeness: pulse.dataCompleteness,
        status: pulse.status,
        dimensions: pulse.dimensions.map((dimension) => ({
          name: dimension.dimension,
          score: dimension.score,
          trust: dimension.trust,
        })),
      },
      today: overview.daily,
      economy: {
        tier: overview.economy.currentTier,
        streakDays: overview.economy.streakDays,
        xpToday: overview.economy.xpToday,
        hpToday: overview.economy.hpToday,
      },
      journey: {
        progressPercent: overview.todayJourney.progressPercent,
        status: overview.todayJourney.status,
        nextAction: overview.todayJourney.nextAction,
      },
      challenges: overview.challenges.slice(0, 3).map((challenge) => ({
        title: challenge.title,
        progressPercent: challenge.progressPercent,
        currentValue: challenge.currentValue,
        targetValue: challenge.targetValue,
        unit: challenge.unit,
        verified: challenge.trustLevel === "GPS_VERIFIED_ONLY",
      })),
    },
    memories: memories.map((memory) => ({
      key: limitedText(memory.memoryKey, 80),
      value: limitedText(memory.memoryValue, 300),
      category: limitedText(memory.category, 40),
      importance: memory.importance,
    })),
    sharedJournalSummaries: sharedJournals.map((journal) => ({
      title: limitedText(journal.title, 120),
      excerpt: limitedText(journal.content, 500),
      mood: journal.mood ? limitedText(journal.mood, 40) : null,
      createdAt: journal.createdAt.toISOString(),
    })),
    recentMessages: recentRows.reverse().map((row) => ({
      role:
        row.sender === CompanionSender.USER
          ? ("user" as const)
          : ("assistant" as const),
      content: limitedText(row.content, 1_500),
    })),
  };
}
