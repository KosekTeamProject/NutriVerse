import assert from "node:assert/strict";
import test from "node:test";
import { ChallengeMetric } from "@prisma/client";
import {
  applyChallengeProgress,
  challengeContributionAmount,
} from "@/server/challenges/challenge-policy";

test("maps verified telemetry to each supported challenge metric", () => {
  const metrics = { trustedDistanceMeters: 2_500, trustedDurationSeconds: 900 };
  assert.equal(
    challengeContributionAmount(ChallengeMetric.DISTANCE_METERS, metrics),
    2_500,
  );
  assert.equal(
    challengeContributionAmount(ChallengeMetric.DURATION_SECONDS, metrics),
    900,
  );
  assert.equal(
    challengeContributionAmount(ChallengeMetric.VERIFIED_ACTIVITY_COUNT, metrics),
    1,
  );
  assert.equal(
    challengeContributionAmount(ChallengeMetric.ACTIVE_DAY_COUNT, metrics),
    1,
  );
});

test("caps challenge progress at target and marks completion", () => {
  assert.deepEqual(applyChallengeProgress(8_000, 3_000, 10_000), {
    currentValue: 10_000,
    isCompleted: true,
  });
});
