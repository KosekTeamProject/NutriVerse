import { DAILY_REWARD_POLICY } from "@/lib/economy-rules";

export type ActivityKind = "walk" | "run" | "bike";

export const ACTIVITY_XP_PER_KILOMETER = {
  WALK: 60,
  RUN: 100,
  CYCLED: 45,
} as const;

export const ACTIVITY: Record<ActivityKind, { label: string; xpPerKm: number; maxSpeedKmh: number }> = {
  walk: { label: "Jalan Kaki", xpPerKm: ACTIVITY_XP_PER_KILOMETER.WALK, maxSpeedKmh: 10 },
  run: { label: "Lari", xpPerKm: ACTIVITY_XP_PER_KILOMETER.RUN, maxSpeedKmh: 20 },
  bike: { label: "Bersepeda", xpPerKm: ACTIVITY_XP_PER_KILOMETER.CYCLED, maxSpeedKmh: 50 },
};

export type LatLng = { lat: number; lng: number };

// 1. Verification Status Models
export type ActivityVerificationStatus = "pending" | "verified" | "needs-review" | "not-verified" | "manual-review";
export type ActivityRiskLevel = "none" | "low" | "medium" | "high" | "critical";

export type ActivityRiskSignal = 
  | "unusual-speed"
  | "sudden-location-change"
  | "low-accuracy"
  | "invalid-coordinate"
  | "timestamp-order"
  | "segment-order"
  | "undeclared-segment-break"
  | "duplicate-sample"
  | "incomplete-samples"
  | "large-sample-gap"
  | "duplicate-activity"
  | "invalid-duration"
  | "invalid-pause-duration"
  | "zero-movement"
  | "simulation-source"
  | "attestation-missing";

export interface ActivitySampleSummary {
  readonly sampleCount: number;
  readonly acceptedSampleCount: number;
  readonly excludedSampleCount: number;
  readonly activeDurationSeconds: number;
  readonly pausedDurationSeconds: number;
  readonly calculatedDistanceKm: number;
  readonly averageAccuracyMeters: number;
  readonly largestSampleGapSeconds: number;
  readonly locationDataAvailable: boolean;
}

export interface ActivityRewardEligibility {
  readonly eligible: boolean;
  readonly xpEligible: boolean;
  readonly hpEligible: boolean;
  readonly challengeEligible: boolean;
  readonly journeyEligible: boolean;
  readonly healthyDayEligible: boolean;
  readonly healthPulseEligible: boolean;
  readonly reason: string;
}

export type ActivityVerificationRecommendation = 
  | "accept"
  | "keep-personal-record"
  | "review"
  | "reject"
  | "collect-more-data";

export interface ActivityVerificationResult {
  readonly activityId: string;
  readonly status: ActivityVerificationStatus;
  readonly riskLevel: ActivityRiskLevel;
  readonly signals: readonly ActivityRiskSignal[];
  readonly recommendation: ActivityVerificationRecommendation;
  readonly samples: ActivitySampleSummary;
  readonly eligibility: ActivityRewardEligibility;
  readonly explanation: string;
}

export interface UpgradedActivitySummary {
  readonly id: string;
  readonly travelerId: string;
  readonly type: ActivityKind;
  readonly title: string;
  readonly startedAt: string;
  readonly endedAt: string;
  readonly durationSeconds: number;
  readonly activeDurationSeconds: number;
  readonly pausedDurationSeconds: number;
  readonly distanceKm: number;
  readonly averagePace: string;
  readonly averageSpeedKmh: number;
  readonly status: "completed" | "active" | "paused" | "cancelled" | "error" | "idle";
  readonly sourceMode: "live-gps" | "simulation" | "imported" | "legacy-local";
  readonly verification?: ActivityVerificationResult;
  readonly personalRecordAllowed: boolean;
  readonly isSimulation: boolean;
  readonly version: string;
}

