import assert from "node:assert/strict";
import test from "node:test";
import { eligibleBadgeCodes } from "@/server/badges/badge-policy";

test("awards first-step and streak badges from verified facts", () => {
  assert.deepEqual(
    eligibleBadgeCodes({ verifiedActivityCount: 1, streakDays: 7, verifiedDistanceMeters: 0, completedChallengeCount: 0, attendedEventCount: 0 }),
    ["FIRST_STEP", "STREAK_MASTER"],
  );
});

test("does not award competitive badges without qualifying facts", () => {
  assert.deepEqual(
    eligibleBadgeCodes({ verifiedActivityCount: 0, streakDays: 6, verifiedDistanceMeters: 0, completedChallengeCount: 0, attendedEventCount: 0 }),
    [],
  );
});
