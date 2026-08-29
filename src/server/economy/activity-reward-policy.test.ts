import assert from "node:assert/strict";
import test from "node:test";
import { computeActivityXp } from "@/lib/activity";
import { ACTIVITY_HP_RATE } from "@/lib/economy-rules";

test("activity XP is calculated from verified distance and activity type", () => {
  assert.equal(computeActivityXp(2_000, "walk"), 120);
  assert.equal(computeActivityXp(1_200, "RUN"), 120);
  assert.equal(computeActivityXp(2_666, "CYCLED"), 119);
});

test("activity HP is twenty percent of awarded activity XP", () => {
  assert.equal(Math.floor(120 * ACTIVITY_HP_RATE), 24);
});