export function haversine(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function formatTime(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function paceMinPerKm(distanceM: number, elapsedSec: number): string {
  if (distanceM < 5 || elapsedSec < 1) return "--:--";
  const paceSecPerKm = elapsedSec / (distanceM / 1000);
  const m = Math.floor(paceSecPerKm / 60);
  const s = Math.floor(paceSecPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function speedKmh(distanceM: number, elapsedSec: number): number {
  if (elapsedSec < 1) return 0;
  return distanceM / 1000 / (elapsedSec / 3600);
}

export function minimumMovementMetersForAccuracy(accuracy?: number | null) {
  return Math.max(
    2,
    Math.min(
      8,
      (typeof accuracy === "number" && Number.isFinite(accuracy)
        ? accuracy
        : 8) * 0.35,
    ),
  );
}

export function computeXp(distanceM: number, kind: ActivityKind): number {
  return Math.floor((distanceM / 1000) * ACTIVITY[kind].xpPerKm);
}

/**
 * Guardrail proposal for the browser demo. The server remains the authority for
 * production XP and may tune these values after product and safety evaluation.
 */
export const XP_SAFETY_POLICY = DAILY_REWARD_POLICY.xp;

export type DailyXpResult = {
  readonly awarded: number;
  readonly base: number;
  readonly remainingToday: number;
  readonly reducedBy: number;
  readonly capped: boolean;
};

export function applyDailyXpPolicy(baseXp: number, earnedToday: number): DailyXpResult {
  const safeBase = Math.max(0, Math.floor(baseXp));
  const safeEarned = Math.max(0, Math.floor(earnedToday));
  const remainingToday = Math.max(0, XP_SAFETY_POLICY.dailyCap - safeEarned);
  const fullRateRoom = Math.max(0, XP_SAFETY_POLICY.fullRateUntil - safeEarned);
  const fullRateXp = Math.min(safeBase, fullRateRoom);
  const reducedBase = Math.max(0, safeBase - fullRateXp);
  const adjusted = fullRateXp + Math.floor(reducedBase * XP_SAFETY_POLICY.reducedRate);
  const awarded = Math.min(adjusted, remainingToday);

  return {
    awarded,
    base: safeBase,
    remainingToday,
    reducedBy: safeBase - awarded,
    capped: adjusted > remainingToday,
  };
}

// 2. Deterministic Verification Examples
export const verifiedMorningWalk: UpgradedActivitySummary = {
  id: "journey-morning-walk",
  travelerId: "Fathan",
  type: "walk",
  title: "Morning Walk",
  startedAt: "2026-07-20T06:30:00Z",
  endedAt: "2026-07-20T06:52:00Z",
  durationSeconds: 1320,
  activeDurationSeconds: 1200,
  pausedDurationSeconds: 120,
  distanceKm: 1.4,
  averagePace: "14:17",
  averageSpeedKmh: 4.2,
  status: "completed",
  sourceMode: "live-gps",
  personalRecordAllowed: true,
  isSimulation: false,
  version: "1.0.0",
  verification: {
    activityId: "journey-morning-walk",
    status: "verified",
    riskLevel: "none",
    signals: [],
    recommendation: "accept",
    samples: {
      sampleCount: 120,
      acceptedSampleCount: 120,
      excludedSampleCount: 0,
      activeDurationSeconds: 1200,
      pausedDurationSeconds: 120,
      calculatedDistanceKm: 1.4,
      averageAccuracyMeters: 4.5,
      largestSampleGapSeconds: 12,
      locationDataAvailable: true
    },
    eligibility: {
      eligible: true,
      xpEligible: true,
      hpEligible: true,
      challengeEligible: true,
      journeyEligible: true,
      healthyDayEligible: true,
      healthPulseEligible: true,
      reason: "This activity passed the current validation checks and is eligible for trusted progress."
    },
    explanation: "Standard pacing and consistent telemetry signal."
  }
};

export const activityNeedsReview: UpgradedActivitySummary = {
  id: "activity-needs-review",
  travelerId: "Fathan",
  type: "bike",
  title: "Evening Ride",
  startedAt: "2026-07-19T18:00:00Z",
  endedAt: "2026-07-19T18:15:00Z",
  durationSeconds: 900,
  activeDurationSeconds: 900,
  pausedDurationSeconds: 0,
  distanceKm: 4.8,
  averagePace: "3:07",
  averageSpeedKmh: 19.2,
  status: "completed",
  sourceMode: "live-gps",
  personalRecordAllowed: true,
  isSimulation: false,
  version: "1.0.0",
  verification: {
    activityId: "activity-needs-review",
    status: "needs-review",
    riskLevel: "medium",
    signals: ["unusual-speed"],
    recommendation: "review",
    samples: {
      sampleCount: 90,
      acceptedSampleCount: 82,
      excludedSampleCount: 8,
      activeDurationSeconds: 900,
      pausedDurationSeconds: 0,
      calculatedDistanceKm: 4.8,
      averageAccuracyMeters: 6.2,
      largestSampleGapSeconds: 45,
      locationDataAvailable: true
    },
    eligibility: {
      eligible: false,
      xpEligible: false,
      hpEligible: false,
      challengeEligible: false,
      journeyEligible: true, // Personal Record Allowed
      healthyDayEligible: false,
      healthPulseEligible: false,
      reason: "Some activity data needs additional review before it can contribute to trusted progress."
    },
    explanation: "Unusual speed bursts and timing discontinuity detected."
  }
};

export const activityNotVerified: UpgradedActivitySummary = {
  id: "activity-not-verified",
  travelerId: "Fathan",
  type: "run",
  title: "Afternoon Run",
  startedAt: "2026-07-18T16:00:00Z",
  endedAt: "2026-07-18T16:02:00Z",
  durationSeconds: 120,
  activeDurationSeconds: 120,
  pausedDurationSeconds: 0,
  distanceKm: 0.1,
  averagePace: "20:00",
  averageSpeedKmh: 3.0,
  status: "completed",
  sourceMode: "live-gps",
  personalRecordAllowed: true,
  isSimulation: false,
  version: "1.0.0",
  verification: {
    activityId: "activity-not-verified",
    status: "not-verified",
    riskLevel: "critical",
    signals: ["invalid-duration", "zero-movement"],
    recommendation: "reject",
    samples: {
      sampleCount: 10,
      acceptedSampleCount: 2,
      excludedSampleCount: 8,
      activeDurationSeconds: 120,
      pausedDurationSeconds: 0,
      calculatedDistanceKm: 0.1,
      averageAccuracyMeters: 15.0,
      largestSampleGapSeconds: 60,
      locationDataAvailable: true
    },
    eligibility: {
      eligible: false,
      xpEligible: false,
      hpEligible: false,
      challengeEligible: false,
      journeyEligible: false,
      healthyDayEligible: false,
      healthPulseEligible: false,
      reason: "This activity could not be verified for trusted progress."
    },
    explanation: "Insufficient telemetry duration and lack of physical translation coordinates."
  }
};

export const deterministicActivities = [verifiedMorningWalk, activityNeedsReview, activityNotVerified];

export function getActivitySummaryById(id: string): UpgradedActivitySummary | undefined {
  return deterministicActivities.find((act) => act.id === id);
}
