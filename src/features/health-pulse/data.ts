import { HealthPulseSnapshot, HealthPulseHistoryPoint } from "./types";

export const currentSnapshot: HealthPulseSnapshot = {
  id: "health-pulse-current",
  travelerId: "Fathan",
  score: 78.0,
  previousScore: 76.8,
  change: 1.2,
  status: "flourishing",
  trend: "improving",
  strongestDimension: "activity",
  focusDimension: "sleep",
  dataCompleteness: 86,
  generatedAt: "2026-07-20T12:00:00Z",
  dimensions: [
    {
      dimension: "nutrition",
      score: 72,
      previousScore: 70,
      change: 2,
      trend: "improving",
      trust: "partially-verified",
      completeness: 78,
      summary: "Protein consistency improved across confirmed entries."
    },
    {
      dimension: "activity",
      score: 84,
      previousScore: 81,
      change: 3,
      trend: "improving",
      trust: "trusted",
      completeness: 92,
      summary: "Verified movement supported today’s progress."
    },
    {
      dimension: "sleep",
      score: 74,
      previousScore: 72,
      change: 2,
      trend: "improving",
      trust: "self-reported",
      completeness: 80,
      summary: "Quality sleep duration has increased."
    },
    {
      dimension: "hydration",
      score: 70,
      previousScore: 69,
      change: 1,
      trend: "stable",
      trust: "self-reported",
      completeness: 76,
      summary: "Water logging consistency is steady but has room to grow."
    },
    {
      dimension: "weight",
      score: 90,
      previousScore: 90,
      change: 0,
      trend: "stable",
      trust: "self-reported",
      completeness: 100,
      summary: "Weight metrics remain steady and secure."
    },
    {
      dimension: "consistency",
      score: 86,
      previousScore: 82,
      change: 4,
      trend: "improving",
      trust: "trusted",
      completeness: 90,
      summary: "Seven days of healthy actions are forming a stronger routine."
    }
  ],
  reasons: [
    "You completed a verified morning walk.",
    "Your seven-day consistency pattern supported today’s progress.",
    "Protein consistency improved compared with recent entries.",
    "Hydration data remains incomplete today.",
    "Recovery may benefit from a lighter pace."
  ],
  recommendedNextAction: "A light recovery walk may help balance today’s progress."
};

export const previousSnapshot: HealthPulseSnapshot = {
  id: "health-pulse-previous",
  travelerId: "Fathan",
  score: 76.8,
  previousScore: 76.5,
  change: 0.3,
  status: "flourishing",
  trend: "stable",
  strongestDimension: "activity",
  focusDimension: "sleep",
  dataCompleteness: 84,
  generatedAt: "2026-07-19T12:00:00Z",
  dimensions: [
    {
      dimension: "nutrition",
      score: 70,
      previousScore: 69,
      change: 1,
      trend: "stable",
      trust: "partially-verified",
      completeness: 75,
      summary: "Stable nutrition score."
    },
    {
      dimension: "activity",
      score: 81,
      previousScore: 81,
      change: 0,
      trend: "stable",
      trust: "trusted",
      completeness: 90,
      summary: "Movement was stable."
    },
    {
      dimension: "sleep",
      score: 72,
      previousScore: 72,
      change: 0,
      trend: "stable",
      trust: "self-reported",
      completeness: 78,
      summary: "Stable sleep scores."
    },
    {
      dimension: "hydration",
      score: 69,
      previousScore: 68,
      change: 1,
      trend: "stable",
      trust: "self-reported",
      completeness: 74,
      summary: "Hydration logging is steady."
    },
    {
      dimension: "weight",
      score: 90,
      previousScore: 90,
      change: 0,
      trend: "stable",
      trust: "self-reported",
      completeness: 100,
      summary: "Weight is stable."
    },
    {
      dimension: "consistency",
      score: 82,
      previousScore: 80,
      change: 2,
      trend: "improving",
      trust: "trusted",
      completeness: 85,
      summary: "Consistency is improving."
    }
  ],
  reasons: [
    "Stable general progress entries logged yesterday."
  ],
  recommendedNextAction: "Maintain your active consistency rhythm."
};

export const historyPoints: HealthPulseHistoryPoint[] = [
  { date: "07-07", score: 72.0 },
  { date: "07-08", score: 72.5 },
  { date: "07-09", score: 73.0 },
  { date: "07-10", score: 72.8 },
  { date: "07-11", score: 73.5 },
  { date: "07-12", score: 74.0 },
  { date: "07-13", score: 74.8 },
  { date: "07-14", score: 75.0 },
  { date: "07-15", score: 75.2 },
  { date: "07-16", score: 75.8 },
  { date: "07-17", score: 76.0 },
  { date: "07-18", score: 76.5 },
  { date: "07-19", score: 76.8 },
  { date: "07-20", score: 78.0 }
];
