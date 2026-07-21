export type CompanionInsightType = 
  | "morning-brief"
  | "activity-reflection"
  | "nutrition-insight"
  | "recovery-insight"
  | "consistency-insight"
  | "journey-reflection"
  | "health-pulse-interpretation"
  | "challenge-guidance"
  | "weekly-letter"
  | "monthly-reflection"
  | "general-guidance"
  | "safety-reminder";

export type CompanionTone = 
  | "encouraging"
  | "calm"
  | "reflective"
  | "informative"
  | "celebratory"
  | "recovery-focused"
  | "cautious";

export type CompanionPriority = "low" | "normal" | "high" | "safety";

export type CompanionSurface = 
  | "home"
  | "journey"
  | "health-pulse"
  | "activity"
  | "nutrition"
  | "challenge"
  | "profile"
  | "companion";

export type CompanionInsightStatus = "active" | "read" | "dismissed" | "expired";

export interface CompanionSourceReference {
  readonly sourceType?: string;
  readonly sourceId?: string;
  readonly title?: string;
}

export type CompanionContextLimitation = 
  | "self-reported-hydration"
  | "simulated-health-pulse"
  | "simulated-companion";

export interface CompanionContextSummary {
  readonly travelerDisplayName: string;
  readonly journeyDay: number;
  readonly primaryGoal: string;
  readonly healthPulseScore: number;
  readonly healthPulseStatus: string;
  readonly healthPulseTrend: string;
  readonly strongestDimension: string;
  readonly focusDimension: string;
  readonly recentJourneyTitles: readonly string[];
  readonly recentActivitySummary: string;
  readonly nutritionSummary: string;
  readonly recoverySummary: string;
  readonly consistencyDays: number;
  readonly hydrationSummary: string;
  readonly activeChallengeSummary: string;
  readonly dataCompleteness: number;
  readonly limitations: readonly CompanionContextLimitation[];
  readonly generatedAt: string;
  readonly isMock: boolean;
}

export interface CompanionInsight {
  readonly id: string;
  readonly type: CompanionInsightType;
  readonly tone: CompanionTone;
  readonly priority: CompanionPriority;
  readonly surfaces: readonly CompanionSurface[];
  readonly title: string;
  readonly message: string;
  readonly shortMessage: string;
  readonly recommendedActionLabel?: string;
  readonly recommendedActionPath?: string;
  readonly sourceReference?: CompanionSourceReference;
  readonly status: CompanionInsightStatus;
  readonly occurredAt: string;
}

export interface CompanionWeeklyLetter {
  readonly id: string;
  readonly title: string;
  readonly greeting: string;
  readonly opening: string;
  readonly highlights: readonly string[];
  readonly growthArea: string;
  readonly nextWeekFocus: string;
  readonly closing: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly status: "active" | "archived";
  readonly isMock: boolean;
}
