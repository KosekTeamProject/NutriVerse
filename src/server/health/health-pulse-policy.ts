export const HEALTH_PULSE_DIMENSION_WEIGHTS = {
  nutrition: 0.3,
  activity: 0.3,
  sleep: 0.2,
  hydration: 0.2,
} as const;

export const HEALTH_PULSE_WINDOW_WEIGHTS = {
  routine7: 0.45,
  routine28: 0.35,
  routine90: 0.2,
} as const;

export type PulseDimension = keyof typeof HEALTH_PULSE_DIMENSION_WEIGHTS;
export type HealthPulsePhase =
  | "LEARNING"
  | "FOUNDATION"
  | "GROWTH"
  | "SUSTAINED"
  | "MASTERY";
export type HealthPulseStatus =
  | "foundation"
  | "growing"
  | "consistent"
  | "very-consistent"
  | "peak-balance";

export type DailyHealthPulseEvidence = {
  date: string;
  nutritionScore?: number;
  nutritionLogCount: number;
  activityMinutes: number;
  activityTargetMinutes: number;
  verifiedActivityCount: number;
  sleepScore?: number;
  hydrationRatio?: number;
};

export type WeightMeasurement = {
  date: string;
  weightKg: number;
};

export type RoutineWindowResult = {
  score: number | null;
  coverage: number;
  dataDays: number;
  dimensionCount: number;
  dimensions: Partial<Record<PulseDimension, number>>;
};

export type LongTermHealthPulseResult = {
  published: boolean;
  score: number | null;
  rawScore: number | null;
  previousScore: number | null;
  change: number;
  status: HealthPulseStatus;
  phase: HealthPulsePhase;
  phaseCap: number;
  analysisDay: number;
  nextPhaseInDays: number | null;
  routine7: RoutineWindowResult;
  routine28: RoutineWindowResult;
  routine90: RoutineWindowResult;
  weightTrendBonus: number;
  noDataStreak: number;
  strongestDimension: PulseDimension;
  focusDimension: PulseDimension;
  reasons: string[];
};

const DAY_MS = 86_400_000;

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, value));
}

