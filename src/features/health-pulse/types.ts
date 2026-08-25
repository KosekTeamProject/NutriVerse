export type HealthDimension = "nutrition" | "activity" | "sleep" | "hydration" | "weight" | "consistency";

export type HealthPulseStatus = "foundation" | "growing" | "consistent" | "very-consistent" | "peak-balance";

export type HealthPulsePhase = "LEARNING" | "FOUNDATION" | "GROWTH" | "SUSTAINED" | "MASTERY";

export type HealthPulseTrend = "improving" | "stable" | "recovering" | "needs-attention";

export type HealthDataTrustLevel = "trusted" | "partially-verified" | "self-reported" | "simulated" | "missing";
export type HealthPulseDataConfidence = "very-low" | "low" | "fair" | "complete";

export interface HealthPulseChecklistItem {
  readonly id: "nutrition" | "activity" | "sleep" | "hydration";
  readonly label: string;
  readonly detail: string;
  readonly completed: boolean;
  readonly actionHref: string;
  readonly actionLabel: string;
}

export interface HealthPulseUnlockGuide {
  readonly isUnlocked: boolean;
  readonly scoreThroughDate: string;
  readonly evaluatedDays: number;
  readonly standardDaysRequired: 7;
  readonly consecutiveCompleteDays: number;
  readonly projectedCompleteDays: number;
  readonly fastTrackDaysRequired: 4;
  readonly todayCompleted: number;
  readonly todayTotal: 4;
  readonly todayIsComplete: boolean;
  readonly dataConfidence: HealthPulseDataConfidence;
  readonly confidenceCap: number;
  readonly message: string;
  readonly checklist: readonly HealthPulseChecklistItem[];
}

export interface HealthDimensionScore {
  readonly dimension: HealthDimension;
  readonly score: number;
  readonly previousScore: number;
  readonly change: number;
  readonly trend: HealthPulseTrend;
  readonly trust: HealthDataTrustLevel;
  readonly completeness: number;
  readonly summary: string;
}

export interface HealthPulseSnapshot {
  readonly id: string;
  readonly travelerId: string;
  readonly score: number | null;
  readonly previousScore: number | null;
  readonly change: number;
  readonly status: HealthPulseStatus;
  readonly trend: HealthPulseTrend;
  readonly strongestDimension: HealthDimension;
  readonly focusDimension: HealthDimension;
  readonly dataCompleteness: number;
  readonly dataCoverage7: number;
  readonly dataCoverage28: number;
  readonly phase: HealthPulsePhase;
  readonly phaseCap: number;
  readonly analysisDay: number;
  readonly nextPhaseInDays: number | null;
  readonly routineScore7: number | null;
  readonly routineScore28: number | null;
  readonly routineScore90: number | null;
  readonly isPublished: boolean;
  readonly learningMessage: string | null;
  readonly unlockGuide?: HealthPulseUnlockGuide;
  readonly generatedAt: string;
  readonly dimensions: readonly HealthDimensionScore[];
  readonly reasons: readonly string[];
  readonly recommendedNextAction: string;
}

export interface HealthPulseHistoryPoint {
  readonly date: string;
  readonly score: number;
}
