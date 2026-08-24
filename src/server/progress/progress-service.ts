import {
  ActivityType,
  ChallengeMetric,
  LedgerType,
  VerificationStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { COMMUNITY_APPROVAL, COMMUNITY_MEMBER } from "@/server/community/community-constants";
import type {
  BehaviorGoal,
  HealthyDayHistoryPoint,
  TodayJourney,
} from "@/features/behavior/types";
import type {
  HealthDataTrustLevel,
  HealthDimension,
  HealthDimensionScore,
  HealthPulseSnapshot,
  HealthPulseStatus,
  HealthPulseTrend,
} from "@/features/health-pulse/types";
import type {
  CommunityOverview,
  ProgressChallenge,
  ProgressMetric,
  ProgressOverview,
} from "@/features/progress/types";
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

const DAY_MS = 86_400_000;

type DayAggregate = {
  distanceMeters: number;
  walkingDistanceMeters: number;
  activeSeconds: number;
  steps: number;
  calories: number;
  protein: number;
  carbs: number;
  fiber: number;
  waterMl: number;
  nutritionEntries: number;
  verifiedActivities: number;
  sleepHours?: number;
  pulseHydrationLiters?: number;
  weightKg?: number;
};

function rounded(value: number, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, value));
}

function progressPercent(value: number, target: number) {
  return target > 0 ? Math.round(clamp((value / target) * 100)) : 0;
}

function metric(
  value: number,
  target: number,
  unit: string,
  digits = 0,
): ProgressMetric {
  return {
    value: rounded(value, digits),
    target: rounded(target, digits),
    percent: progressPercent(value, target),
    unit,
  };
}

function dateKeysEndingAt(dayKey: string, count: number) {
  const [year, month, day] = dayKey.split("-").map(Number);
  const end = Date.UTC(year, month - 1, day);
  return Array.from({ length: count }, (_, index) =>
    new Date(end - (count - index - 1) * DAY_MS).toISOString().slice(0, 10),
  );
}

function dayAggregate(): DayAggregate {
  return {
    distanceMeters: 0,
    walkingDistanceMeters: 0,
    activeSeconds: 0,
    steps: 0,
    calories: 0,
    protein: 0,
    carbs: 0,
    fiber: 0,
    waterMl: 0,
    nutritionEntries: 0,
    verifiedActivities: 0,
  } satisfies DayAggregate;
}

function statusForScore(score: number): HealthPulseStatus {
  if (score >= 80) return "thrive";
  if (score >= 70) return "flourishing";
  if (score >= 55) return "balanced";
  if (score >= 35) return "growing";
  return "seed";
}

function trendForChange(change: number): HealthPulseTrend {
  if (change >= 1) return "improving";
  if (change <= -5) return "needs-attention";
  if (change < -1) return "recovering";
  return "stable";
}

function dimensionSummary(
  dimension: HealthDimension,
  score: number,
  hasData: boolean,
) {
  if (!hasData) return "Belum ada data untuk dimensi ini pada hari tersebut.";
  const labels: Record<HealthDimension, string> = {
    nutrition: "Asupan protein dari catatan makanan membentuk skor nutrisi.",
    activity: "Aktivitas GPS terverifikasi membentuk skor aktivitas.",
    sleep: "Durasi tidur yang dicatat pengguna membentuk skor tidur.",
    hydration: "Catatan air minum membentuk skor hidrasi.",
    weight: "Catatan berat terbaru dibandingkan dengan target pengguna.",
    consistency: "Konsistensi dihitung dari tindakan sehat beberapa hari terakhir.",
  };
  return score >= 100 ? `${labels[dimension]} Target hari ini tercapai.` : labels[dimension];
}

function estimateSteps(distanceMeters: number, type: ActivityType) {
  if (type === ActivityType.WALK) return distanceMeters / 0.75;
  if (type === ActivityType.RUN) return distanceMeters / 0.95;
  return 0;
}

function challengeValues(input: {
  metric: ChallengeMetric;
  currentValue: number;
  targetValue: number;
  targetUnit: string;
}) {
  if (input.metric === ChallengeMetric.DISTANCE_METERS) {
    return {
      currentValue: rounded(input.currentValue / 1_000, 2),
      targetValue: rounded(input.targetValue / 1_000, 2),
      unit: "km",
    };
  }
  if (input.metric === ChallengeMetric.DURATION_SECONDS) {
    return {
      currentValue: rounded(input.currentValue / 60, 1),
      targetValue: rounded(input.targetValue / 60, 1),
      unit: "mnt",
    };
  }
  return {
    currentValue: rounded(input.currentValue),
    targetValue: rounded(input.targetValue),
    unit: input.targetUnit.toLowerCase(),
  };
}

