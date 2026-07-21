import { TodayJourney, BehaviorGoal, HealthyDayHistoryPoint } from "./types";

export const dailyGoals: readonly BehaviorGoal[] = [
  {
    id: "goal-morning-walk",
    travelerId: "Fathan",
    title: "Morning Walk",
    description: "Build gentle activity through a realistic walking target.",
    period: "daily",
    category: "activity",
    metric: "distance-km",
    targetValue: 2.0,
    currentValue: 1.4,
    unit: "km",
    progressPercent: 70,
    status: "in-progress",
    trustLevel: "verified",
    sourceType: "activity",
    sourceId: "journey-morning-walk",
    privacy: "public",
    explanation: "Progress is based on a verified walking session.",
    actionLabel: "Continue Activity",
    actionHref: "/aktivitas",
    isOptional: false,
    isMock: true,
    version: "1.0.0"
  },
  {
    id: "goal-protein-progress",
    travelerId: "Fathan",
    title: "Protein Progress",
    description: "Build a more consistent daily protein pattern.",
    period: "daily",
    category: "nutrition",
    metric: "protein-grams",
    targetValue: 80,
    currentValue: 56,
    unit: "g",
    progressPercent: 70,
    status: "in-progress",
    trustLevel: "partially-verified",
    sourceType: "food-entry",
    privacy: "private",
    explanation: "Protein progress is based on confirmed food entries.",
    actionLabel: "Log Protein",
    actionHref: "/scan",
    isOptional: false,
    isMock: true,
    version: "1.0.0"
  },
  {
    id: "goal-hydration",
    travelerId: "Fathan",
    title: "Hydration",
    description: "Support everyday wellness with a realistic hydration target.",
    period: "daily",
    category: "hydration",
    metric: "hydration-liters",
    targetValue: 2.0,
    currentValue: 1.1,
    unit: "L",
    progressPercent: 55,
    status: "still-growing",
    trustLevel: "self-reported",
    sourceType: "hydration-log",
    privacy: "private",
    explanation: "Hydration is self-reported and used as supportive wellness data.",
    isOptional: false,
    isMock: true,
    version: "1.0.0"
  },
  {
    id: "goal-light-recovery",
    travelerId: "Fathan",
    title: "Light Recovery",
    description: "Support balance through a short recovery-focused action.",
    period: "daily",
    category: "recovery",
    metric: "duration-minutes",
    targetValue: 15,
    currentValue: 15,
    unit: "min",
    progressPercent: 100,
    status: "completed",
    trustLevel: "self-reported",
    sourceType: "recovery-log",
    privacy: "private",
    explanation: "A light recovery session supports balance without requiring intense activity.",
    isOptional: false,
    isMock: true,
    version: "1.0.0"
  }
];

export const todayJourney: TodayJourney = {
  id: "today-journey-current",
  travelerId: "Fathan",
  date: "2026-07-20",
  title: "Today’s Journey",
  summary: "A focused set of healthy actions shaping today’s progress.",
  progressPercent: 64,
  status: "in-progress",
  goals: dailyGoals,
  completedGoalCount: 1,
  totalGoalCount: 4,
  healthyDay: {
    status: "forming",
    meaningfulActionCount: 2,
    minimumActionCount: 3,
    contributingGoalIds: ["goal-morning-walk", "goal-light-recovery"],
    recoveryQualified: true,
    dataCompleteness: 82,
    explanation: "Today is still forming. Your verified walk and recovery activity are already contributing meaningful progress.",
    isMock: true
  },
  streak: {
    currentDays: 7,
    longestDays: 14,
    status: "active",
    lastQualifiedDate: "2026-07-19",
    freezeAvailable: true,
    freezeUsed: false,
    recoveryProtected: true,
    explanation: "Seven consecutive days include activity, nutrition, or recovery-focused progress.",
    isMock: true
  },
  challengeSummary: {
    id: "challenge-light-cardio",
    title: "Light Cardio Journey",
    category: "activity",
    targetValue: 10,
    currentValue: 7.2,
    unit: "km",
    progressPercent: 72,
    status: "in-progress",
    explanation: "Only trusted walking or running activity contributes to this challenge.",
    actionLabel: "Lihat Challenge",
    actionHref: "/challenge/challenge-light-cardio"
  },
  rewardPreview: {
    progressXp: 180,
    hp: 60,
    eligible: true,
    explanation: "Rewards are previews and will only be granted after verified server-side completion.",
    milestoneLabel: "Healthy Day Progress"
  },
  nextAction: {
    label: "Lanjutkan Journey",
    href: "/aktivitas",
    reason: "The Morning Walk remains the most relevant verified action in progress."
  },
  generatedAt: "2026-07-20T12:00:00Z",
  isMock: true,
  version: "1.0.0"
};

