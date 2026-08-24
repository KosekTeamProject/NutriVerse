import { ActivityType, VerificationStatus } from "@prisma/client";
import { minimumMovementMetersForAccuracy } from "@/lib/activity";

export const ACTIVITY_VERIFICATION_POLICY = {
  maximumAccuracyMeters: 35,
  maximumGapSeconds: 120,
  teleportWindowSeconds: 2,
  teleportSpeedKmh: 150,
  minimumDurationSeconds: 60,
  minimumDistanceMeters: 20,
  minimumAcceptedSampleRatio: 0.5,
  maximumSpeedKmh: {
    WALK: 10,
    RUN: 20,
    CYCLED: 50,
  } satisfies Record<ActivityType, number>,
} as const;

export type VerificationReasonCode =
  | "SIMULATED_SOURCE"
  | "INSUFFICIENT_SAMPLES"
  | "INCOMPLETE_SAMPLES"
  | "INVALID_DURATION"
  | "INVALID_PAUSE_DURATION"
  | "TIMESTAMP_ORDER"
  | "SEGMENT_ORDER"
  | "UNDECLARED_SEGMENT_BREAK"
  | "DUPLICATE_SAMPLE"
  | "INVALID_COORDINATE"
  | "LOW_ACCURACY"
  | "LARGE_SAMPLE_GAP"
  | "UNUSUAL_SPEED"
  | "SUDDEN_LOCATION_CHANGE"
  | "ZERO_MOVEMENT"
  | "ATTESTATION_MISSING"
  | "DUPLICATE_ACTIVITY";

export type VerificationTelemetrySample = {
  readonly sequenceNumber?: number | null;
  readonly segmentNumber?: number | null;
  readonly timestamp: Date;
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracy?: number | null;
  readonly speed?: number | null;
};

export type VerifyActivityInput = {
  readonly activityType: ActivityType;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly pausedDurationSeconds?: number;
  readonly isSimulated: boolean;
  readonly deviceAttestationVerified: boolean;
  readonly requireDeviceAttestation?: boolean;
  readonly samples: readonly VerificationTelemetrySample[];
};

export type ActivityVerificationDecision = {
  readonly verificationStatus: VerificationStatus;
  readonly reasonCodes: readonly VerificationReasonCode[];
  readonly riskScore: number;
  readonly trustedDistanceMeters: number;
  readonly trustedDurationSeconds: number;
  readonly sampleCount: number;
  readonly acceptedSampleCount: number;
  readonly discardedSampleCount: number;
  readonly maxSpeedKmh: number;
  readonly largestSampleGapSeconds: number;
  readonly deviceAttestationVerified: boolean;
};

function coordinateIsValid(sample: VerificationTelemetrySample) {
  return (
    Number.isFinite(sample.latitude) &&
    Number.isFinite(sample.longitude) &&
    sample.latitude >= -90 &&
    sample.latitude <= 90 &&
    sample.longitude >= -180 &&
    sample.longitude <= 180
  );
}

