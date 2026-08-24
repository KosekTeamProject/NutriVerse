export type HealthDimension = "nutrition" | "activity" | "sleep" | "hydration" | "weight" | "consistency";

export type HealthPulseStatus = "foundation" | "growing" | "consistent" | "very-consistent" | "peak-balance";

export type HealthPulsePhase = "LEARNING" | "FOUNDATION" | "GROWTH" | "SUSTAINED" | "MASTERY";

export type HealthPulseTrend = "improving" | "stable" | "recovering" | "needs-attention";

export type HealthDataTrustLevel = "trusted" | "partially-verified" | "self-reported" | "simulated" | "missing";

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
  readonly generatedAt: string;
  readonly dimensions: readonly HealthDimensionScore[];
  readonly reasons: readonly string[];
  readonly recommendedNextAction: string;
}

export interface HealthPulseHistoryPoint {
  readonly date: string;
  readonly score: number;
}
