import { VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  HealthDataTrustLevel,
  HealthDimensionScore,
  HealthPulseSnapshot,
  HealthPulseUnlockGuide,
} from "@/features/health-pulse/types";
import {
  calendarDayKey,
  utcDayBoundsForKey,
} from "@/server/economy/economy-policy";
import {
  calculateLongTermHealthPulse,
  nutritionAttainmentScore,
  sleepDurationScore,
  statusForHealthPulse,
  type DailyHealthPulseEvidence,
  type LongTermHealthPulseResult,
  type PulseDimension,
} from "@/server/health/health-pulse-policy";

const DAY_MS = 86_400_000;

type EvidenceAggregate = {
  calories: number;
  protein: number;
  fiber: number;
  nutritionLogCount: number;
  activityMinutes: number;
  verifiedActivityCount: number;
  sleepHours?: number;
  hydrationMl: number;
};

function rounded(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function dateKeysEndingAt(dayKey: string, count: number) {
  const [year, month, day] = dayKey.split("-").map(Number);
  const end = Date.UTC(year, month - 1, day);
  return Array.from({ length: count }, (_, index) =>
    new Date(end - (count - index - 1) * DAY_MS).toISOString().slice(0, 10),
  );
}

function shiftDayKey(dayKey: string, amount: number) {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day) + amount * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

function emptyAggregate(): EvidenceAggregate {
  return {
    calories: 0,
    protein: 0,
    fiber: 0,
    nutritionLogCount: 0,
    activityMinutes: 0,
    verifiedActivityCount: 0,
    hydrationMl: 0,
  };
}

function buildUnlockGuide(input: {
  dayKey: string;
  scoreThroughDate: string;
  aggregate: EvidenceAggregate;
  activityTargetMinutes: number;
  waterTargetMl: number;
  result: LongTermHealthPulseResult;
}): HealthPulseUnlockGuide {
  const hydrationRatio = input.aggregate.hydrationMl / Math.max(1, input.waterTargetMl);
  const checklist: HealthPulseUnlockGuide["checklist"] = [
    {
      id: "nutrition",
      label: "Catat nutrisi minimal 2 kali",
      detail: `${input.aggregate.nutritionLogCount}/2 catatan makan hari ini`,
      completed: input.aggregate.nutritionLogCount >= 2,
      actionHref: "/scan",
      actionLabel: "Catat makanan",
    },
    {
      id: "activity",
      label: "Selesaikan aktivitas GPS tervalidasi",
      detail: input.aggregate.verifiedActivityCount > 0
        ? `${Math.max(1, Math.round(input.aggregate.activityMinutes))} menit terverifikasi`
        : `Belum ada aktivitas; target pribadimu ${input.activityTargetMinutes} menit`,
      completed:
        input.aggregate.verifiedActivityCount > 0 &&
        input.aggregate.activityMinutes > 0,
      actionHref: "/aktivitas",
      actionLabel: "Mulai aktivitas",
    },
    {
      id: "sleep",
      label: "Catat waktu tidur terakhir",
      detail: input.aggregate.sleepHours !== undefined
        ? `${rounded(input.aggregate.sleepHours)} jam tercatat`
        : "Belum ada durasi tidur hari ini",
      completed: input.aggregate.sleepHours !== undefined,
      actionHref: "/health-pulse#daily-check-in",
      actionLabel: "Isi tidur",
    },
    {
      id: "hydration",
      label: "Penuhi minimal 75% target hidrasi",
      detail: `${input.aggregate.hydrationMl}/${input.waterTargetMl} ml (${Math.round(
        Math.min(1, hydrationRatio) * 100,
      )}%)`,
      completed: hydrationRatio >= 0.75,
      actionHref: "/health-pulse#daily-check-in",
      actionLabel: "Tambah air",
    },
  ];
  const todayCompleted = checklist.filter((item) => item.completed).length;
  const todayIsComplete = todayCompleted === checklist.length;
  const projectedCompleteDays = todayIsComplete
    ? input.result.consecutiveCompleteDays + 1
    : input.result.consecutiveCompleteDays;
  const fastDaysRemaining = Math.max(0, 4 - projectedCompleteDays);
  const standardDaysRemaining = Math.max(0, 7 - input.result.analysisDay);
  const message = input.result.published
    ? `Diagram sudah terbuka. Skor hari ini memakai data yang selesai sampai ${input.scoreThroughDate}.`
    : todayIsComplete && projectedCompleteDays >= 4
      ? "Checklist hari ini lengkap. Diagram akan terbuka setelah pergantian hari dan snapshot hari ini ditutup."
      : input.result.analysisDay >= 7 && input.result.routine7.dimensionCount === 0
        ? "Tujuh hari sudah dinilai. Tambahkan minimal satu data kebiasaan agar estimasi awal dapat dihitung."
        : `Selesaikan checklist harian. Jalur cepat tersisa ${fastDaysRemaining} hari lengkap; jalur normal tersisa ${standardDaysRemaining} hari.`;

  return {
    isUnlocked: input.result.published,
    scoreThroughDate: input.scoreThroughDate,
    evaluatedDays: input.result.analysisDay,
    standardDaysRequired: 7,
    consecutiveCompleteDays: input.result.consecutiveCompleteDays,
    projectedCompleteDays,
    fastTrackDaysRequired: 4,
    todayCompleted,
    todayTotal: 4,
    todayIsComplete,
    dataConfidence: input.result.dataConfidence,
    confidenceCap: input.result.confidenceCap,
    message,
    checklist,
  };
}

function trendForChange(change: number) {
  if (change > 0) return "improving" as const;
  if (change < -0.5) return "needs-attention" as const;
  if (change < 0) return "recovering" as const;
  return "stable" as const;
}

function dimensionSummary(dimension: PulseDimension, hasData: boolean) {
  if (!hasData) return "Belum cukup data untuk membaca pola dimensi ini.";
  const summaries: Record<PulseDimension, string> = {
    nutrition: "Dinilai dari hari dengan catatan makan yang cukup mewakili.",
    activity: "Hanya durasi dan frekuensi aktivitas GPS terverifikasi yang dihitung.",
    sleep: "Dinilai terhadap target tidur pribadi dan rentang pemulihan.",
    hydration: "Hari memenuhi pola hidrasi saat mencapai minimal 75% target.",
  };
  return summaries[dimension];
}

function dimensionsForSnapshot(
  current: Partial<Record<PulseDimension, number>>,
  previous: Partial<Record<PulseDimension, number>> = {},
): HealthDimensionScore[] {
  const trust: Record<PulseDimension, HealthDataTrustLevel> = {
    nutrition: "partially-verified",
    activity: "trusted",
    sleep: "self-reported",
    hydration: "self-reported",
  };
  return (
    ["nutrition", "activity", "sleep", "hydration"] as PulseDimension[]
  ).map((dimension) => {
    const hasData = current[dimension] !== undefined;
    const score = rounded(current[dimension] ?? 0);
    const previousScore = rounded(previous[dimension] ?? score);
    const change = rounded(score - previousScore);
    return {
      dimension,
      score,
      previousScore,
      change,
      trend: trendForChange(change),
      trust: hasData ? trust[dimension] : "missing",
      completeness: hasData ? 100 : 0,
      summary: dimensionSummary(dimension, hasData),
    };
  });
}

function learningMessage(result: LongTermHealthPulseResult) {
  if (!result.published) {
    return `Health Pulse telah menilai ${result.analysisDay}/7 hari selesai. Lengkapi 4 kebiasaan selama 4 hari berturut-turut untuk membuka lebih cepat.`;
  }
  return null;
}

function snapshotFromResult(input: {
  userId: string;
  dayKey: string;
  result: LongTermHealthPulseResult;
  previousDimensions?: Partial<Record<PulseDimension, number>>;
  unlockGuide?: HealthPulseUnlockGuide;
}): HealthPulseSnapshot {
  const { result } = input;
  const dimensions = dimensionsForSnapshot(
    result.routine7.dimensions,
    input.previousDimensions,
  );
  return {
    id: `health-pulse-${input.dayKey}`,
    travelerId: input.userId,
    score: result.score,
    previousScore: result.previousScore,
    change: result.change,
    status: result.status,
    trend: trendForChange(result.change),
    strongestDimension: result.strongestDimension,
    focusDimension: result.focusDimension,
    dataCompleteness: result.routine7.coverage,
    dataCoverage7: result.routine7.coverage,
    dataCoverage28: result.routine28.coverage,
    phase: result.phase,
    phaseCap: result.phaseCap,
    analysisDay: result.analysisDay,
    nextPhaseInDays: result.nextPhaseInDays,
    routineScore7: result.routine7.score,
    routineScore28: result.routine28.score,
    routineScore90: result.routine90.score,
    isPublished: result.published,
    learningMessage: learningMessage(result),
    unlockGuide: input.unlockGuide,
    generatedAt: new Date(`${input.dayKey}T23:59:59.999Z`).toISOString(),
    dimensions,
    reasons: result.reasons,
    recommendedNextAction: result.published
      ? result.focusDimension === "activity"
        ? "Tambahkan aktivitas ringan yang dapat diverifikasi."
        : result.focusDimension === "nutrition"
          ? "Lengkapi catatan makan agar mewakili pola satu hari."
          : result.focusDimension === "sleep"
            ? "Catat durasi tidur untuk melengkapi pola pemulihan."
            : "Tambahkan catatan air minum berikutnya."
      : "Lengkapi kebiasaan secara alami; satu hari kosong tidak langsung menurunkan Pulse.",
  };
}

function jsonDimensionScores(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const parsed: Partial<Record<PulseDimension, number>> = {};
  for (const dimension of [
    "nutrition",
    "activity",
    "sleep",
    "hydration",
  ] as const) {
    const score = (value as Record<string, unknown>)[dimension];
    if (typeof score === "number" && Number.isFinite(score)) {
      parsed[dimension] = score;
    }
  }
  return parsed;
}

function rowToPublishedSnapshot(
  row: Awaited<ReturnType<typeof prisma.healthPulse.findFirst>>,
  userId: string,
): HealthPulseSnapshot | null {
  if (!row || !row.isPublished || row.overallScore === null) return null;
  const dimensionScores = jsonDimensionScores(row.dimensionScores);
  const reasons = Array.isArray(row.reasons)
    ? row.reasons.filter((item): item is string => typeof item === "string")
    : [];
  const score = rounded(row.overallScore);
  const dayKey = row.pulseDate.toISOString().slice(0, 10);
  const phase = ["LEARNING", "FOUNDATION", "GROWTH", "SUSTAINED", "MASTERY"].includes(row.phase)
    ? (row.phase as HealthPulseSnapshot["phase"])
    : "FOUNDATION";
  const focus = (["nutrition", "activity", "sleep", "hydration"] as string[]).includes(
    row.focusDimension ?? "",
  )
    ? (row.focusDimension as PulseDimension)
    : "activity";
  const strongest = (["nutrition", "activity", "sleep", "hydration"] as string[]).includes(
    row.strongestDimension ?? "",
  )
    ? (row.strongestDimension as PulseDimension)
    : "activity";
  return {
    id: row.id,
    travelerId: userId,
    score,
    previousScore: score,
    change: 0,
    status: statusForHealthPulse(score),
    trend: "stable",
    strongestDimension: strongest,
    focusDimension: focus,
    dataCompleteness: row.dataCoverage7,
    dataCoverage7: row.dataCoverage7,
    dataCoverage28: row.dataCoverage28,
    phase,
    phaseCap: row.phaseCap,
    analysisDay: row.analysisDay,
    nextPhaseInDays:
      phase === "MASTERY"
        ? null
        : phase === "SUSTAINED"
          ? Math.max(0, 181 - row.analysisDay)
          : phase === "GROWTH"
            ? Math.max(0, 91 - row.analysisDay)
            : Math.max(0, 31 - row.analysisDay),
    routineScore7: row.routineScore7,
    routineScore28: row.routineScore28,
    routineScore90: row.routineScore90,
    isPublished: true,
    learningMessage: null,
    generatedAt: new Date(`${dayKey}T23:59:59.999Z`).toISOString(),
    dimensions: dimensionsForSnapshot(dimensionScores),
    reasons,
    recommendedNextAction:
      focus === "activity"
        ? "Tambahkan aktivitas ringan yang dapat diverifikasi."
        : focus === "nutrition"
          ? "Lengkapi catatan makan agar mewakili pola satu hari."
          : focus === "sleep"
            ? "Catat durasi tidur untuk melengkapi pola pemulihan."
            : "Tambahkan catatan air minum berikutnya.",
  };
}

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
  const scoreThroughDayKey = shiftDayKey(dayKey, -1);
  const pulseDate = new Date(`${dayKey}T00:00:00.000Z`);
  // Keep today for the live checklist plus 90 completed days for scoring.
  const dayKeys = dateKeysEndingAt(dayKey, 91);
  const firstBounds = utcDayBoundsForKey(dayKeys[0], timezone);
  const finalBounds = utcDayBoundsForKey(dayKey, timezone);

  const [activities, nutritionEntries, waterLogs, pulseInputs, healthMetrics, previous, earliestPulse] =
    await Promise.all([
      prisma.activitySession.findMany({
        where: {
          userId: input.userId,
          verificationStatus: VerificationStatus.VERIFIED,
          endTime: { gte: firstBounds.start, lt: finalBounds.end },
        },
        select: { endTime: true, startTime: true, activeDurationSeconds: true, durationSeconds: true },
      }),
      prisma.nutritionEntry.findMany({
        where: { userId: input.userId, loggedAt: { gte: firstBounds.start, lt: finalBounds.end } },
        select: { loggedAt: true, calories: true, protein: true, fiber: true },
      }),
      prisma.waterLog.findMany({
        where: { userId: input.userId, loggedAt: { gte: firstBounds.start, lt: finalBounds.end } },
        select: { loggedAt: true, volumeMl: true },
      }),
      prisma.healthPulse.findMany({
        where: {
          userId: input.userId,
          pulseDate: {
            gte: new Date(`${dayKeys[0]}T00:00:00.000Z`),
            lte: pulseDate,
          },
        },
        select: { pulseDate: true, sleepHours: true, hydrationLiters: true },
      }),
      prisma.healthMetric.findMany({
        where: {
          userId: input.userId,
          weightKg: { not: null },
          recordedAt: {
            gte: new Date(firstBounds.start.getTime() - 14 * DAY_MS),
            lt: finalBounds.end,
          },
        },
        select: { recordedAt: true, weightKg: true },
        orderBy: { recordedAt: "asc" },
      }),
      prisma.healthPulse.findFirst({
        where: {
          userId: input.userId,
          pulseDate: { lt: pulseDate },
          isPublished: true,
          overallScore: { not: null },
        },
        orderBy: { pulseDate: "desc" },
      }),
      prisma.healthPulse.findFirst({
        where: { userId: input.userId },
        select: { pulseDate: true },
        orderBy: { pulseDate: "asc" },
      }),
    ]);

  const aggregates = new Map(dayKeys.map((key) => [key, emptyAggregate()]));
  for (const activity of activities) {
    const key = calendarDayKey(activity.endTime ?? activity.startTime, timezone);
    const aggregate = aggregates.get(key);
    if (!aggregate) continue;
    aggregate.activityMinutes +=
      (activity.activeDurationSeconds || activity.durationSeconds) / 60;
    aggregate.verifiedActivityCount += 1;
  }
  for (const entry of nutritionEntries) {
    const aggregate = aggregates.get(calendarDayKey(entry.loggedAt, timezone));
    if (!aggregate) continue;
    aggregate.calories += entry.calories;
    aggregate.protein += entry.protein;
    aggregate.fiber += entry.fiber;
    aggregate.nutritionLogCount += 1;
  }
  for (const log of waterLogs) {
    const aggregate = aggregates.get(calendarDayKey(log.loggedAt, timezone));
    if (aggregate) aggregate.hydrationMl += log.volumeMl;
  }
  for (const pulse of pulseInputs) {
    const aggregate = aggregates.get(pulse.pulseDate.toISOString().slice(0, 10));
    if (!aggregate) continue;
    if (pulse.sleepHours !== null) aggregate.sleepHours = pulse.sleepHours;
    if (aggregate.hydrationMl === 0 && pulse.hydrationLiters !== null) {
      aggregate.hydrationMl = pulse.hydrationLiters * 1_000;
    }
  }
  if (input.sleepHours !== undefined) {
    const aggregate = aggregates.get(dayKey);
    if (aggregate) aggregate.sleepHours = input.sleepHours;
  }

  const profile = user.healthProfile;
  const activityTargetMinutes = profile?.dailyActiveTargetMinutes ?? 30;
  const waterTargetMl = profile?.dailyWaterTargetMl ?? 2_000;
  const evidence: DailyHealthPulseEvidence[] = dayKeys.map((date) => {
    const aggregate = aggregates.get(date) ?? emptyAggregate();
    return {
      date,
      nutritionLogCount: aggregate.nutritionLogCount,
      ...(aggregate.nutritionLogCount > 0
        ? {
            nutritionScore: nutritionAttainmentScore({
              calories: aggregate.calories,
              protein: aggregate.protein,
              fiber: aggregate.fiber,
              calorieTarget: profile?.dailyCalorieTarget ?? 2_000,
              proteinTarget: profile?.dailyProteinTargetGrams ?? 80,
              fiberTarget: profile?.dailyFiberTargetGrams ?? 25,
            }),
          }
        : {}),
      activityMinutes: aggregate.activityMinutes,
      activityTargetMinutes,
      verifiedActivityCount: aggregate.verifiedActivityCount,
      ...(aggregate.sleepHours !== undefined
        ? {
            sleepScore: sleepDurationScore(
              aggregate.sleepHours,
              profile?.dailySleepTargetHours ?? 8,
            ),
          }
        : {}),
      ...(aggregate.hydrationMl > 0
        ? { hydrationRatio: aggregate.hydrationMl / waterTargetMl }
        : {}),
    };
  });
  const weights = healthMetrics.flatMap((entry) =>
    entry.weightKg === null
      ? []
      : [
          {
            date: calendarDayKey(entry.recordedAt, timezone),
            weightKg: entry.weightKg,
          },
        ],
  );
  const result = calculateLongTermHealthPulse({
    days: evidence,
    weights,
    journeyStartDate:
      earliestPulse?.pulseDate.toISOString().slice(0, 10) ?? dayKey,
    asOfDate: scoreThroughDayKey,
    previousPublishedScore: previous?.overallScore,
    targetWeightKg: profile?.targetWeightKg,
  });
  const currentAggregate = aggregates.get(dayKey) ?? emptyAggregate();
  const unlockGuide = buildUnlockGuide({
    dayKey,
    scoreThroughDate: scoreThroughDayKey,
    aggregate: currentAggregate,
    activityTargetMinutes,
    waterTargetMl,
    result,
  });

  const pulse = await prisma.healthPulse.upsert({
    where: { userId_pulseDate: { userId: input.userId, pulseDate } },
    create: {
      userId: input.userId,
      pulseDate,
      overallScore: result.score,
      nutritionScore: result.routine7.dimensions.nutrition ?? 0,
      activityScore: result.routine7.dimensions.activity ?? 0,
      sleepScore: result.routine7.dimensions.sleep,
      hydrationScore: result.routine7.dimensions.hydration,
      sleepHours: currentAggregate.sleepHours,
      hydrationLiters:
        currentAggregate.hydrationMl > 0
          ? currentAggregate.hydrationMl / 1_000
          : null,
      isPublished: result.published,
      phase: result.phase,
      phaseCap: result.phaseCap,
      analysisDay: result.analysisDay,
      routineScore7: result.routine7.score,
      routineScore28: result.routine28.score,
      routineScore90: result.routine90.score,
      dataCoverage7: result.routine7.coverage,
      dataCoverage28: result.routine28.coverage,
      dataDays7: result.routine7.dataDays,
      dimensionCount7: result.routine7.dimensionCount,
      weightTrendBonus: result.weightTrendBonus,
      noDataStreak: result.noDataStreak,
      dimensionScores: result.routine7.dimensions,
      reasons: result.reasons,
      focusDimension: result.focusDimension,
      strongestDimension: result.strongestDimension,
    },
    update: {
      overallScore: result.score,
      nutritionScore: result.routine7.dimensions.nutrition ?? 0,
      activityScore: result.routine7.dimensions.activity ?? 0,
      sleepScore: result.routine7.dimensions.sleep,
      hydrationScore: result.routine7.dimensions.hydration,
      ...(input.sleepHours !== undefined
        ? { sleepHours: input.sleepHours }
        : {}),
      hydrationLiters:
        currentAggregate.hydrationMl > 0
          ? currentAggregate.hydrationMl / 1_000
          : null,
      isPublished: result.published,
      phase: result.phase,
      phaseCap: result.phaseCap,
      analysisDay: result.analysisDay,
      routineScore7: result.routine7.score,
      routineScore28: result.routine28.score,
      routineScore90: result.routine90.score,
      dataCoverage7: result.routine7.coverage,
      dataCoverage28: result.routine28.coverage,
      dataDays7: result.routine7.dataDays,
      dimensionCount7: result.routine7.dimensionCount,
      weightTrendBonus: result.weightTrendBonus,
      noDataStreak: result.noDataStreak,
      dimensionScores: result.routine7.dimensions,
      reasons: result.reasons,
      focusDimension: result.focusDimension,
      strongestDimension: result.strongestDimension,
    },
  });

  return {
    pulse,
    timezone,
    dayKey,
    result,
    snapshot: snapshotFromResult({
      userId: input.userId,
      dayKey,
      result,
      previousDimensions: jsonDimensionScores(previous?.dimensionScores),
      unlockGuide,
    }),
  };
}

export async function getHealthPulseOverview(
  userId: string,
  now = new Date(),
) {
  const refreshed = await refreshDailyHealthPulse({ userId, occurredAt: now });
  const currentDate = new Date(`${refreshed.dayKey}T00:00:00.000Z`);
  const [previousRow, historyRows] = await Promise.all([
    prisma.healthPulse.findFirst({
      where: {
        userId,
        pulseDate: { lt: currentDate },
        isPublished: true,
        overallScore: { not: null },
      },
      orderBy: { pulseDate: "desc" },
    }),
    prisma.healthPulse.findMany({
      where: { userId, isPublished: true, overallScore: { not: null } },
      select: { pulseDate: true, overallScore: true },
      orderBy: { pulseDate: "desc" },
      take: 90,
    }),
  ]);
  const previous = rowToPublishedSnapshot(previousRow, userId) ?? refreshed.snapshot;
  return {
    current: refreshed.snapshot,
    previous,
    history: historyRows
      .reverse()
      .flatMap((row) =>
        row.overallScore === null
          ? []
          : [
              {
                date: row.pulseDate.toISOString().slice(0, 10),
                score: rounded(row.overallScore),
              },
            ],
      ),
  };
}
