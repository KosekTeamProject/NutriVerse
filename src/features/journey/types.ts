export type JourneyVisibility = "private" | "circle" | "public";

export type JourneyCategory = 
  | "activity" 
  | "nutrition" 
  | "recovery" 
  | "consistency" 
  | "challenge" 
  | "health-pulse" 
  | "reflection" 
  | "lifestyle";

export type JourneyTrustLevel = 
  | "verified" 
  | "partially-verified" 
  | "self-reported" 
  | "simulated" 
  | "unverified";

export interface JourneyMetric {
  readonly label: string;
  readonly value: string;
}

export interface JourneyRecord {
  readonly id: string;
  readonly travelerId: string;
  readonly title: string;
  readonly summary: string;
  readonly meaning: string;
  readonly reflection?: string;
  readonly category: JourneyCategory;
  readonly occurredAt: string;
  readonly visibility: JourneyVisibility;
  readonly trustLevel: JourneyTrustLevel;
  readonly metrics: readonly JourneyMetric[];
  readonly healthPulseBefore?: number;
  readonly healthPulseAfter?: number;
  readonly healthPulseChange?: number;
  readonly sourceType?: string;
  readonly sourceId?: string;
  readonly shareEligible: boolean;
  readonly containsSimulatedData: boolean;
  readonly version: string;
}

export type HealthStoryFormat = "square" | "vertical";

export interface HealthStoryDisplayData {
  readonly title: string;
  readonly subtitle: string;
  readonly categoryLabel: string;
  readonly dateLabel: string;
  readonly primaryMetricLabel: string;
  readonly primaryMetricValue: string;
  readonly healthPulseBefore?: number;
  readonly healthPulseAfter?: number;
  readonly healthPulseChange?: number;
  readonly safeReflection?: string;
  readonly consistencyLabel: string;
  readonly travelerDisplayName: string;
  readonly visibility: JourneyVisibility;
  readonly shareEligible: boolean;
  readonly blockedReasons: readonly string[];
  readonly containsSimulatedData: boolean;
}

export interface HealthStoryEligibility {
  readonly eligible: boolean;
  readonly reasons: readonly string[];
}
