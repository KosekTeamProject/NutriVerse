import type { HealthPulseHistoryPoint, HealthPulseSnapshot } from "@/features/health-pulse/types";
import type { HealthyDayHistoryPoint, TodayJourney } from "@/features/behavior/types";

export type ProgressMetric = {
  value: number;
  target: number;
  percent: number;
  unit: string;
};

export type ProgressChallenge = {
  id: string;
  title: string;
  description: string;
  type: "DAILY" | "WEEKLY" | "MONTHLY" | "EVENT";
  category: string;
  trustLevel: "GPS_VERIFIED_ONLY" | "HABIT_SELF_REPORT";
  metric: "DISTANCE_METERS" | "DURATION_SECONDS" | "VERIFIED_ACTIVITY_COUNT";
  activityType: string | null;
  currentValue: number;
  targetValue: number;
  unit: string;
  progressPercent: number;
  isCompleted: boolean;
  isJoined: boolean;
  isRewardClaimed: boolean;
  bonusXp: number;
  bonusHp: number;
  startDate: string;
  endDate: string;
};

export type ProgressOverview = {
  generatedAt: string;
  timezone: string;
  date: string;
  identity: {
    id: string;
    name: string;
  };
  economy: {
    totalXp: number;
    currentHp: number;
    hpDebt: number;
    currentTier: string;
    streakDays: number;
    xpToday: number;
    hpToday: number;
  };
  daily: {
    steps: ProgressMetric;
    water: ProgressMetric;
    activeMinutes: ProgressMetric;
    walkingDistance: ProgressMetric;
    calories: ProgressMetric;
    protein: ProgressMetric;
    carbs: ProgressMetric;
    fiber: ProgressMetric;
    sleep: ProgressMetric;
  };
  healthPulse: {
    current: HealthPulseSnapshot;
    previous: HealthPulseSnapshot;
    history: HealthPulseHistoryPoint[];
  };
  todayJourney: TodayJourney;
  healthyDays: {
    history: HealthyDayHistoryPoint[];
    achievedDays: number;
    recoveryDays: number;
    averageCompleteness: number;
    longestStreak: number;
  };
  challenges: ProgressChallenge[];
  profile: {
    verifiedActivityCount: number;
    totalDistanceKm: number;
    healthyDaysThisWeek: number;
  };
};

export type CommunityOverview = {
  generatedAt: string;
  statistics: {
    activeMembers: number;
    weeklySteps: number;
    activeEvents: number;
    averageStreak: number;
    averageSteps: number;
    targetCompletionPercent: number;
  };
  events: Array<{
    id: string;
    title: string;
    description: string;
    location: string | null;
    startDate: string;
    endDate: string;
    capacity: number;
    participants: number;
    isJoined: boolean;
    bonusXp: number;
    bonusHp: number;
    bannerUrl: string;
  }>;
  challenge: {
    id: string;
    title: string;
    currentValue: number;
    targetValue: number;
    unit: string;
    progressPercent: number;
    participants: number;
    isJoined: boolean;
  } | null;
  guilds: Array<{
    id: string;
    name: string;
    members: number;
  }>;
};
