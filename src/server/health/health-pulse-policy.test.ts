import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateHealthPulseScore,
  nutritionAttainmentScore,
  sleepDurationScore,
} from "./health-pulse-policy";

test("sleep score peaks around the target and penalizes extremes", () => {
  assert.equal(sleepDurationScore(8, 8), 100);
  assert.ok(sleepDurationScore(4, 8) < sleepDurationScore(7, 8));
  assert.ok(sleepDurationScore(12, 8) < sleepDurationScore(9, 8));
});

test("missing dimensions do not become zero or create a perfect pulse", () => {
  const pulse = calculateHealthPulseScore({ scores: { sleep: 100 } });
  assert.equal(pulse.completeness, 20);
  assert.equal(pulse.overallScore, 60);
});

test("a complete set of achieved dimensions produces a full pulse", () => {
  const pulse = calculateHealthPulseScore({
    scores: {
      nutrition: 100,
      activity: 100,
      sleep: 100,
      hydration: 100,
      weight: 100,
    },
  });
  assert.equal(pulse.completeness, 100);
  assert.equal(pulse.overallScore, 100);
});

test("nutrition uses calories, protein, and fiber instead of protein alone", () => {
  const score = nutritionAttainmentScore({
    calories: 1_000,
    protein: 80,
    fiber: 12.5,
    calorieTarget: 2_000,
    proteinTarget: 80,
    fiberTarget: 25,
  });
  assert.equal(score, 75);
});
