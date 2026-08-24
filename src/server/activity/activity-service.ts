import { createHash } from "node:crypto";
import { VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ACTIVITY_XP_PER_KILOMETER } from "@/lib/activity";
import {
  type ActivityVerificationDecision,
  type VerificationReasonCode,
  verifyActivityTelemetry,
} from "@/server/activity/verification-engine";

function createTelemetryDigest(
  samples: readonly {
    sequenceNumber: number | null;
    segmentNumber: number;
    timestamp: Date;
    latitude: number;
    longitude: number;
  }[],
) {
  const hash = createHash("sha256");
  for (const sample of samples) {
    hash.update(
      `${sample.sequenceNumber ?? ""}|${sample.timestamp.toISOString()}|` +
        `${sample.segmentNumber}|${sample.latitude.toFixed(7)}|${sample.longitude.toFixed(7)}\n`,
    );
  }
  return hash.digest("hex");
}

function duplicateDecision(
  decision: ActivityVerificationDecision,
): ActivityVerificationDecision {
  const reasons = new Set<VerificationReasonCode>(decision.reasonCodes);
  reasons.add("DUPLICATE_ACTIVITY");
  return {
    ...decision,
    verificationStatus: VerificationStatus.NOT_VERIFIED,
    reasonCodes: [...reasons],
    riskScore: 100,
    trustedDistanceMeters: 0,
    trustedDurationSeconds: 0,
  };
}

export async function verifyStoredActivity(
  activitySessionId: string,
  options: { requireDeviceAttestation?: boolean } = {},
) {
  const session = await prisma.activitySession.findUnique({
    where: { id: activitySessionId },
    include: {
      telemetrySamples: {
        orderBy: [{ createdAt: "asc" }, { timestamp: "asc" }],
      },
    },
  });
  if (!session) throw new Error("ACTIVITY_NOT_FOUND");
  if (!session.endTime) throw new Error("ACTIVITY_NOT_FINISHED");

  const orderedSamples = [...session.telemetrySamples];
  if (
    orderedSamples.length > 0 &&
    orderedSamples.every((sample) => sample.sequenceNumber !== null)
  ) {
    orderedSamples.sort(
      (left, right) => (left.sequenceNumber ?? 0) - (right.sequenceNumber ?? 0),
    );
  }

  const telemetryDigest = createTelemetryDigest(orderedSamples);
  const replay = await prisma.activitySession.findFirst({
    where: {
      telemetryDigest,
      id: { not: session.id },
    },
    select: { id: true },
  });

  let decision = verifyActivityTelemetry({
    activityType: session.activityType,
    startTime: session.startTime,
    endTime: session.endTime,
    pausedDurationSeconds: session.pausedDurationSeconds,
    isSimulated: session.isSimulated,
    deviceAttestationVerified: session.deviceAttestationVerified,
    requireDeviceAttestation: options.requireDeviceAttestation,
    samples: orderedSamples,
  });
  if (replay) decision = duplicateDecision(decision);

  const wallDurationSeconds = Math.max(
    0,
    Math.round((session.endTime.getTime() - session.startTime.getTime()) / 1000),
  );
  const activeDurationSeconds = Math.max(
    0,
    wallDurationSeconds - session.pausedDurationSeconds,
  );
  const distanceKilometers = decision.trustedDistanceMeters / 1000;
  const averagePace =
    distanceKilometers > 0
      ? activeDurationSeconds / distanceKilometers
      : 0;
  const eligibleXp =
    decision.verificationStatus === VerificationStatus.VERIFIED
      ? Math.floor(
          distanceKilometers *
            ACTIVITY_XP_PER_KILOMETER[session.activityType],
        )
      : 0;
  const eligibleHp =
    decision.verificationStatus === VerificationStatus.VERIFIED
      ? Math.floor(eligibleXp / 2)
      : 0;

  return prisma.$transaction(async (transaction) => {
    await transaction.activitySession.update({
      where: { id: session.id },
      data: {
        endTime: session.endTime,
        durationSeconds: activeDurationSeconds,
        activeDurationSeconds,
        distanceMeters: decision.trustedDistanceMeters,
        averagePace,
        verificationStatus: decision.verificationStatus,
        telemetryDigest: replay ? null : telemetryDigest,
      },
    });

    return transaction.verificationResult.upsert({
      where: { activitySessionId: session.id },
      create: {
        activitySessionId: session.id,
        verificationStatus: decision.verificationStatus,
        reasonCodes: [...decision.reasonCodes],
        riskScore: decision.riskScore,
        trustedDistanceMeters: decision.trustedDistanceMeters,
        trustedDurationSeconds: decision.trustedDurationSeconds,
        eligibleXp,
        eligibleHp,
        sampleCount: decision.sampleCount,
        acceptedSampleCount: decision.acceptedSampleCount,
        discardedSampleCount: decision.discardedSampleCount,
        maxSpeedKmh: decision.maxSpeedKmh,
        largestSampleGapSeconds: decision.largestSampleGapSeconds,
        deviceAttestationVerified: decision.deviceAttestationVerified,
      },
      update: {
        verificationStatus: decision.verificationStatus,
        reasonCodes: [...decision.reasonCodes],
        riskScore: decision.riskScore,
        trustedDistanceMeters: decision.trustedDistanceMeters,
        trustedDurationSeconds: decision.trustedDurationSeconds,
        eligibleXp,
        eligibleHp,
        sampleCount: decision.sampleCount,
        acceptedSampleCount: decision.acceptedSampleCount,
        discardedSampleCount: decision.discardedSampleCount,
        maxSpeedKmh: decision.maxSpeedKmh,
        largestSampleGapSeconds: decision.largestSampleGapSeconds,
        deviceAttestationVerified: decision.deviceAttestationVerified,
        processedAt: new Date(),
      },
    });
  });
}
