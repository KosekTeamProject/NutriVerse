export const HEALTH_PULSE_DIMENSION_WEIGHTS = {
  nutrition: 0.25,
  activity: 0.25,
  sleep: 0.2,
  hydration: 0.2,
  weight: 0.1,
} as const;

export type PulseDimension = keyof typeof HEALTH_PULSE_DIMENSION_WEIGHTS;

export type PulseDimensionScores = Partial<Record<PulseDimension, number>>;

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, value));
}

function rounded(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function targetAttainmentScore(value: number, target: number) {
  if (!Number.isFinite(value) || !Number.isFinite(target) || target <= 0) {
    return 0;
  }
  return rounded(clamp((Math.max(0, value) / target) * 100));
}

/**
 * Scores recovery against the user's own sleep target. Reaching the target is
 * rewarded, while unusually long sleep does not keep increasing the score.
 * This is a wellness indicator, not a medical assessment.
 */
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

export function weightGoalScore(
  weightKg: number,
  targetWeightKg: number,
) {
  if (
    !Number.isFinite(weightKg) ||
    !Number.isFinite(targetWeightKg) ||
    weightKg <= 0 ||
    targetWeightKg <= 0
  ) {
    return 0;
  }
  return rounded(
    clamp(100 - (Math.abs(weightKg - targetWeightKg) / targetWeightKg) * 100),
  );
}

/**
 * Missing data is represented by `undefined`. It is not treated as a zero.
 * Low-completeness days are blended toward the previous reliable pulse (or a
 * neutral baseline) so one isolated input cannot make the pulse jump to 100.
 */
export function calculateHealthPulseScore(input: {
  scores: PulseDimensionScores;
  previousScore?: number;
  previousCompleteness?: number;
}) {
  let weightedTotal = 0;
  let availableWeight = 0;

  for (const dimension of Object.keys(
    HEALTH_PULSE_DIMENSION_WEIGHTS,
  ) as PulseDimension[]) {
    const score = input.scores[dimension];
    if (score === undefined || !Number.isFinite(score)) continue;
    const weight = HEALTH_PULSE_DIMENSION_WEIGHTS[dimension];
    weightedTotal += clamp(score) * weight;
    availableWeight += weight;
  }

  const completeness = Math.round(clamp(availableWeight * 100));
  if (availableWeight === 0) {
    return { overallScore: 0, rawScore: 0, completeness };
  }

  const rawScore = weightedTotal / availableWeight;
  const previousIsReliable =
    Number.isFinite(input.previousScore) &&
    (input.previousCompleteness ?? 0) > 0;
  const baseline = previousIsReliable ? clamp(input.previousScore!) : 50;
  const overallScore =
    rawScore * availableWeight + baseline * (1 - availableWeight);

  return {
    overallScore: rounded(overallScore),
    rawScore: rounded(rawScore),
    completeness,
  };
}