export async function buildProgressOverview(
  userId: string,
  now = new Date(),
): Promise<ProgressOverview> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      healthProfile: true,
      settings: true,
      economy: true,
    },
  });
  const timezone = user.settings?.timezone ?? "Asia/Jakarta";
  const todayKey = calendarDayKey(now, timezone);
  const dayKeys = dateKeysEndingAt(todayKey, 30);
  const firstBounds = utcDayBoundsForKey(dayKeys[0], timezone);
  const todayBounds = utcDayBoundsForKey(todayKey, timezone);
  const profile = user.healthProfile;
  const targets = {
    steps: profile?.dailyStepTarget ?? 8_000,
    calories: profile?.dailyCalorieTarget ?? 2_000,
    protein: profile?.dailyProteinTargetGrams ?? 80,
    carbs: profile?.dailyCarbTargetGrams ?? 220,
    fiber: profile?.dailyFiberTargetGrams ?? 25,
    water: profile?.dailyWaterTargetMl ?? 2_000,
    sleep: profile?.dailySleepTargetHours ?? 8,
    activeMinutes: profile?.dailyActiveTargetMinutes ?? 30,
    walkingDistanceKm: 2,
  };

  const [
    activities,
    nutritionEntries,
    waterLogs,
    pulseInputs,
    healthMetrics,
    challengeRows,
    xpToday,
    hpToday,
    verifiedActivityCount,
    totalDistance,
  ] = await Promise.all([
    prisma.activitySession.findMany({
      where: {
        userId,
        verificationStatus: VerificationStatus.VERIFIED,
        endTime: { gte: firstBounds.start, lt: todayBounds.end },
      },
      select: {
        activityType: true,
        endTime: true,
        startTime: true,
        distanceMeters: true,
        activeDurationSeconds: true,
        durationSeconds: true,
      },
    }),
    prisma.nutritionEntry.findMany({
      where: {
        userId,
        loggedAt: { gte: firstBounds.start, lt: todayBounds.end },
      },
      select: {
        loggedAt: true,
        calories: true,
        protein: true,
        carbs: true,
        fiber: true,
      },
    }),
    prisma.waterLog.findMany({
      where: {
        userId,
        loggedAt: { gte: firstBounds.start, lt: todayBounds.end },
      },
      select: { loggedAt: true, volumeMl: true },
    }),
    prisma.healthPulse.findMany({
      where: {
        userId,
        pulseDate: { 
          gte: new Date(`${dayKeys[0]}T00:00:00.000Z`), 
          lte: new Date(`${todayKey}T00:00:00.000Z`) 
        },
      },
      orderBy: { pulseDate: "asc" },
    }),
    prisma.healthMetric.findMany({
      where: {
        userId,
        recordedAt: { lt: todayBounds.end },
      },
      select: { recordedAt: true, weightKg: true },
      orderBy: { recordedAt: "desc" },
      take: 365,
    }),
    prisma.challenge.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        progresses: {
          where: { userId },
          take: 1,
        },
      },
      orderBy: { endDate: "asc" },
      take: 20,
    }),
    prisma.xPGrant.aggregate({
      where: {
        userId,
        effectiveAt: { gte: todayBounds.start, lt: todayBounds.end },
        type: { in: [LedgerType.XP_GRANT, LedgerType.XP_REVERSAL] },
      },
      _sum: { amount: true },
    }),
    prisma.hPLedgerEntry.aggregate({
      where: {
        userId,
        effectiveAt: { gte: todayBounds.start, lt: todayBounds.end },
        type: { in: [LedgerType.HP_GRANT, LedgerType.HP_REVERSAL] },
      },
      _sum: { amount: true },
    }),
    prisma.activitySession.count({
      where: { userId, verificationStatus: VerificationStatus.VERIFIED },
    }),
    prisma.activitySession.aggregate({
      where: { userId, verificationStatus: VerificationStatus.VERIFIED },
      _sum: { distanceMeters: true },
    }),
  ]);

  const aggregates = new Map(dayKeys.map((key) => [key, dayAggregate()]));
  for (const activity of activities) {
    const effectiveAt = activity.endTime ?? activity.startTime;
    const key = calendarDayKey(effectiveAt, timezone);
    const aggregate = aggregates.get(key);
    if (!aggregate) continue;
    aggregate.distanceMeters += activity.distanceMeters;
    aggregate.activeSeconds +=
      activity.activeDurationSeconds || activity.durationSeconds;
    aggregate.verifiedActivities += 1;
    if (
      activity.activityType === ActivityType.WALK ||
      activity.activityType === ActivityType.RUN
    ) {
      aggregate.walkingDistanceMeters += activity.distanceMeters;
      aggregate.steps += estimateSteps(activity.distanceMeters, activity.activityType);
    }
  }
  for (const entry of nutritionEntries) {
    const aggregate = aggregates.get(calendarDayKey(entry.loggedAt, timezone));
    if (!aggregate) continue;
    aggregate.calories += entry.calories;
    aggregate.protein += entry.protein;
    aggregate.carbs += entry.carbs;
    aggregate.fiber += entry.fiber;
    aggregate.nutritionEntries += 1;
  }
  for (const log of waterLogs) {
    const aggregate = aggregates.get(calendarDayKey(log.loggedAt, timezone));
    if (aggregate) aggregate.waterMl += log.volumeMl;
  }
  for (const pulse of pulseInputs) {
    const aggregate = aggregates.get(pulse.pulseDate.toISOString().slice(0, 10));
    if (!aggregate) continue;
    if (pulse.sleepHours !== null) aggregate.sleepHours = pulse.sleepHours;
    if (pulse.hydrationLiters !== null) {
      aggregate.pulseHydrationLiters = pulse.hydrationLiters;
    }
  }
  for (const entry of healthMetrics) {
    if (entry.weightKg === null) continue;
    const key = calendarDayKey(entry.recordedAt, timezone);
    const aggregate = aggregates.get(key);
    if (aggregate) aggregate.weightKg = entry.weightKg;
  }

  const dimensionHistory = new Map<
    string,
    {
      dimensions: HealthDimensionScore[];
      completeness: number;
      score: number;
    }
  >();
  const snapshotRows: HealthPulseSnapshot[] = [];

  for (const [index, key] of dayKeys.entries()) {
    const aggregate = aggregates.get(key) ?? dayAggregate();
    const previousKey = dayKeys[index - 1];
    const previousDimensions = previousKey
      ? dimensionHistory.get(previousKey)?.dimensions
      : undefined;
    const hydrationMl =
      aggregate.waterMl ||
      (aggregate.pulseHydrationLiters ?? 0) * 1_000;
    const latestWeightEntry =
      aggregate.weightKg !== undefined
        ? {
            weightKg: aggregate.weightKg,
            recordedAt: utcDayBoundsForKey(key, timezone).start,
          }
        : healthMetrics.find(
            (entry) => calendarDayKey(entry.recordedAt, timezone) <= key,
          );
    const latestWeight = latestWeightEntry?.weightKg ?? undefined;
    const weightIsFresh =
      latestWeightEntry !== undefined &&
      utcDayBoundsForKey(key, timezone).end.getTime() -
        latestWeightEntry.recordedAt.getTime() <=
        30 * DAY_MS;
    const hasData = {
      nutrition: aggregate.nutritionEntries > 0,
      activity: aggregate.verifiedActivities > 0,
      sleep: aggregate.sleepHours !== undefined,
      hydration: hydrationMl > 0,
      weight:
        weightIsFresh && latestWeight !== undefined && latestWeight !== null,
    };
    const targetWeight = profile?.targetWeightKg ?? profile?.weightKg;
    const scores: Record<Exclude<HealthDimension, "consistency">, number> = {
      nutrition: nutritionAttainmentScore({
        calories: aggregate.calories,
        protein: aggregate.protein,
        fiber: aggregate.fiber,
        calorieTarget: targets.calories,
        proteinTarget: targets.protein,
        fiberTarget: targets.fiber,
      }),
      activity: targetAttainmentScore(
        aggregate.activeSeconds / 60,
        targets.activeMinutes,
      ),
      sleep: sleepDurationScore(aggregate.sleepHours ?? 0, targets.sleep),
      hydration: targetAttainmentScore(hydrationMl, targets.water),
      weight:
        latestWeight && targetWeight
          ? weightGoalScore(latestWeight, targetWeight)
          : hasData.weight
            ? 100
            : 0,
    };
    const dimensions = (
      ["nutrition", "activity", "sleep", "hydration", "weight"] as const
    ).map((dimension) => {
      const previous =
        previousDimensions?.find((entry) => entry.dimension === dimension)?.score ??
        scores[dimension];
      const score = scores[dimension];
      const change = rounded(score - previous, 1);
      const trust: Record<
        Exclude<HealthDimension, "consistency">,
        HealthDataTrustLevel
      > = {
        nutrition: hasData.nutrition ? "partially-verified" : "missing",
        activity: hasData.activity ? "trusted" : "missing",
        sleep: hasData.sleep ? "self-reported" : "missing",
        hydration: hasData.hydration ? "self-reported" : "missing",
        weight: hasData.weight ? "self-reported" : "missing",
      };
      return {
        dimension,
        score,
        previousScore: previous,
        change,
        trend: trendForChange(change),
        trust: trust[dimension],
        completeness: hasData[dimension] ? 100 : 0,
        summary: dimensionSummary(dimension, score, hasData[dimension]),
      } satisfies HealthDimensionScore;
    });
    const availableDimensions = dimensions.filter(
      (dimension) => dimension.trust !== "missing",
    );
    const previousSnapshot = snapshotRows.at(-1);
    const pulseScores: PulseDimensionScores = Object.fromEntries(
      availableDimensions.map((dimension) => [dimension.dimension, dimension.score]),
    );
    const calculatedPulse = calculateHealthPulseScore({
      scores: pulseScores,
      previousScore: previousSnapshot?.score,
      previousCompleteness: previousSnapshot?.dataCompleteness,
    });
    const completeness = calculatedPulse.completeness;
    const score = calculatedPulse.overallScore;
    const previousScore = snapshotRows.at(-1)?.score ?? score;
    const change = rounded(score - previousScore, 1);
    const strongest =
      [...availableDimensions].sort((left, right) => right.score - left.score)[0]
        ?.dimension ?? "activity";
    const focus =
      dimensions
        .filter((dimension) => dimension.trust !== "missing")
        .sort((left, right) => left.score - right.score)[0]?.dimension ??
      "hydration";
    const reasons = [
      aggregate.verifiedActivities > 0
        ? `${aggregate.verifiedActivities} aktivitas GPS terverifikasi tercatat.`
        : "Belum ada aktivitas GPS terverifikasi pada hari ini.",
      aggregate.nutritionEntries > 0
        ? `${aggregate.nutritionEntries} catatan makanan membentuk skor nutrisi.`
        : "Belum ada catatan makanan pada hari ini.",
      hydrationMl > 0
        ? `${rounded(hydrationMl / 1_000, 1)} liter hidrasi telah dicatat.`
        : "Data hidrasi belum dicatat.",
    ];
    const snapshot: HealthPulseSnapshot = {
      id: `health-pulse-${key}`,
      travelerId: user.id,
      score,
      previousScore,
      change,
      status: statusForScore(score),
      trend: trendForChange(change),
      strongestDimension: strongest,
      focusDimension: focus,
      dataCompleteness: completeness,
      generatedAt: utcDayBoundsForKey(key, timezone).end.toISOString(),
      dimensions,
      reasons,
      recommendedNextAction:
        focus === "activity"
          ? "Tambahkan aktivitas ringan yang dapat diverifikasi."
          : focus === "nutrition"
            ? "Catat makanan berikutnya untuk melengkapi asupan hari ini."
            : focus === "sleep"
              ? "Catat durasi tidur untuk melengkapi pola pemulihan."
              : focus === "hydration"
                ? "Tambahkan catatan air minum berikutnya."
                : "Perbarui catatan berat saat pengukuran berikutnya tersedia.",
    };
    snapshotRows.push(snapshot);
    dimensionHistory.set(key, { dimensions, completeness, score });
  }

  const currentSnapshot = snapshotRows.at(-1)!;
  const previousSnapshot = snapshotRows.at(-2) ?? currentSnapshot;
  const healthyHistory: HealthyDayHistoryPoint[] = dayKeys.slice(-28).map((key) => {
    const aggregate = aggregates.get(key) ?? dayAggregate();
    const snapshot = snapshotRows.find((row) => row.id === `health-pulse-${key}`)!;
    const hydrationMl =
      aggregate.waterMl ||
      (aggregate.pulseHydrationLiters ?? 0) * 1_000;
    const goalHits = [
      progressPercent(aggregate.activeSeconds / 60, targets.activeMinutes),
      progressPercent(aggregate.protein, targets.protein),
      progressPercent(hydrationMl, targets.water),
      sleepDurationScore(aggregate.sleepHours ?? 0, targets.sleep),
    ];
    const meaningfulActionCount = goalHits.filter((value) => value >= 50).length;
    const recoveryProtected =
      sleepDurationScore(aggregate.sleepHours ?? 0, targets.sleep) >= 80 &&
      progressPercent(aggregate.activeSeconds / 60, targets.activeMinutes) < 50;
    const status =
      meaningfulActionCount >= 3
        ? "achieved"
        : recoveryProtected && meaningfulActionCount >= 2
          ? "recovery-day"
          : snapshot.dataCompleteness < 40
            ? "incomplete-data"
            : "forming";
    return {
      date: key,
      status,
      meaningfulActionCount,
      dataCompleteness: snapshot.dataCompleteness,
      recoveryProtected,
      explanation:
        status === "achieved"
          ? "Tiga atau lebih target harian memiliki progres bermakna."
          : status === "recovery-day"
            ? "Tidur dan tindakan pendukung menjaga hari pemulihan."
            : status === "incomplete-data"
              ? "Belum cukup sumber data untuk menilai hari ini."
              : "Progres hari ini masih terbentuk dari data yang dicatat.",
    };
  });

  let longestStreak = 0;
  let runningStreak = 0;
  for (const point of healthyHistory) {
    if (point.status === "achieved" || point.status === "recovery-day") {
      runningStreak += 1;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  }

  const challenges: ProgressChallenge[] = challengeRows.map((challenge) => {
    const progress = challenge.progresses[0];
    const values = challengeValues({
      metric: challenge.metric,
      currentValue: progress?.currentValue ?? 0,
      targetValue: challenge.targetValue,
      targetUnit: challenge.targetUnit,
    });
    return {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      type: challenge.type,
      category: challenge.category,
      trustLevel: challenge.trustLevel,
      metric: challenge.metric,
      activityType: challenge.activityType,
      ...values,
      progressPercent: progressPercent(
        progress?.currentValue ?? 0,
        challenge.targetValue,
      ),
      isCompleted: progress?.isCompleted ?? false,
      isJoined: Boolean(progress),
      isRewardClaimed: Boolean(
        progress?.claimedXpGrantId || progress?.claimedHpLedgerEntryId,
      ),
      bonusXp: challenge.bonusXp,
      bonusHp: challenge.bonusHp,
      startDate: challenge.startDate.toISOString(),
      endDate: challenge.endDate.toISOString(),
    };
  });
  const mainChallenge = challenges[0];
  const today = aggregates.get(todayKey) ?? dayAggregate();
  const todayHydrationMl =
    today.waterMl || (today.pulseHydrationLiters ?? 0) * 1_000;
  const daily = {
    steps: metric(today.steps, targets.steps, "langkah"),
    water: metric(todayHydrationMl, targets.water, "ml"),
    activeMinutes: metric(
      today.activeSeconds / 60,
      targets.activeMinutes,
      "mnt",
    ),
    walkingDistance: metric(
      today.walkingDistanceMeters / 1_000,
      targets.walkingDistanceKm,
      "km",
      2,
    ),
    calories: metric(today.calories, targets.calories, "kkal"),
    protein: metric(today.protein, targets.protein, "g", 1),
    carbs: metric(today.carbs, targets.carbs, "g", 1),
    fiber: metric(today.fiber, targets.fiber, "g", 1),
    sleep: {
      ...metric(today.sleepHours ?? 0, targets.sleep, "jam", 1),
      percent: sleepDurationScore(today.sleepHours ?? 0, targets.sleep),
    },
  };

  const goalRows: BehaviorGoal[] = [
    {
      id: "goal-walking-distance",
      travelerId: user.id,
      title: "Jalan Hari Ini",
      description: "Bangun kebiasaan bergerak dari aktivitas GPS terverifikasi.",
      period: "daily",
      category: "activity",
      metric: "distance-km",
      targetValue: daily.walkingDistance.target,
      currentValue: daily.walkingDistance.value,
      unit: "km",
      progressPercent: daily.walkingDistance.percent,
      status:
        daily.walkingDistance.percent >= 100
          ? "completed"
          : daily.walkingDistance.value > 0
            ? "in-progress"
            : "not-started",
      trustLevel: "verified",
      sourceType: "activity",
      privacy: "circle",
      explanation: "Hanya jarak jalan atau lari yang lolos verifikasi server.",
      actionLabel: "Lanjutkan Aktivitas",
      actionHref: "/aktivitas",
      isOptional: false,
      isMock: false,
      version: "2.0.0",
    },
    {
      id: "goal-protein",
      travelerId: user.id,
      title: "Progres Protein",
      description: "Penuhi target protein dari catatan makanan.",
      period: "daily",
      category: "nutrition",
      metric: "protein-grams",
      targetValue: daily.protein.target,
      currentValue: daily.protein.value,
      unit: "g",
      progressPercent: daily.protein.percent,
      status:
        daily.protein.percent >= 100
          ? "completed"
          : daily.protein.value > 0
            ? "in-progress"
            : "not-started",
      trustLevel: "partially-verified",
      sourceType: "food-entry",
      privacy: "private",
      explanation: "Progres berasal dari catatan makanan yang tersimpan.",
      actionLabel: "Catat Protein",
      actionHref: "/scan",
      isOptional: false,
      isMock: false,
      version: "2.0.0",
    },
    {
      id: "goal-hydration",
      travelerId: user.id,
      title: "Hidrasi",
      description: "Penuhi kebutuhan air sesuai target profil.",
      period: "daily",
      category: "hydration",
      metric: "hydration-liters",
      targetValue: rounded(daily.water.target / 1_000, 1),
      currentValue: rounded(daily.water.value / 1_000, 1),
      unit: "L",
      progressPercent: daily.water.percent,
      status:
        daily.water.percent >= 100
          ? "completed"
          : daily.water.value > 0
            ? "in-progress"
            : "not-started",
      trustLevel: "self-reported",
      sourceType: "hydration-log",
      privacy: "private",
      explanation: "Hidrasi berasal dari catatan air pengguna.",
      actionLabel: "Catat Air",
      actionHref: "/health-pulse",
      isOptional: false,
      isMock: false,
      version: "2.0.0",
    },
    {
      id: "goal-sleep",
      travelerId: user.id,
      title: "Tidur & Pemulihan",
      description: "Catat durasi tidur untuk menjaga pola pemulihan.",
      period: "daily",
      category: "recovery",
      metric: "sleep-hours",
      targetValue: daily.sleep.target,
      currentValue: daily.sleep.value,
      unit: "jam",
      progressPercent: daily.sleep.percent,
      status:
        daily.sleep.percent >= 100
          ? "completed"
          : daily.sleep.value > 0
            ? "in-progress"
            : "not-started",
      trustLevel: daily.sleep.value > 0 ? "self-reported" : "missing",
      sourceType: "recovery-log",
      privacy: "private",
      explanation: "Durasi tidur merupakan catatan mandiri pengguna.",
      actionLabel: "Isi Check-in",
      actionHref: "/health-pulse",
      isOptional: false,
      isMock: false,
      version: "2.0.0",
    },
  ];
  const completedGoalCount = goalRows.filter(
    (goal) => goal.status === "completed",
  ).length;
  const currentHealthyDay = healthyHistory.at(-1)!;
  const currentStreak = [...healthyHistory]
    .reverse()
    .findIndex(
      (point) =>
        point.status !== "achieved" && point.status !== "recovery-day",
    );
  const effectiveHealthyStreak =
    currentStreak === -1 ? healthyHistory.length : currentStreak;
  const averageProgress = Math.round(
    goalRows.reduce((sum, goal) => sum + goal.progressPercent, 0) /
      goalRows.length,
  );
  const todayJourney: TodayJourney = {
    id: `today-journey-${todayKey}`,
    travelerId: user.id,
    date: todayKey,
    title: "Perjalanan Hari Ini",
    summary: "Progres langsung dari aktivitas dan catatan kesehatan tersimpan.",
    progressPercent: averageProgress,
    status:
      completedGoalCount === goalRows.length
        ? "completed"
        : averageProgress > 0
          ? "in-progress"
          : "not-started",
    goals: goalRows,
    completedGoalCount,
    totalGoalCount: goalRows.length,
    healthyDay: {
      status: currentHealthyDay.status,
      meaningfulActionCount: currentHealthyDay.meaningfulActionCount,
      minimumActionCount: 3,
      contributingGoalIds: goalRows
        .filter((goal) => goal.progressPercent >= 50)
        .map((goal) => goal.id),
      recoveryQualified: currentHealthyDay.recoveryProtected,
      dataCompleteness: currentHealthyDay.dataCompleteness,
      explanation: currentHealthyDay.explanation,
      isMock: false,
    },
    streak: {
      currentDays: effectiveHealthyStreak,
      longestDays: longestStreak,
      status: effectiveHealthyStreak > 0 ? "active" : "forming",
      lastQualifiedDate:
        [...healthyHistory]
          .reverse()
          .find(
            (point) =>
              point.status === "achieved" || point.status === "recovery-day",
          )?.date ?? todayKey,
      freezeAvailable: false,
      freezeUsed: false,
      recoveryProtected: currentHealthyDay.recoveryProtected,
      explanation: "Streak dihitung dari Hari Sehat dan hari pemulihan yang memenuhi syarat.",
      isMock: false,
    },
    challengeSummary: mainChallenge
      ? {
          id: mainChallenge.id,
          title: mainChallenge.title,
          category: "challenge",
          targetValue: mainChallenge.targetValue,
          currentValue: mainChallenge.currentValue,
          unit: mainChallenge.unit,
          progressPercent: mainChallenge.progressPercent,
          status: mainChallenge.isCompleted ? "completed" : "in-progress",
          explanation: "Progres berasal dari kontribusi aktivitas yang disimpan server.",
          actionLabel: "Lihat Tantangan",
          actionHref: `/challenge/${mainChallenge.id}`,
        }
      : {
          id: "no-active-challenge",
          title: "Belum ada tantangan aktif",
          category: "challenge",
          targetValue: 1,
          currentValue: 0,
          unit: "target",
          progressPercent: 0,
          status: "unavailable",
          explanation: "Tantangan aktif akan muncul setelah tersedia.",
          actionLabel: "Lihat Tantangan",
          actionHref: "/challenge",
        },
    rewardPreview: {
      progressXp: xpToday._sum.amount ?? 0,
      hp: hpToday._sum.amount ?? 0,
      eligible: (xpToday._sum.amount ?? 0) > 0 || (hpToday._sum.amount ?? 0) > 0,
      explanation: "Nilai ini adalah reward yang benar-benar masuk ke ledger hari ini.",
      milestoneLabel: "Reward Hari Ini",
    },
    nextAction: {
      label:
        goalRows.find((goal) => goal.status !== "completed")?.actionLabel ??
        "Lihat Progres",
      href:
        goalRows.find((goal) => goal.status !== "completed")?.actionHref ??
        "/dashboard",
      reason:
        goalRows.find((goal) => goal.status !== "completed")?.explanation ??
        "Seluruh target utama hari ini telah tercapai.",
    },
    generatedAt: now.toISOString(),
    isMock: false,
    version: "2.0.0",
  };

  const lastSevenDays = healthyHistory.slice(-7);
  return {
    generatedAt: now.toISOString(),
    timezone,
    date: todayKey,
    identity: { id: user.id, name: user.name },
    economy: {
      totalXp: user.economy?.totalXp ?? 0,
      currentHp: user.economy?.currentHp ?? 0,
      hpDebt: user.economy?.hpDebt ?? 0,
      currentTier: user.economy?.currentTier ?? "SPROUT",
      streakDays: user.economy?.streakDays ?? 0,
      xpToday: xpToday._sum.amount ?? 0,
      hpToday: hpToday._sum.amount ?? 0,
    },
    daily,
    healthPulse: {
      current: currentSnapshot,
      previous: previousSnapshot,
      history: snapshotRows.map((snapshot, index) => ({
        date: dayKeys[index],
        score: snapshot.score,
      })),
    },
    todayJourney,
    healthyDays: {
      history: healthyHistory,
      achievedDays: healthyHistory.filter((point) => point.status === "achieved")
        .length,
      recoveryDays: healthyHistory.filter(
        (point) => point.status === "recovery-day",
      ).length,
      averageCompleteness: Math.round(
        healthyHistory.reduce((sum, point) => sum + point.dataCompleteness, 0) /
          Math.max(1, healthyHistory.length),
      ),
      longestStreak,
    },
    challenges,
    profile: {
      verifiedActivityCount,
      totalDistanceKm: rounded((totalDistance._sum.distanceMeters ?? 0) / 1_000, 2),
      healthyDaysThisWeek: lastSevenDays.filter(
        (point) => point.status === "achieved" || point.status === "recovery-day",
      ).length,
    },
  };
}