function rounded(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function parseDay(dayKey: string) {
  const [year, month, day] = dayKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function daysBetween(startDay: string, endDay: string) {
  return Math.floor((parseDay(endDay) - parseDay(startDay)) / DAY_MS);
}

function dayKeysEndingAt(dayKey: string, count: number) {
  const end = parseDay(dayKey);
  return Array.from({ length: count }, (_, index) =>
    new Date(end - (count - index - 1) * DAY_MS).toISOString().slice(0, 10),
  );
}

export function targetAttainmentScore(value: number, target: number) {
  if (!Number.isFinite(value) || !Number.isFinite(target) || target <= 0) {
    return 0;
  }
  return rounded(clamp((Math.max(0, value) / target) * 100));
}

/** Wellness guidance only; this is not a medical sleep assessment. */
export function sleepDurationScore(hours: number, targetHours: number) {
  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(targetHours) ||
    hours <= 0 ||
    targetHours <= 0
  ) {
    return 0;
  }

  const idealMinimum = Math.max(4, targetHours - 0.5);
  const idealMaximum = Math.min(12, targetHours + 1);
  if (hours >= idealMinimum && hours <= idealMaximum) return 100;
  if (hours < idealMinimum) {
    return rounded(clamp((hours / idealMinimum) * 100));
  }
  return rounded(clamp(100 - (hours - idealMaximum) * 15));
}

export function nutritionAttainmentScore(input: {
  calories: number;
  protein: number;
  fiber: number;
  calorieTarget: number;
  proteinTarget: number;
  fiberTarget: number;
}) {
  const protein = targetAttainmentScore(input.protein, input.proteinTarget);
  const fiber = targetAttainmentScore(input.fiber, input.fiberTarget);
  const calories = targetAttainmentScore(input.calories, input.calorieTarget);
  return rounded(protein * 0.5 + fiber * 0.3 + calories * 0.2);
}

export function phaseForAnalysisDay(analysisDay: number): {
  phase: HealthPulsePhase;
  cap: number;
  nextPhaseInDays: number | null;
} {
  if (analysisDay <= 7) {
    return { phase: "LEARNING", cap: 0, nextPhaseInDays: 8 - analysisDay };
  }
  if (analysisDay <= 30) {
    return { phase: "FOUNDATION", cap: 55, nextPhaseInDays: 31 - analysisDay };
  }
  if (analysisDay <= 90) {
    return { phase: "GROWTH", cap: 70, nextPhaseInDays: 91 - analysisDay };
  }
  if (analysisDay <= 180) {
    return { phase: "SUSTAINED", cap: 85, nextPhaseInDays: 181 - analysisDay };
  }
  return { phase: "MASTERY", cap: 100, nextPhaseInDays: null };
}

export function statusForHealthPulse(score: number | null): HealthPulseStatus {
  if (score === null || score < 60) return "foundation";
  if (score < 80) return "growing";
  if (score < 90) return "consistent";
  if (score < 100) return "very-consistent";
  return "peak-balance";
}

function hasEvidence(day: DailyHealthPulseEvidence) {
  return (
    day.nutritionLogCount > 0 ||
    day.verifiedActivityCount > 0 ||
    day.sleepScore !== undefined ||
    day.hydrationRatio !== undefined
  );
}

/**
 * Coverage measures trust only. It is deliberately kept outside the routine
 * score so users are not rewarded merely for filling forms.
 */
export function calculateRoutineWindow(input: {
  days: readonly DailyHealthPulseEvidence[];
  asOfDate: string;
  windowDays: 7 | 28 | 90;
  analysisDay: number;
}): RoutineWindowResult {
  const denominator = Math.max(1, Math.min(input.windowDays, input.analysisDay));
  const selectedKeys = new Set(dayKeysEndingAt(input.asOfDate, denominator));
  const selected = input.days.filter((day) => selectedKeys.has(day.date));
  const dataDays = new Set(
    selected.filter(hasEvidence).map((day) => day.date),
  ).size;

  const nutritionSamples = selected.flatMap((day) =>
    day.nutritionLogCount >= 2 && day.nutritionScore !== undefined
      ? [clamp((day.nutritionScore / 70) * 100)]
      : [],
  );
  const activeDays = selected.filter(
    (day) => day.verifiedActivityCount > 0 && day.activityMinutes > 0,
  );
  const sleepSamples = selected.flatMap((day) =>
    day.sleepScore === undefined ? [] : [clamp(day.sleepScore)],
  );
  const hydrationSamples = selected.flatMap((day) =>
    day.hydrationRatio === undefined
      ? []
      : [clamp((day.hydrationRatio / 0.75) * 100)],
  );

  const average = (values: readonly number[]) =>
    values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : undefined;
  const expectedActiveDays = Math.max(1, Math.ceil((denominator * 5) / 7));
  const activityDuration = average(
    activeDays.map((day) =>
      clamp(
        (day.activityMinutes / Math.max(1, day.activityTargetMinutes)) * 100,
      ),
    ),
  );
  const activity = activityDuration === undefined
    ? undefined
    : activityDuration * 0.7 +
      clamp((activeDays.length / expectedActiveDays) * 100) * 0.3;
  const dimensions: Partial<Record<PulseDimension, number>> = {
    ...(nutritionSamples.length
      ? { nutrition: rounded(average(nutritionSamples)!) }
      : {}),
    ...(activity !== undefined ? { activity: rounded(activity) } : {}),
    ...(sleepSamples.length ? { sleep: rounded(average(sleepSamples)!) } : {}),
    ...(hydrationSamples.length
      ? { hydration: rounded(average(hydrationSamples)!) }
      : {}),
  };

  let weightedTotal = 0;
  let availableWeight = 0;
  for (const dimension of Object.keys(
    HEALTH_PULSE_DIMENSION_WEIGHTS,
  ) as PulseDimension[]) {
    const score = dimensions[dimension];
    if (score === undefined) continue;
    const weight = HEALTH_PULSE_DIMENSION_WEIGHTS[dimension];
    weightedTotal += score * weight;
    availableWeight += weight;
  }

  return {
    score: availableWeight > 0 ? rounded(weightedTotal / availableWeight) : null,
    coverage: Math.round(clamp((dataDays / denominator) * 100)),
    dataDays,
    dimensionCount: Object.keys(dimensions).length,
    dimensions,
  };
}

export function calculateSafeWeightTrendBonus(input: {
  weights: readonly WeightMeasurement[];
  asOfDate: string;
  targetWeightKg?: number | null;
}) {
  const target = input.targetWeightKg;
  if (!target || !Number.isFinite(target) || target <= 0) return 0;
  const asOf = parseDay(input.asOfDate);
  const current = input.weights.filter((entry) => {
    const age = Math.floor((asOf - parseDay(entry.date)) / DAY_MS);
    return age >= 0 && age < 7 && entry.weightKg > 0;
  });
  const previous = input.weights.filter((entry) => {
    const age = Math.floor((asOf - parseDay(entry.date)) / DAY_MS);
    return age >= 7 && age < 14 && entry.weightKg > 0;
  });
  if (!current.length || !previous.length) return 0;
  const average = (rows: readonly WeightMeasurement[]) =>
    rows.reduce((sum, entry) => sum + entry.weightKg, 0) / rows.length;
  const currentAverage = average(current);
  const previousAverage = average(previous);
  const weeklyChangePercent =
    (Math.abs(currentAverage - previousAverage) / previousAverage) * 100;
  const previousDistance = Math.abs(previousAverage - target);
  const currentDistance = Math.abs(currentAverage - target);
  const improvement = previousDistance - currentDistance;

  // Extreme weekly changes are never rewarded by this wellness indicator.
  if (improvement <= 0 || weeklyChangePercent > 2) return 0;
  return rounded(Math.min(2, (improvement / Math.max(1, previousDistance)) * 2));
}

function consecutiveNoDataDays(
  days: readonly DailyHealthPulseEvidence[],
  asOfDate: string,
) {
  const byDate = new Map(days.map((day) => [day.date, day]));
  let streak = 0;
  for (const key of [...dayKeysEndingAt(asOfDate, 90)].reverse()) {
    const day = byDate.get(key);
    if (day && hasEvidence(day)) break;
    streak += 1;
  }
  return streak;
}

export function calculateLongTermHealthPulse(input: {
  days: readonly DailyHealthPulseEvidence[];
  weights?: readonly WeightMeasurement[];
  journeyStartDate: string;
  asOfDate: string;
  previousPublishedScore?: number | null;
  targetWeightKg?: number | null;
}): LongTermHealthPulseResult {
  const analysisDay = Math.max(
    1,
    daysBetween(input.journeyStartDate, input.asOfDate) + 1,
  );
  const phaseInfo = phaseForAnalysisDay(analysisDay);
  const routine7 = calculateRoutineWindow({
    days: input.days,
    asOfDate: input.asOfDate,
    windowDays: 7,
    analysisDay,
  });
  const routine28 = calculateRoutineWindow({
    days: input.days,
    asOfDate: input.asOfDate,
    windowDays: 28,
    analysisDay,
  });
  const routine90 = calculateRoutineWindow({
    days: input.days,
    asOfDate: input.asOfDate,
    windowDays: 90,
    analysisDay,
  });
  const previousScore = Number.isFinite(input.previousPublishedScore)
    ? clamp(input.previousPublishedScore!)
    : null;
  const noDataStreak = consecutiveNoDataDays(input.days, input.asOfDate);
  const weightTrendBonus = calculateSafeWeightTrendBonus({
    weights: input.weights ?? [],
    asOfDate: input.asOfDate,
    targetWeightKg: input.targetWeightKg,
  });
  const dimensions = routine7.dimensions;
  const dimensionEntries = Object.entries(dimensions) as Array<
    [PulseDimension, number]
  >;
  const strongestDimension =
    [...dimensionEntries].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    "activity";
  const focusDimension =
    [...dimensionEntries].sort((left, right) => left[1] - right[1])[0]?.[0] ??
    "activity";
  const eligibleForFirstScore =
    previousScore !== null ||
    (analysisDay >= 8 && routine7.dataDays >= 4 && routine7.dimensionCount >= 3);
  const reasons: string[] = [];

  if (analysisDay <= 7) {
    reasons.push(
      `Health Pulse sedang mempelajari pola kebiasaanmu, hari ${analysisDay} dari 7.`,
    );
  } else if (!eligibleForFirstScore) {
    reasons.push(
      `Data belum cukup: tersedia ${routine7.dataDays} dari minimal 4 hari dan ${routine7.dimensionCount} dari minimal 3 dimensi.`,
    );
  }

  if (!eligibleForFirstScore) {
    return {
      published: false,
      score: null,
      rawScore: null,
      previousScore,
      change: 0,
      status: "foundation",
      phase: phaseInfo.phase,
      phaseCap: phaseInfo.cap,
      analysisDay,
      nextPhaseInDays: phaseInfo.nextPhaseInDays,
      routine7,
      routine28,
      routine90,
      weightTrendBonus,
      noDataStreak,
      strongestDimension,
      focusDimension,
      reasons,
    };
  }

  const windowRows = [
    [routine7.score, HEALTH_PULSE_WINDOW_WEIGHTS.routine7],
    [routine28.score, HEALTH_PULSE_WINDOW_WEIGHTS.routine28],
    [routine90.score, HEALTH_PULSE_WINDOW_WEIGHTS.routine90],
  ] as const;
  let windowWeight = 0;
  let windowTotal = 0;
  for (const [windowScore, weight] of windowRows) {
    if (windowScore === null) continue;
    windowWeight += weight;
    windowTotal += windowScore * weight;
  }
  const longTermRoutine = windowTotal / Math.max(windowWeight, 0.01);
  let rawScore = clamp(longTermRoutine + weightTrendBonus);

  const strongMasteryCoverage = routine28.dataDays >= 24;
  const strongNinetyDayConsistency = (routine90.score ?? 0) >= 95;
  const noPersistentlyLowDimension = (
    Object.values(routine90.dimensions) as number[]
  ).length === 4 &&
    (Object.values(routine90.dimensions) as number[]).every(
      (score) => score >= 80,
    );
  const canReachPeak =
    phaseInfo.phase === "MASTERY" &&
    strongMasteryCoverage &&
    strongNinetyDayConsistency &&
    noPersistentlyLowDimension;
  rawScore = Math.min(rawScore, phaseInfo.cap, canReachPeak ? 100 : 99.9);

  let score = rawScore;
  if (previousScore !== null) {
    if (noDataStreak > 0 && noDataStreak <= 3) {
      score = previousScore;
      reasons.push("Belum ada data baru; masa toleransi menjaga Pulse tetap stabil.");
    } else if (noDataStreak > 3) {
      const gradualDrop = Math.min(1.5, (noDataStreak - 3) * 0.5);
      score = Math.min(rawScore, previousScore - gradualDrop);
      reasons.push(
        `${noDataStreak} hari tanpa bukti kebiasaan; Pulse turun perlahan, bukan sekaligus.`,
      );
    }
    score = Math.min(previousScore + 1, Math.max(previousScore - 1.5, score));
  }
  score = rounded(clamp(score));
  const change = rounded(score - (previousScore ?? score));

  reasons.push(
    `Routine 7/28/90 hari: ${routine7.score ?? 0}/${routine28.score ?? 0}/${routine90.score ?? 0}.`,
  );
  reasons.push(
    `Kelengkapan data 7/28 hari: ${routine7.coverage}%/${routine28.coverage}%; kelengkapan adalah indikator kepercayaan, bukan poin.`,
  );
  if (weightTrendBonus > 0) {
    reasons.push(`Tren berat aman menuju target memberi bonus ${weightTrendBonus} poin.`);
  }

  return {
    published: true,
    score,
    rawScore: rounded(rawScore),
    previousScore,
    change,
    status: statusForHealthPulse(score),
    phase: phaseInfo.phase,
    phaseCap: phaseInfo.cap,
    analysisDay,
    nextPhaseInDays: phaseInfo.nextPhaseInDays,
    routine7,
    routine28,
    routine90,
    weightTrendBonus,
    noDataStreak,
    strongestDimension,
    focusDimension,
    reasons,
  };
}
