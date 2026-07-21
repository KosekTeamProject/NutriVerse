import { JourneyRecord } from "./types";

export const journeyRecords: readonly JourneyRecord[] = [
  {
    id: "journey-morning-walk",
    travelerId: "Fathan",
    title: "Morning Walk",
    summary: "A verified morning walk that strengthened today’s consistency.",
    meaning: "The important part was continuing on an ordinary day.",
    reflection: "Small actions are becoming part of the Journey.",
    category: "activity",
    occurredAt: "2026-07-20T07:00:00Z",
    visibility: "public",
    trustLevel: "verified",
    metrics: [
      { label: "Distance", value: "1.4 km" },
      { label: "Active Time", value: "20 min" },
      { label: "Consistency", value: "Day 7" }
    ],
    healthPulseBefore: 76.8,
    healthPulseAfter: 78.0,
    healthPulseChange: 1.2,
    sourceType: "gps",
    sourceId: "act-101",
    shareEligible: true,
    containsSimulatedData: true,
    version: "1.0.0"
  },
  {
    id: "journey-protein-progress",
    travelerId: "Fathan",
    title: "Protein Progress",
    summary: "Met a major portion of today's target through balanced meal intake.",
    meaning: "Fuels recovery and lean body mass consistency.",
    reflection: "Focusing on dense protein options during breakfast.",
    category: "nutrition",
    occurredAt: "2026-07-20T08:15:00Z",
    visibility: "circle",
    trustLevel: "partially-verified",
    metrics: [
      { label: "Protein Logged", value: "56 g" },
      { label: "Daily Goal", value: "80 g" }
    ],
    shareEligible: false,
    containsSimulatedData: false,
    version: "1.0.0"
  },
  {
    id: "journey-light-recovery",
    travelerId: "Fathan",
    title: "Light Recovery",
    summary: "Completed a light dynamic stretching routine to relieve muscle tightness.",
    meaning: "Honoring the rest cycle to sustain daily consistency.",
    reflection: "Hamstrings feel less tight. Hydrating properly post-stretching.",
    category: "recovery",
    occurredAt: "2026-07-20T10:00:00Z",
    visibility: "private",
    trustLevel: "self-reported",
    metrics: [
      { label: "Stretching", value: "15 min" },
      { label: "Intensity", value: "Low" }
    ],
    shareEligible: false,
    containsSimulatedData: false,
    version: "1.0.0"
  },
  {
    id: "journey-seven-day-consistency",
    travelerId: "Fathan",
    title: "Seven-Day Consistency",
    summary: "Maintained active health contributions for 7 consecutive days.",
    meaning: "Habits are formed by daily decisions, not sporadic efforts.",
    reflection: "Feels great to reach a week of unbroken tracking.",
    category: "consistency",
    occurredAt: "2026-07-19T20:00:00Z",
    visibility: "circle",
    trustLevel: "verified",
    metrics: [
      { label: "Streak Index", value: "7 days" },
      { label: "Active Days", value: "7 / 7" }
    ],
    shareEligible: false,
    containsSimulatedData: false,
    version: "1.0.0"
  },
  {
    id: "journey-cardio-challenge-progress",
    travelerId: "Fathan",
    title: "Light Cardio Journey Progress",
    summary: "Logged verified progress towards the seasonal cardio milestone.",
    meaning: "Accumulated movement compounds into cardiovascular stamina.",
    category: "challenge",
    occurredAt: "2026-07-19T16:30:00Z",
    visibility: "public",
    trustLevel: "verified",
    metrics: [
      { label: "Challenge Segment", value: "1.4 km" },
      { label: "Accumulated Distance", value: "7.2 / 10.0 km" }
    ],
    shareEligible: true,
    containsSimulatedData: true,
    version: "1.0.0"
  },
  {
    id: "journey-pulse-improvement",
    travelerId: "Fathan",
    title: "Health Pulse Improvement",
    summary: "Observed a positive shift in overall lifestyle and consistency patterns.",
    meaning: "A rising pulse validates our focused wellness habits.",
    category: "health-pulse",
    occurredAt: "2026-07-20T12:00:00Z",
    visibility: "public",
    trustLevel: "verified",
    metrics: [
      { label: "Active Pulse", value: "78.0" },
      { label: "Net Score Increase", value: "+1.2" }
    ],
    healthPulseBefore: 76.8,
    healthPulseAfter: 78.0,
    healthPulseChange: 1.2,
    shareEligible: true,
    containsSimulatedData: false,
    version: "1.0.0"
  },
  {
    id: "journey-personal-reflection",
    travelerId: "Fathan",
    title: "Personal Reflection",
    summary: "Reflecting on hydration and recovery adjustments for the upcoming week.",
    meaning: "Self-awareness is the key driver of autonomous habit adjustments.",
    reflection: "Struggling to hit water targets on active days. Will carry a tumbler next week.",
    category: "reflection",
    occurredAt: "2026-07-18T21:00:00Z",
    visibility: "private",
    trustLevel: "self-reported",
    metrics: [
      { label: "Reflection Focus", value: "Hydration" }
    ],
    shareEligible: false,
    containsSimulatedData: false,
    version: "1.0.0"
  },
  {
    id: "journey-hydration-progress",
    travelerId: "Fathan",
    title: "Hydration Progress",
    summary: "Logged water intake during study breaks to sustain focus levels.",
    meaning: "Hydrating regularly supports physical recovery and mental alertness.",
    category: "lifestyle",
    occurredAt: "2026-07-20T11:30:00Z",
    visibility: "private",
    trustLevel: "self-reported",
    metrics: [
      { label: "Intake", value: "1.1 L" },
      { label: "Target", value: "2.0 L" }
    ],
    shareEligible: false,
    containsSimulatedData: false,
    version: "1.0.0"
  }
];