// Exactly 28 points: 16 achieved, 5 recovery-day, 4 forming (inclusive of today/recent days), 3 incomplete-data.
// Date range: 2026-06-22 to 2026-07-19
export const healthyDayHistory: readonly HealthyDayHistoryPoint[] = [
  {
    date: "2026-06-22",
    status: "achieved",
    meaningfulActionCount: 3,
    dataCompleteness: 100,
    recoveryProtected: false,
    explanation: "Completed walk, nutrition, and water log."
  },
  {
    date: "2026-06-23",
    status: "achieved",
    meaningfulActionCount: 4,
    dataCompleteness: 100,
    recoveryProtected: false,
    explanation: "Excellent consistency across all daily targets."
  },
  {
    date: "2026-06-24",
    status: "recovery-day",
    meaningfulActionCount: 2,
    dataCompleteness: 90,
    recoveryProtected: true,
    explanation: "Prioritized resting parameters and dynamic stretching."
  },
  {
    date: "2026-06-25",
    status: "achieved",
    meaningfulActionCount: 3,
    dataCompleteness: 95,
    recoveryProtected: false,
    explanation: "Active morning walk and completed proteins."
  },
  {
    date: "2026-06-26",
    status: "incomplete-data",
    meaningfulActionCount: 1,
    dataCompleteness: 48,
    recoveryProtected: false,
    explanation: "Only walking was logged due to system sync issue."
  },
  {
    date: "2026-06-27",
    status: "achieved",
    meaningfulActionCount: 3,
    dataCompleteness: 100,
    recoveryProtected: false,
    explanation: "Weekend activity and hydration patterns met."
  },
  {
    date: "2026-06-28",
    status: "achieved",
    meaningfulActionCount: 3,
    dataCompleteness: 92,
    recoveryProtected: false,
    explanation: "Maintained walking and recovery routines."
  },
  {
    date: "2026-06-29",
    status: "recovery-day",
    meaningfulActionCount: 2,
    dataCompleteness: 88,
    recoveryProtected: true,
    explanation: "Rest and stretching targets fully achieved."
  },
  {
    date: "2026-06-30",
    status: "achieved",
    meaningfulActionCount: 4,
    dataCompleteness: 100,
    recoveryProtected: false,
    explanation: "Strong monthly close with balanced contributions."
  },
  {
    date: "2026-07-01",
    status: "achieved",
    meaningfulActionCount: 3,
    dataCompleteness: 95,
    recoveryProtected: false,
    explanation: "Started the cycle with walk and nutrition target."
  },
  {
    date: "2026-07-02",
    status: "incomplete-data",
    meaningfulActionCount: 1,
    dataCompleteness: 52,
    recoveryProtected: false,
    explanation: "Partial entries logged. Hydration details missing."
  },
  {
    date: "2026-07-03",
    status: "achieved",
    meaningfulActionCount: 3,
    dataCompleteness: 90,
    recoveryProtected: false,
    explanation: "Active walk and protein logs confirmed."
  },
  {
    date: "2026-07-04",
    status: "achieved",
    meaningfulActionCount: 4,
    dataCompleteness: 100,
    recoveryProtected: false,
    explanation: "Perfect weekend tracking pattern."
  },
  {
    date: "2026-07-05",
    status: "recovery-day",
    meaningfulActionCount: 2,
    dataCompleteness: 85,
    recoveryProtected: true,
    explanation: "Rest day with guided meditation and sleep focus."
  },
  {
    date: "2026-07-06",
    status: "achieved",
    meaningfulActionCount: 3,
    dataCompleteness: 90,
    recoveryProtected: false,
    explanation: "Monday walking routines resumed."
  },
  {
    date: "2026-07-07",
    status: "achieved",
    meaningfulActionCount: 3,
    dataCompleteness: 95,
    recoveryProtected: false,
    explanation: "Steady protein and recovery pacing."
  },
  {
    date: "2026-07-08",
    status: "achieved",
    meaningfulActionCount: 3,
    dataCompleteness: 100,
    recoveryProtected: false,
    explanation: "Met walk and hydration targets."
  },
  {
    date: "2026-07-09",
    status: "recovery-day",
    meaningfulActionCount: 2,
    dataCompleteness: 80,
    recoveryProtected: true,
    explanation: "Dynamic stretching program logged."
  },
  {
    date: "2026-07-10",
    status: "achieved",
    meaningfulActionCount: 4,
    dataCompleteness: 98,
    recoveryProtected: false,
    explanation: "Full consistency across all dimensions."
  },
  {
    date: "2026-07-11",
    status: "incomplete-data",
    meaningfulActionCount: 1,
    dataCompleteness: 40,
    recoveryProtected: false,
    explanation: "Travel day. Limited logs registered."
  },
  {
    date: "2026-07-12",
    status: "achieved",
    meaningfulActionCount: 3,
    dataCompleteness: 90,
    recoveryProtected: false,
    explanation: "Resumed tracking with walk and recovery."
  },
  {
    date: "2026-07-13",
    status: "achieved",
    meaningfulActionCount: 3,
    dataCompleteness: 95,
    recoveryProtected: false,
    explanation: "Consistency logs were successful."
  },
  {
    date: "2026-07-14",
    status: "achieved",
    meaningfulActionCount: 3,
    dataCompleteness: 92,
    recoveryProtected: false,
    explanation: "Protein and walking targets met."
  },
  {
    date: "2026-07-15",
    status: "recovery-day",
    meaningfulActionCount: 2,
    dataCompleteness: 88,
    recoveryProtected: true,
    explanation: "Guided stretch session completed."
  },
  {
    date: "2026-07-16",
    status: "achieved",
    meaningfulActionCount: 3,
    dataCompleteness: 100,
    recoveryProtected: false,
    explanation: "Active walk and hydration targets verified."
  },
  {
    date: "2026-07-17",
    status: "forming",
    meaningfulActionCount: 2,
    dataCompleteness: 85,
    recoveryProtected: false,
    explanation: "Still forming. Recovery and protein logs complete."
  },
  {
    date: "2026-07-18",
    status: "forming",
    meaningfulActionCount: 2,
    dataCompleteness: 82,
    recoveryProtected: false,
    explanation: "Still forming. Walking targets verified."
  },
  {
    date: "2026-07-19",
    status: "forming",
    meaningfulActionCount: 1,
    dataCompleteness: 60,
    recoveryProtected: false,
    explanation: "Still forming. Sunday stretch target completed."
  }
];
export const historyStats = {
  achievedCount: 16,
  recoveryCount: 5,
  formingCount: 4,
  incompleteCount: 3,
  averageCompleteness: 86
};