export async function buildCommunityOverview(
  userId: string,
  now = new Date(),
): Promise<CommunityOverview> {
  const weekStart = new Date(now.getTime() - 7 * DAY_MS);
  const activeSince = new Date(now.getTime() - 30 * DAY_MS);
  const [
    activeMembers,
    weeklyActivities,
    economies,
    events,
    challenges,
    guilds,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        isSuspended: false,
        OR: [
          {
            activitySessions: {
              some: {
                verificationStatus: VerificationStatus.VERIFIED,
                endTime: { gte: activeSince },
              },
            },
          },
          { nutritionEntries: { some: { loggedAt: { gte: activeSince } } } },
          { waterLogs: { some: { loggedAt: { gte: activeSince } } } },
        ],
      },
    }),
    prisma.activitySession.findMany({
      where: {
        verificationStatus: VerificationStatus.VERIFIED,
        endTime: { gte: weekStart, lte: now },
        activityType: { in: [ActivityType.WALK, ActivityType.RUN] },
      },
      select: { distanceMeters: true, activityType: true },
    }),
    prisma.userEconomy.aggregate({
      where: { user: { is: { isSuspended: false } } },
      _avg: { streakDays: true },
    }),
    prisma.event.findMany({
      where: { isActive: true, endDate: { gte: now } },
      include: {
        registrations: {
          where: { status: { not: "CANCELLED" } },
          select: { userId: true },
        },
      },
      orderBy: { startDate: "asc" },
      take: 20,
    }),
    prisma.challenge.findMany({
      where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
      include: {
        contributions: { select: { amount: true, userId: true } },
        progresses: { select: { userId: true, currentValue: true } },
      },
      orderBy: { endDate: "asc" },
      take: 20,
    }),
    prisma.guild.findMany({
      where: { approvalStatus: COMMUNITY_APPROVAL.APPROVED, isActive: true },
      include: { _count: { select: { members: { where: { status: COMMUNITY_MEMBER.ACTIVE } } } } },
      orderBy: { members: { _count: "desc" } },
      take: 8,
    }),
  ]);
  const weeklySteps = Math.round(
    weeklyActivities.reduce(
      (sum, activity) =>
        sum + estimateSteps(activity.distanceMeters, activity.activityType),
      0,
    ),
  );
  const challenge = challenges[0];
  const challengeContribution = challenge
    ? challenge.contributions.reduce((sum, entry) => sum + entry.amount, 0)
    : 0;
  const challengeTarget = challenge
    ? challenge.targetValue * Math.max(1, new Set(challenge.contributions.map((entry) => entry.userId)).size)
    : 0;
  const challengeDisplay = challenge
    ? challengeValues({
        metric: challenge.metric,
        currentValue: challengeContribution,
        targetValue: challengeTarget || challenge.targetValue,
        targetUnit: challenge.targetUnit,
      })
    : null;
  const completionRatios = challenges.flatMap((item) =>
    item.progresses.map((progress) =>
      clamp((progress.currentValue / item.targetValue) * 100),
    ),
  );

  return {
    generatedAt: now.toISOString(),
    statistics: {
      activeMembers,
      weeklySteps,
      activeEvents: events.length,
      averageStreak: rounded(economies._avg.streakDays ?? 0, 1),
      averageSteps: activeMembers > 0 ? Math.round(weeklySteps / activeMembers) : 0,
      targetCompletionPercent: completionRatios.length
        ? Math.round(
            completionRatios.reduce((sum, value) => sum + value, 0) /
              completionRatios.length,
          )
        : 0,
    },
    events: events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      capacity: event.capacity,
      participants: event.registrations.length,
      isJoined: event.registrations.some(
        (registration) => registration.userId === userId,
      ),
      bonusXp: event.bonusXp,
      bonusHp: event.bonusHp,
      bannerUrl: event.bannerUrl,
    })),
    challenge:
      challenge && challengeDisplay
        ? {
            id: challenge.id,
            title: challenge.title,
            ...challengeDisplay,
            progressPercent: progressPercent(
              challengeContribution,
              challengeTarget || challenge.targetValue,
            ),
            participants: new Set(
              challenge.contributions.map((entry) => entry.userId),
            ).size,
            isJoined: challenge.progresses.some(
              (progress) => progress.userId === userId,
            ),
          }
        : null,
    guilds: guilds.map((guild) => ({
      id: guild.id,
      name: guild.name,
      members: guild._count.members,
    })),
  };
}
