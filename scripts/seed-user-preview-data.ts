import "dotenv/config";
import {
  ActivityType,
  CompanionSender,
  EventRegistrationStatus,
  GuildRole,
  NotificationType,
  PrivacyLevel,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyStoredActivity } from "@/server/activity/activity-service";
import { evaluateAndAwardUserBadges } from "@/server/badges/badge-service";
import { applyVerifiedActivityToChallenges } from "@/server/challenges/challenge-service";
import { awardVerifiedActivity } from "@/server/economy/economy-service";
import {
  buildCommunityOverview,
  buildProgressOverview,
} from "@/server/progress/progress-service";

const DAY_MS = 86_400_000;
const userId = process.argv[2]?.trim();

function jakartaDayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function localTime(dayKey: string, hour: number, minute = 0) {
  return new Date(
    `${dayKey}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+07:00`,
  );
}

async function ensureVerifiedWalk(
  targetUserId: string,
  dayKey: string,
  dayIndex: number,
) {
  const clientSessionId = `database-preview-walk-${dayKey}`;
  const existing = await prisma.activitySession.findUnique({
    where: {
      userId_clientSessionId: {
        userId: targetUserId,
        clientSessionId,
      },
    },
    include: { verificationResult: true },
  });
  if (existing?.verificationStatus === "VERIFIED") {
    await awardVerifiedActivity(existing.id);
    await applyVerifiedActivityToChallenges(existing.id);
    return existing;
  }

  const startTime = localTime(dayKey, 6, 10 + dayIndex);
  const sampleCount = 41 + dayIndex;
  const intervalSeconds = 30;
  const endTime = new Date(
    startTime.getTime() + (sampleCount - 1) * intervalSeconds * 1_000,
  );
  const activity =
    existing ??
    (await prisma.activitySession.create({
      data: {
        userId: targetUserId,
        clientSessionId,
        activityType: ActivityType.WALK,
        startTime,
        endTime,
        telemetrySampleCount: sampleCount,
        deviceAttestationVerified: true,
        telemetrySamples: {
          create: Array.from({ length: sampleCount }, (_, index) => ({
            sequenceNumber: index,
            timestamp: new Date(
              startTime.getTime() + index * intervalSeconds * 1_000,
            ),
            latitude: -7.7595 + index * (0.00027 + dayIndex * 0.000004),
            longitude: 110.4087 + index * 0.000015,
            accuracy: 4.5 + (index % 3) * 0.4,
            speed: 1.05 + (index % 4) * 0.04,
          })),
        },
      },
    }));

  const verification = await verifyStoredActivity(activity.id);
  if (verification.verificationStatus !== "VERIFIED") {
    throw new Error(
      `Aktivitas ${dayKey} tidak lolos verifikasi: ${verification.reasonCodes.join(", ")}`,
    );
  }
  await awardVerifiedActivity(activity.id);
  await applyVerifiedActivityToChallenges(activity.id);
  return prisma.activitySession.findUniqueOrThrow({ where: { id: activity.id } });
}

