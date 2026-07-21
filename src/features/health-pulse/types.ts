export type HealthDimension = "nutrition" | "activity" | "sleep" | "hydration" | "weight" | "consistency";

export type HealthPulseStatus = "seed" | "growing" | "balanced" | "flourishing" | "thrive";

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
  readonly score: number;
  readonly previousScore: number;
  readonly change: number;
  readonly status: HealthPulseStatus;
  readonly trend: HealthPulseTrend;
  readonly strongestDimension: HealthDimension;
  readonly focusDimension: HealthDimension;
  readonly dataCompleteness: number;
  readonly generatedAt: string;
  readonly dimensions: readonly HealthDimensionScore[];
  readonly reasons: readonly string[];
  readonly recommendedNextAction: string;
}

export interface HealthPulseHistoryPoint {
  readonly date: string;
  readonly score: number;
}
