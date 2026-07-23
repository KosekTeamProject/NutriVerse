import assert from "node:assert/strict";
import test from "node:test";
import { Tier } from "@prisma/client";
import {
  ECONOMY_POLICY,
  applyDailyAwardPolicy,
  nextStreakDays,
  tierForTotalXp,
  utcDayBounds,
} from "@/server/economy/economy-policy";

test("applies diminishing return after the full-rate XP threshold", () => {
  const result = applyDailyAwardPolicy(100, 150, ECONOMY_POLICY.xp);
  assert.equal(result.awardedAmount, 65);
  assert.equal(result.diminishingApplied, true);
  assert.equal(result.capApplied, false);
});

test("caps an award at the remaining daily capacity", () => {
  const result = applyDailyAwardPolicy(100, 280, ECONOMY_POLICY.xp);
  assert.equal(result.awardedAmount, 20);
  assert.equal(result.capApplied, true);
});

test("uses the same tier thresholds as the finalized frontend", () => {
  assert.equal(tierForTotalXp(0), Tier.SPROUT);
  assert.equal(tierForTotalXp(10_000), Tier.RADIANT);
  assert.equal(tierForTotalXp(34_000), Tier.APEX);
  assert.equal(tierForTotalXp(50_000), Tier.LEGEND);
});

test("calculates a Jakarta calendar-day boundary in UTC", () => {
  const bounds = utcDayBounds(new Date("2026-07-23T12:00:00.000Z"), "Asia/Jakarta");
  assert.equal(bounds.start.toISOString(), "2026-07-22T17:00:00.000Z");
  assert.equal(bounds.end.toISOString(), "2026-07-23T17:00:00.000Z");
});

test("increments, preserves, and resets streaks by local calendar day", () => {
  const timezone = "Asia/Jakarta";
  assert.equal(
    nextStreakDays(
      4,
      new Date("2026-07-22T12:00:00.000Z"),
      new Date("2026-07-23T12:00:00.000Z"),
      timezone,
    ),
    5,
  );
  assert.equal(
    nextStreakDays(
      5,
      new Date("2026-07-23T01:00:00.000Z"),
      new Date("2026-07-23T10:00:00.000Z"),
      timezone,
    ),
    5,
  );
  assert.equal(
    nextStreakDays(
      5,
      new Date("2026-07-20T12:00:00.000Z"),
      new Date("2026-07-23T12:00:00.000Z"),
      timezone,
    ),
    1,
  );
});
