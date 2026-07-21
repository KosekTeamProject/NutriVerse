export type GoalPeriod = "daily" | "weekly" | "monthly" | "journey";

export type GoalCategory = 
  | "activity" 
  | "nutrition" 
  | "hydration" 
  | "recovery" 
  | "consistency" 
  | "lifestyle" 
  | "challenge";

export type GoalMetric = 
  | "distance-km" 
  | "duration-minutes" 
  | "activity-count" 
  | "protein-grams" 
  | "hydration-liters" 
  | "sleep-hours" 
  | "healthy-actions" 
  | "consistency-days" 
  | "challenge-progress" 
  | "boolean-confirmation";

export type GoalTrustLevel = "verified" | "partially-verified" | "self-reported" | "simulated" | "missing";

export type GoalStatus = "not-started" | "in-progress" | "completed" | "still-growing" | "paused" | "unavailable";

export type GoalSourceType = 
  | "activity" 
  | "food-entry" 
  | "hydration-log" 
  | "recovery-log" 
  | "habit-log" 
  | "challenge" 
  | "streak" 
  | "system" 
  | "manual-confirmation";

export type GoalPrivacy = "private" | "circle" | "public";

export interface GoalRewardPreview {
  readonly progressXp: number;
  readonly hp: number;
  readonly eligible: boolean;
  readonly explanation: string;
  readonly milestoneLabel?: string;
}

export interface BehaviorGoal {
  readonly id: string;
  readonly travelerId: string;
  readonly title: string;
  readonly description: string;
  readonly period: GoalPeriod;
  readonly category: GoalCategory;
  readonly metric: GoalMetric;
  readonly targetValue: number;
  readonly currentValue: number;
  readonly unit: string;
  readonly progressPercent: number;
  readonly status: GoalStatus;
  readonly trustLevel: GoalTrustLevel;
  readonly sourceType: GoalSourceType;
  readonly sourceId?: string;
  readonly privacy: GoalPrivacy;
  readonly rewardPreview?: GoalRewardPreview;
  readonly explanation: string;
  readonly actionLabel?: string;
  readonly actionHref?: string;
  readonly isOptional: boolean;
  readonly isMock: boolean;
  readonly version: string;
}

export type TodayJourneyStatus = "not-started" | "in-progress" | "completed" | "still-growing" | "unavailable";

export interface BehaviorNextAction {
  readonly label: string;
  readonly href: string;
  readonly reason: string;
}

export type HealthyDayStatus = "forming" | "achieved" | "recovery-day" | "incomplete-data";

export interface HealthyDaySummary {
  readonly status: HealthyDayStatus;
  readonly meaningfulActionCount: number;
  readonly minimumActionCount: number;
  readonly contributingGoalIds: readonly string[];
  readonly recoveryQualified: boolean;
  readonly dataCompleteness: number;
  readonly explanation: string;
  readonly achievedAt?: string;
  readonly isMock: boolean;
}

export type StreakStatus = "active" | "protected" | "paused" | "forming";

export interface StreakSummary {
  readonly currentDays: number;
  readonly longestDays: number;
  readonly status: StreakStatus;
  readonly lastQualifiedDate: string;
  readonly freezeAvailable: boolean;
  readonly freezeUsed: boolean;
  readonly recoveryProtected: boolean;
  readonly explanation: string;
  readonly isMock: boolean;
}

export interface ChallengeSummary {
  readonly id: string;
  readonly title: string;
  readonly category: GoalCategory;
  readonly targetValue: number;
  readonly currentValue: number;
  readonly unit: string;
  readonly progressPercent: number;
  readonly status: string;
  readonly explanation: string;
  readonly actionLabel?: string;
  readonly actionHref?: string;
}

export interface TodayJourney {
  readonly id: string;
  readonly travelerId: string;
  readonly date: string;
  readonly title: string;
  readonly summary: string;
  readonly progressPercent: number;
  readonly status: TodayJourneyStatus;
  readonly goals: readonly BehaviorGoal[];
  readonly completedGoalCount: number;
  readonly totalGoalCount: number;
  readonly healthyDay: HealthyDaySummary;
  readonly streak: StreakSummary;
  readonly challengeSummary: ChallengeSummary;
  readonly rewardPreview: GoalRewardPreview;
  readonly nextAction: BehaviorNextAction;
  readonly generatedAt: string;
  readonly isMock: boolean;
  readonly version: string;
}

export interface HealthyDayHistoryPoint {
  readonly date: string;
  readonly status: HealthyDayStatus;
  readonly meaningfulActionCount: number;
  readonly dataCompleteness: number;
  readonly recoveryProtected: boolean;
  readonly explanation: string;
}
