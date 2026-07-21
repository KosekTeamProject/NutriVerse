import { CompanionContextSummary, CompanionInsight, CompanionWeeklyLetter } from "./types";

export const companionContext: CompanionContextSummary = {
  travelerDisplayName: "Fathan",
  journeyDay: 148,
  primaryGoal: "Morning Walk",
  healthPulseScore: 78.0,
  healthPulseStatus: "Flourishing",
  healthPulseTrend: "Improving",
  strongestDimension: "Consistency",
  focusDimension: "Recovery",
  recentJourneyTitles: ["Morning Walk"],
  recentActivitySummary: "Morning Walk, 1.4 km, verified",
  nutritionSummary: "Protein progress improving",
  recoverySummary: "Light recovery completed",
  consistencyDays: 7,
  hydrationSummary: "1.1 / 2.0 L, self-reported",
  activeChallengeSummary: "Light Cardio Journey, 7.2 / 10 km",
  dataCompleteness: 86,
  limitations: [
    "self-reported-hydration",
    "simulated-health-pulse",
    "simulated-companion"
  ],
  generatedAt: "2026-07-20T12:00:00Z",
  isMock: true
};

export const companionInsights: readonly CompanionInsight[] = [
  {
    id: "companion-morning-brief",
    type: "morning-brief",
    tone: "encouraging",
    priority: "normal",
    surfaces: ["home", "companion"],
    title: "A focused start for today’s Journey",
    message: "Your Health Pulse has been improving gradually. A light morning walk and a balanced breakfast would have the greatest impact on today’s Journey.",
    shortMessage: "A light morning walk and a balanced breakfast are the strongest next steps today.",
    recommendedActionLabel: "Lanjutkan Journey",
    recommendedActionPath: "/aktivitas",
    status: "active",
    occurredAt: "2026-07-20T07:00:00Z"
  },
  {
    id: "companion-activity-reflection",
    type: "activity-reflection",
    tone: "reflective",
    priority: "normal",
    surfaces: ["activity", "companion"],
    title: "Consistency mattered today",
    message: "You completed a verified morning walk even with a busy schedule. Consistency like this often matters more than occasional intense activity.",
    shortMessage: "The important part was continuing on an ordinary day.",
    recommendedActionLabel: "View Activity",
    recommendedActionPath: "/aktivitas",
    sourceReference: {
      sourceType: "activity",
      sourceId: "journey-morning-walk",
      title: "Morning Walk"
    },
    status: "active",
    occurredAt: "2026-07-20T07:15:00Z"
  },
  {
    id: "companion-nutrition-insight",
    type: "nutrition-insight",
    tone: "informative",
    priority: "normal",
    surfaces: ["nutrition", "home", "companion"],
    title: "Protein progress is improving",
    message: "Your protein pattern improved today. Hydration data is still incomplete, so today’s nutrition picture may not be complete yet.",
    shortMessage: "Protein progress improved, while hydration data remains incomplete.",
    status: "active",
    occurredAt: "2026-07-20T08:30:00Z"
  },
  {
    id: "companion-recovery-insight",
    type: "recovery-insight",
    tone: "recovery-focused",
    priority: "normal",
    surfaces: ["health-pulse", "home", "companion"],
    title: "Recovery remains the clearest focus",
    message: "Your recovery pattern appears slightly better than yesterday. A lighter activity today may help maintain balance.",
    shortMessage: "A lighter pace may help maintain balance.",
    status: "active",
    occurredAt: "2026-07-20T10:15:00Z"
  },
  {
    id: "companion-consistency-insight",
    type: "consistency-insight",
    tone: "celebratory",
    priority: "normal",
    surfaces: ["journey", "home", "companion"],
    title: "Seven days are becoming a routine",
    message: "Seven days of healthy actions are beginning to form a stronger routine.",
    shortMessage: "Consistency is becoming part of your Journey.",
    recommendedActionLabel: "View Timeline",
    recommendedActionPath: "/journey",
    status: "active",
    occurredAt: "2026-07-19T20:00:00Z"
  },
  {
    id: "companion-journey-reflection",
    type: "journey-reflection",
    tone: "reflective",
    priority: "normal",
    surfaces: ["journey", "companion"],
    title: "This Journey is more than one activity",
    message: "This Journey reflects more than one completed activity. It shows that you continued even on an ordinary day.",
    shortMessage: "The meaning is in continuing, not only in the metric.",
    sourceReference: {
      sourceType: "journey",
      sourceId: "journey-morning-walk",
      title: "Morning Walk"
    },
    status: "active",
    occurredAt: "2026-07-20T12:30:00Z"
  },
  {
    id: "companion-health-pulse-interpretation",
    type: "health-pulse-interpretation",
    tone: "informative",
    priority: "normal",
    surfaces: ["health-pulse", "companion"],
    title: "Activity and consistency supported today’s Pulse",
    message: "Your Health Pulse improved by 1.2 points, supported mostly by activity and consistency. Recovery remains the best area to focus on next.",
    shortMessage: "Health Pulse improved by 1.2, with Recovery as the next focus area.",
    status: "active",
    occurredAt: "2026-07-20T12:00:00Z"
  },
  {
    id: "companion-challenge-guidance",
    type: "challenge-guidance",
    tone: "encouraging",
    priority: "normal",
    surfaces: ["challenge", "companion"],
    title: "Your challenge is already over halfway complete",
    message: "Your Light Cardio Journey is at 7.2 of 10 kilometers. Another short walk can support progress without requiring intense effort.",
    shortMessage: "Another short walk can support progress without requiring intense effort.",
    recommendedActionLabel: "View Challenge",
    recommendedActionPath: "/challenge",
    status: "active",
    occurredAt: "2026-07-19T16:30:00Z"
  },
  {
    id: "companion-safety-reminder",
    type: "safety-reminder",
    tone: "cautious",
    priority: "safety",
    surfaces: ["activity", "companion"],
    title: "Progress should never come before safety",
    message: "If you feel pain, dizziness, or unusual discomfort during activity, stop and seek appropriate help. Progress should never come before safety.",
    shortMessage: "Stop activity if you feel unusual discomfort and seek appropriate help.",
    status: "active",
    occurredAt: "2026-07-20T06:00:00Z"
  },
  {
    id: "companion-general-guidance",
    type: "general-guidance",
    tone: "calm",
    priority: "low",
    surfaces: ["companion", "profile"],
    title: "Small actions are enough to continue",
    message: "You do not need a perfect day to continue your Journey. One realistic healthy action can still matter.",
    shortMessage: "One realistic healthy action can still matter.",
    status: "active",
    occurredAt: "2026-07-18T12:00:00Z"
  }
];

export const currentWeeklyLetter: CompanionWeeklyLetter = {
  id: "weekly-letter-current",
  title: "Your Weekly Letter",
  greeting: "Hello Fathan,",
  opening: "This week showed steady progress rather than extreme changes.",
  highlights: [
    "Verified morning walks supported your activity pattern.",
    "Protein consistency improved across confirmed entries.",
    "Seven days of healthy actions are becoming a stronger routine."
  ],
  growthArea: "Recovery and hydration completeness remain the clearest areas to improve.",
  nextWeekFocus: "Choose one light activity and one hydration action that remain realistic on busy days.",
  closing: "Small actions are becoming part of your identity. Let’s continue next week.",
  periodStart: "2026-07-13T00:00:00Z",
  periodEnd: "2026-07-19T23:59:59Z",
  status: "active",
  isMock: true
};
