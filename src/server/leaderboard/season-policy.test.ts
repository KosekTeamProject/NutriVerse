import assert from "node:assert/strict";
import test from "node:test";
import { Tier } from "@prisma/client";
import { isSeasonRewardEligible, seasonCarryoverXp } from "@/server/leaderboard/season-policy";

test("carryover uses tier percentage and maximum", () => {
  assert.equal(seasonCarryoverXp(10_000, Tier.LEGEND), 3_000);
  assert.equal(seasonCarryoverXp(1_000, Tier.BLOOM), 900);
});

test("returning users keep the configured floor", () => {
  assert.equal(seasonCarryoverXp(1_000, Tier.LEGEND, 4), 900);
});

test("season reward requires seven active days, three verified activities, and no review", () => {
  assert.equal(isSeasonRewardEligible({ activeDayCount: 7, verifiedActivityCount: 3, hasUnresolvedReview: false }), true);
  assert.equal(isSeasonRewardEligible({ activeDayCount: 6, verifiedActivityCount: 3, hasUnresolvedReview: false }), false);
  assert.equal(isSeasonRewardEligible({ activeDayCount: 7, verifiedActivityCount: 3, hasUnresolvedReview: true }), false);
});