function distanceMeters(a: VerificationTelemetrySample, b: VerificationTelemetrySample) {
  const earthRadiusMeters = 6_371_000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(b.latitude - a.latitude);
  const longitudeDelta = toRadians(b.longitude - a.longitude);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) *
      Math.cos(toRadians(b.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusMeters * Math.asin(Math.min(1, Math.sqrt(value)));
}

function addReason(reasons: Set<VerificationReasonCode>, reason: VerificationReasonCode) {
  reasons.add(reason);
}

export function verifyActivityTelemetry(input: VerifyActivityInput): ActivityVerificationDecision {
  const reasons = new Set<VerificationReasonCode>();
  const wallDurationSeconds = (input.endTime.getTime() - input.startTime.getTime()) / 1000;
  const pausedDurationSeconds = input.pausedDurationSeconds ?? 0;
  const durationSeconds = wallDurationSeconds - pausedDurationSeconds;
  let riskScore = 0;

  if (input.isSimulated) {
    addReason(reasons, "SIMULATED_SOURCE");
    riskScore = 100;
  }
  if (
    !Number.isFinite(pausedDurationSeconds) ||
    pausedDurationSeconds < 0 ||
    pausedDurationSeconds > wallDurationSeconds
  ) {
    addReason(reasons, "INVALID_PAUSE_DURATION");
    riskScore = 100;
  }
  if (
    !Number.isFinite(durationSeconds) ||
    durationSeconds < ACTIVITY_VERIFICATION_POLICY.minimumDurationSeconds
  ) {
    addReason(reasons, "INVALID_DURATION");
    riskScore = 100;
  }
  if (input.samples.length < 2) {
    addReason(reasons, "INSUFFICIENT_SAMPLES");
    riskScore = 100;
  }
  if (input.requireDeviceAttestation && !input.deviceAttestationVerified) {
    addReason(reasons, "ATTESTATION_MISSING");
    riskScore += 35;
  }

  const hasSequenceForEverySample = input.samples.every(
    (sample) => sample.sequenceNumber !== null && sample.sequenceNumber !== undefined,
  );
  if (!hasSequenceForEverySample && input.samples.length > 0) {
    addReason(reasons, "INCOMPLETE_SAMPLES");
    riskScore += 10;
  }

  let segmentTransitionCount = 0;
  for (let index = 1; index < input.samples.length; index += 1) {
    const previous = input.samples[index - 1];
    const current = input.samples[index];
    if (current.timestamp.getTime() < previous.timestamp.getTime()) {
      addReason(reasons, "TIMESTAMP_ORDER");
      riskScore = 100;
    } else if (current.timestamp.getTime() === previous.timestamp.getTime()) {
      addReason(reasons, "DUPLICATE_SAMPLE");
      riskScore = 100;
    }
    if (
      hasSequenceForEverySample &&
      (current.sequenceNumber ?? 0) <= (previous.sequenceNumber ?? 0)
    ) {
      addReason(reasons, "DUPLICATE_SAMPLE");
      riskScore = 100;
    }
    if (
      hasSequenceForEverySample &&
      (current.sequenceNumber ?? 0) > (previous.sequenceNumber ?? 0) + 1
    ) {
      addReason(reasons, "INCOMPLETE_SAMPLES");
      riskScore += 10;
    }
    if (
      (current.segmentNumber ?? 0) < (previous.segmentNumber ?? 0)
    ) {
      addReason(reasons, "SEGMENT_ORDER");
      riskScore = 100;
    }
    if ((current.segmentNumber ?? 0) > (previous.segmentNumber ?? 0) + 1) {
      addReason(reasons, "SEGMENT_ORDER");
      riskScore = 100;
    }
    if ((current.segmentNumber ?? 0) !== (previous.segmentNumber ?? 0)) {
      segmentTransitionCount += 1;
    }
  }
  if (
    segmentTransitionCount > 0 &&
    pausedDurationSeconds < segmentTransitionCount
  ) {
    addReason(reasons, "UNDECLARED_SEGMENT_BREAK");
    riskScore += 35;
  }

  const acceptedSamples: VerificationTelemetrySample[] = [];
  let discardedSampleCount = 0;
  for (const sample of input.samples) {
    if (!coordinateIsValid(sample)) {
      addReason(reasons, "INVALID_COORDINATE");
      discardedSampleCount += 1;
      riskScore += 15;
      continue;
    }
    if (
      sample.accuracy !== null &&
      sample.accuracy !== undefined &&
      (!Number.isFinite(sample.accuracy) ||
        sample.accuracy > ACTIVITY_VERIFICATION_POLICY.maximumAccuracyMeters)
    ) {
      addReason(reasons, "LOW_ACCURACY");
      discardedSampleCount += 1;
      riskScore += 5;
      continue;
    }
    acceptedSamples.push(sample);
  }

  let trustedDistanceMeters = 0;
  let trustedDurationSeconds = 0;
  let maxSpeedKmh = 0;
  let largestSampleGapSeconds = 0;
  const maximumActivitySpeed = ACTIVITY_VERIFICATION_POLICY.maximumSpeedKmh[input.activityType];

  for (let index = 1; index < acceptedSamples.length; index += 1) {
    const previous = acceptedSamples[index - 1];
    const current = acceptedSamples[index];
    if ((current.segmentNumber ?? 0) !== (previous.segmentNumber ?? 0)) {
      continue;
    }
    const segmentDurationSeconds =
      (current.timestamp.getTime() - previous.timestamp.getTime()) / 1000;
    if (segmentDurationSeconds <= 0) continue;

    largestSampleGapSeconds = Math.max(largestSampleGapSeconds, segmentDurationSeconds);
    if (segmentDurationSeconds > ACTIVITY_VERIFICATION_POLICY.maximumGapSeconds) {
      addReason(reasons, "LARGE_SAMPLE_GAP");
      riskScore += 25;
      continue;
    }

    const segmentDistanceMeters = distanceMeters(previous, current);
    const calculatedSpeedKmh = (segmentDistanceMeters / segmentDurationSeconds) * 3.6;
    const reportedSpeedKmh =
      current.speed !== null && current.speed !== undefined && Number.isFinite(current.speed)
        ? current.speed * 3.6
        : 0;
    const segmentSpeedKmh = calculatedSpeedKmh;
    maxSpeedKmh = Math.max(maxSpeedKmh, segmentSpeedKmh, reportedSpeedKmh);

    if (
      segmentDurationSeconds < ACTIVITY_VERIFICATION_POLICY.teleportWindowSeconds &&
      segmentSpeedKmh > ACTIVITY_VERIFICATION_POLICY.teleportSpeedKmh
    ) {
      addReason(reasons, "SUDDEN_LOCATION_CHANGE");
      riskScore += 80;
      continue;
    }
    if (segmentSpeedKmh > maximumActivitySpeed) {
      addReason(reasons, "UNUSUAL_SPEED");
      riskScore += 35;
      continue;
    }

    const minimumMovementMeters = minimumMovementMetersForAccuracy(
      Math.max(previous.accuracy ?? 0, current.accuracy ?? 0),
    );
    if (segmentDistanceMeters < minimumMovementMeters) {
      continue;
    }

    trustedDistanceMeters += segmentDistanceMeters;
    trustedDurationSeconds += segmentDurationSeconds;
  }

  const acceptedRatio =
    input.samples.length > 0 ? acceptedSamples.length / input.samples.length : 0;
  if (
    acceptedSamples.length < 2 ||
    acceptedRatio < ACTIVITY_VERIFICATION_POLICY.minimumAcceptedSampleRatio
  ) {
    addReason(reasons, "INSUFFICIENT_SAMPLES");
    riskScore = 100;
  }
  if (
    acceptedSamples.length >= 2 &&
    trustedDistanceMeters < ACTIVITY_VERIFICATION_POLICY.minimumDistanceMeters
  ) {
    addReason(reasons, "ZERO_MOVEMENT");
    riskScore = 100;
  }

  const hardFailureReasons: readonly VerificationReasonCode[] = [
    "SIMULATED_SOURCE",
    "INVALID_DURATION",
    "INVALID_PAUSE_DURATION",
    "TIMESTAMP_ORDER",
    "SEGMENT_ORDER",
    "DUPLICATE_SAMPLE",
    "INSUFFICIENT_SAMPLES",
    "ZERO_MOVEMENT",
    "DUPLICATE_ACTIVITY",
  ];
  const hasHardFailure = hardFailureReasons.some((reason) => reasons.has(reason));
  const needsReview = [...reasons].some((reason) =>
    [
      "INVALID_COORDINATE",
      "LOW_ACCURACY",
      "LARGE_SAMPLE_GAP",
      "UNUSUAL_SPEED",
      "SUDDEN_LOCATION_CHANGE",
      "UNDECLARED_SEGMENT_BREAK",
    ].includes(reason),
  );

  let verificationStatus: VerificationStatus = VerificationStatus.VERIFIED;
  if (hasHardFailure) {
    verificationStatus = VerificationStatus.NOT_VERIFIED;
  } else if (input.requireDeviceAttestation && !input.deviceAttestationVerified) {
    verificationStatus = VerificationStatus.MANUAL_REVIEW;
  } else if (needsReview) {
    verificationStatus = VerificationStatus.NEEDS_REVIEW;
  }

  return {
    verificationStatus,
    reasonCodes: [...reasons],
    riskScore: Math.min(100, Math.round(riskScore)),
    trustedDistanceMeters,
    trustedDurationSeconds: Math.round(trustedDurationSeconds),
    sampleCount: input.samples.length,
    acceptedSampleCount: acceptedSamples.length,
    discardedSampleCount,
    maxSpeedKmh,
    largestSampleGapSeconds,
    deviceAttestationVerified: input.deviceAttestationVerified,
  };
}
