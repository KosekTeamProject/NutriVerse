import assert from "node:assert/strict";
import test from "node:test";
import { ActivityType, VerificationStatus } from "@prisma/client";
import { verifyActivityTelemetry } from "@/server/activity/verification-engine";

const startTime = new Date("2026-07-23T06:00:00.000Z");

function sample(
  sequenceNumber: number,
  seconds: number,
  latitude: number,
  accuracy = 5,
) {
  return {
    sequenceNumber,
    timestamp: new Date(startTime.getTime() + seconds * 1000),
    latitude,
    longitude: 106.816666,
    accuracy,
    speed: null,
  };
}

test("verifies consistent walking telemetry", () => {
  const samples = Array.from({ length: 13 }, (_, index) =>
    sample(index, index * 10, -6.2 + index * 0.0001),
  );
  const result = verifyActivityTelemetry({
    activityType: ActivityType.WALK,
    startTime,
    endTime: new Date(startTime.getTime() + 120_000),
    isSimulated: false,
    deviceAttestationVerified: true,
    samples,
  });
  assert.equal(result.verificationStatus, VerificationStatus.VERIFIED);
  assert.equal(result.reasonCodes.length, 0);
  assert.ok(result.trustedDistanceMeters > 100);
});

test("sends impossible running speed for review", () => {
  const result = verifyActivityTelemetry({
    activityType: ActivityType.RUN,
    startTime,
    endTime: new Date(startTime.getTime() + 120_000),
    isSimulated: false,
    deviceAttestationVerified: true,
    samples: [
      sample(0, 0, -6.2),
      sample(1, 10, -6.19),
      sample(2, 120, -6.189),
    ],
  });
  assert.equal(result.verificationStatus, VerificationStatus.NEEDS_REVIEW);
  assert.ok(result.reasonCodes.includes("UNUSUAL_SPEED"));
});

test("rejects out-of-order timestamps", () => {
  const result = verifyActivityTelemetry({
    activityType: ActivityType.WALK,
    startTime,
    endTime: new Date(startTime.getTime() + 120_000),
    isSimulated: false,
    deviceAttestationVerified: true,
    samples: [
      sample(0, 0, -6.2),
      sample(1, 20, -6.1999),
      sample(2, 10, -6.1998),
    ],
  });
  assert.equal(result.verificationStatus, VerificationStatus.NOT_VERIFIED);
  assert.ok(result.reasonCodes.includes("TIMESTAMP_ORDER"));
});

test("rejects simulated activity from trusted progress", () => {
  const result = verifyActivityTelemetry({
    activityType: ActivityType.CYCLED,
    startTime,
    endTime: new Date(startTime.getTime() + 120_000),
    isSimulated: true,
    deviceAttestationVerified: false,
    samples: [
      sample(0, 0, -6.2),
      sample(1, 120, -6.19),
    ],
  });
  assert.equal(result.verificationStatus, VerificationStatus.NOT_VERIFIED);
  assert.ok(result.reasonCodes.includes("SIMULATED_SOURCE"));
});