async function main() {
  if (!userId) {
    throw new Error(
      "Gunakan: tsx scripts/seed-user-preview-data.ts <user-id>",
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { healthProfile: true },
  });
  if (!user) throw new Error(`User ${userId} tidak ditemukan.`);

  await prisma.$transaction([
    prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        profileVisibility: "CIRCLE",
        pulseVisibility: "CIRCLE",
        activityVisibility: "CIRCLE",
        leaderboardVisible: true,
        challengeProgressVisible: true,
        timezone: "Asia/Jakarta",
        leaderboardRegion: "YOGYAKARTA",
      },
      update: {
        timezone: "Asia/Jakarta",
        leaderboardRegion: "YOGYAKARTA",
      },
    }),
    prisma.companionPreference.upsert({
      where: { userId },
      create: { userId },
      update: {},
    }),
    prisma.healthProfile.upsert({
      where: { userId },
      create: {
        userId,
        weightKg: 72,
        targetWeightKg: 70,
        dailyStepTarget: 8_000,
        dailyCalorieTarget: 2_000,
        dailyProteinTargetGrams: 80,
        dailyCarbTargetGrams: 220,
        dailyFiberTargetGrams: 25,
        dailyWaterTargetMl: 2_000,
        dailySleepTargetHours: 8,
        dailyActiveTargetMinutes: 30,
      },
      update: {
        ...(user.healthProfile?.weightKg == null ? { weightKg: 72 } : {}),
        ...(user.healthProfile?.targetWeightKg == null
          ? { targetWeightKg: 70 }
          : {}),
      },
    }),
    prisma.userEconomy.upsert({
      where: { userId },
      create: { userId },
      update: {},
    }),
  ]);

  const activities = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(Date.now() - offset * DAY_MS);
    const dayKey = jakartaDayKey(day);
    const dayIndex = 6 - offset;
    const mealTime = localTime(dayKey, 12, 15);
    const breakfastTime = localTime(dayKey, 7, 20);
    const weight = 72.6 - dayIndex * 0.08;

    await prisma.$transaction([
      prisma.nutritionEntry.upsert({
        where: { id: `database-preview-lunch-${userId}-${dayKey}` },
        create: {
          id: `database-preview-lunch-${userId}-${dayKey}`,
          userId,
          foodName: dayIndex % 2 === 0
            ? "Nasi Ayam Panggang & Sayur"
            : "Nasi Tempe, Telur & Sayur",
          portionGrams: 420,
          calories: 610 + dayIndex * 8,
          protein: 42 + dayIndex,
          carbs: 72,
          fat: 16,
          fiber: 10,
          sugar: 7,
          sodiumMg: 620,
          mealType: "Makan Siang",
          source: "MANUAL",
          isUserConfirmed: true,
          confidenceScore: 1,
          loggedAt: mealTime,
        },
        update: {
          loggedAt: mealTime,
          calories: 610 + dayIndex * 8,
          protein: 42 + dayIndex,
        },
      }),
      prisma.nutritionEntry.upsert({
        where: { id: `database-preview-breakfast-${userId}-${dayKey}` },
        create: {
          id: `database-preview-breakfast-${userId}-${dayKey}`,
          userId,
          foodName: "Oatmeal Pisang & Telur",
          portionGrams: 310,
          calories: 430,
          protein: 24,
          carbs: 58,
          fat: 12,
          fiber: 8,
          sugar: 14,
          sodiumMg: 310,
          mealType: "Sarapan",
          source: "MANUAL",
          isUserConfirmed: true,
          confidenceScore: 1,
          loggedAt: breakfastTime,
        },
        update: { loggedAt: breakfastTime },
      }),
      ...[7, 10, 14, 18].map((hour, waterIndex) =>
        prisma.waterLog.upsert({
          where: {
            id: `database-preview-water-${userId}-${dayKey}-${waterIndex}`,
          },
          create: {
            id: `database-preview-water-${userId}-${dayKey}-${waterIndex}`,
            userId,
            volumeMl: waterIndex === 3 ? 400 : 500,
            loggedAt: localTime(dayKey, hour),
          },
          update: {
            volumeMl: waterIndex === 3 ? 400 : 500,
            loggedAt: localTime(dayKey, hour),
          },
        }),
      ),
      prisma.healthPulse.upsert({
        where: {
          userId_pulseDate: {
            userId,
            pulseDate: new Date(`${dayKey}T00:00:00.000Z`),
          },
        },
        create: {
          userId,
          pulseDate: new Date(`${dayKey}T00:00:00.000Z`),
          sleepHours: 7.1 + dayIndex * 0.1,
          hydrationLiters: 1.9,
        },
        update: {
          sleepHours: 7.1 + dayIndex * 0.1,
          hydrationLiters: 1.9,
        },
      }),
      prisma.healthMetric.upsert({
        where: { id: `database-preview-weight-${userId}-${dayKey}` },
        create: {
          id: `database-preview-weight-${userId}-${dayKey}`,
          userId,
          weightKg: weight,
          bmi: weight / 1.72 ** 2,
          recordedAt: localTime(dayKey, 6),
        },
        update: {
          weightKg: weight,
          bmi: weight / 1.72 ** 2,
          recordedAt: localTime(dayKey, 6),
        },
      }),
    ]);

    activities.push(await ensureVerifiedWalk(userId, dayKey, dayIndex));
  }

  await evaluateAndAwardUserBadges(userId);

  const [nextEvent, firstGuild] = await Promise.all([
    prisma.event.findFirst({
      where: { isActive: true, endDate: { gte: new Date() } },
      orderBy: { startDate: "asc" },
    }),
    prisma.guild.findFirst({ orderBy: { createdAt: "asc" } }),
  ]);
  if (nextEvent) {
    await prisma.eventRegistration.upsert({
      where: { eventId_userId: { eventId: nextEvent.id, userId } },
      create: {
        eventId: nextEvent.id,
        userId,
        status: EventRegistrationStatus.JOINED,
      },
      update: { status: EventRegistrationStatus.JOINED },
    });
  }
  if (firstGuild) {
    await prisma.guildMember.upsert({
      where: { guildId_userId: { guildId: firstGuild.id, userId } },
      create: { guildId: firstGuild.id, userId, role: GuildRole.MEMBER },
      update: {},
    });
  }

  const todayKey = jakartaDayKey(new Date());
  await prisma.$transaction([
    prisma.userNotification.upsert({
      where: { id: `database-preview-notification-goals-${userId}` },
      create: {
        id: `database-preview-notification-goals-${userId}`,
        userId,
        type: NotificationType.REMINDER,
        title: "Target harian siap dilanjutkan",
        message: "Progres hari ini telah dihitung ulang dari catatan database.",
      },
      update: {
        title: "Target harian siap dilanjutkan",
        message: "Progres hari ini telah dihitung ulang dari catatan database.",
        isRead: false,
      },
    }),
    prisma.userNotification.upsert({
      where: { id: `database-preview-notification-streak-${userId}` },
      create: {
        id: `database-preview-notification-streak-${userId}`,
        userId,
        type: NotificationType.ACTIVITY,
        title: "Streak aktivitas terverifikasi",
        message: "Aktivitas GPS terverifikasi terbaru sudah masuk ke progres akun.",
      },
      update: {
        title: "Streak aktivitas terverifikasi",
        message: "Aktivitas GPS terverifikasi terbaru sudah masuk ke progres akun.",
      },
    }),
    prisma.userNotification.upsert({
      where: { id: `database-preview-notification-reward-${userId}` },
      create: {
        id: `database-preview-notification-reward-${userId}`,
        userId,
        type: NotificationType.REWARD,
        title: "Saldo reward diperbarui",
        message: "XP dan HP hasil aktivitas sudah disinkronkan dengan ledger.",
      },
      update: {
        title: "Saldo reward diperbarui",
        message: "XP dan HP hasil aktivitas sudah disinkronkan dengan ledger.",
      },
    }),
    prisma.journalEntry.upsert({
      where: { id: `database-preview-journal-${userId}` },
      create: {
        id: `database-preview-journal-${userId}`,
        userId,
        title: "Energi setelah jalan pagi",
        content:
          "Tubuh terasa lebih ringan setelah berjalan santai. Besok ingin menjaga ritme yang sama tanpa memaksa.",
        mood: "Berenergi",
        allowCompanion: true,
      },
      update: {
        title: "Energi setelah jalan pagi",
        allowCompanion: true,
      },
    }),
    prisma.companionConversation.upsert({
      where: { id: `database-preview-companion-user-${userId}` },
      create: {
        id: `database-preview-companion-user-${userId}`,
        userId,
        sender: CompanionSender.USER,
        content: "Bagaimana progresku hari ini?",
      },
      update: {},
    }),
    prisma.companionConversation.upsert({
      where: { id: `database-preview-companion-assistant-${userId}` },
      create: {
        id: `database-preview-companion-assistant-${userId}`,
        userId,
        sender: CompanionSender.ASSISTANT,
        content:
          "Progresmu dibaca langsung dari catatan aktivitas, nutrisi, hidrasi, tidur, dan berat yang tersimpan.",
        emotionContext: "DATABASE_PROGRESS",
      },
      update: {},
    }),
    prisma.moment.upsert({
      where: { id: `database-preview-moment-${userId}` },
      create: {
        id: `database-preview-moment-${userId}`,
        userId,
        imageUrl: "/images/dashboard-hero.png",
        caption: "Jalan pagi selesai dan tersimpan sebagai momen sehat.",
        privacyLevel: PrivacyLevel.CIRCLE,
        duringActivity: true,
      },
      update: {
        caption: "Jalan pagi selesai dan tersimpan sebagai momen sehat.",
        privacyLevel: PrivacyLevel.CIRCLE,
        duringActivity: true,
      },
    }),
    prisma.weeklyLetterArchive.upsert({
      where: { id: `database-preview-weekly-letter-${userId}-${todayKey}` },
      create: {
        id: `database-preview-weekly-letter-${userId}-${todayKey}`,
        userId,
        weekStart: new Date(Date.now() - 6 * DAY_MS),
        weekEnd: new Date(),
        letterTitle: "Konsistensi kecilmu mulai terlihat",
        letterContent:
          "Aktivitas, pola makan, dan hidrasi minggu ini membentuk progres yang stabil. Pertahankan satu langkah realistis setiap hari.",
        summaryJson: { source: "database-preview" },
      },
      update: {
        weekEnd: new Date(),
        letterTitle: "Konsistensi kecilmu mulai terlihat",
      },
    }),
    prisma.systemSetting.upsert({
      where: { key: "dailyXpCapEnabled" },
      create: {
        key: "dailyXpCapEnabled",
        value: true,
        updatedByUserId: userId,
      },
      update: {},
    }),
    prisma.systemSetting.upsert({
      where: { key: "gpsIntegrityEnabled" },
      create: {
        key: "gpsIntegrityEnabled",
        value: true,
        updatedByUserId: userId,
      },
      update: {},
    }),
    prisma.systemSetting.upsert({
      where: { key: "automaticMomentReviewEnabled" },
      create: {
        key: "automaticMomentReviewEnabled",
        value: true,
        updatedByUserId: userId,
      },
      update: {},
    }),
  ]);

  const [
    economy,
    nutritionCount,
    waterCount,
    metricCount,
    notificationCount,
    journalCount,
    conversationCount,
    momentCount,
    progressOverview,
    communityOverview,
  ] = await Promise.all([
    prisma.userEconomy.findUniqueOrThrow({ where: { userId } }),
    prisma.nutritionEntry.count({
      where: { userId, id: { startsWith: "database-preview-" } },
    }),
    prisma.waterLog.count({
      where: { userId, id: { startsWith: "database-preview-" } },
    }),
    prisma.healthMetric.count({
      where: { userId, id: { startsWith: "database-preview-" } },
    }),
    prisma.userNotification.count({ where: { userId } }),
    prisma.journalEntry.count({ where: { userId } }),
    prisma.companionConversation.count({ where: { userId } }),
    prisma.moment.count({ where: { userId } }),
    buildProgressOverview(userId),
    buildCommunityOverview(userId),
  ]);

  console.log({
    success: true,
    user: { id: user.id, email: user.email, name: user.name },
    inserted: {
      verifiedActivities: activities.length,
      nutritionEntries: nutritionCount,
      waterLogs: waterCount,
      weightMetrics: metricCount,
      notifications: notificationCount,
      journalEntries: journalCount,
      companionMessages: conversationCount,
      moments: momentCount,
      registeredEvent: nextEvent?.title ?? null,
      joinedGuild: firstGuild?.name ?? null,
    },
    economy: {
      totalXp: economy.totalXp,
      currentHp: economy.currentHp,
      streakDays: economy.streakDays,
      currentTier: economy.currentTier,
    },
    dynamicOverview: {
      journeyProgress: progressOverview.todayJourney.progressPercent,
      pulseScore: progressOverview.healthPulse.current.score,
      pulseCompleteness:
        progressOverview.healthPulse.current.dataCompleteness,
      todayCalories: progressOverview.daily.calories.value,
      todayProtein: progressOverview.daily.protein.value,
      todayWaterMl: progressOverview.daily.water.value,
      activeEvents: communityOverview.statistics.activeEvents,
      communityMembers: communityOverview.statistics.activeMembers,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
