import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateLongTermHealthPulse,
  calculateSafeWeightTrendBonus,
  nutritionAttainmentScore,
  sleepDurationScore,
  type DailyHealthPulseEvidence,
} from "./health-pulse-policy";

const DAY_MS = 86_400_000;

function shiftDay(dayKey: string, amount: number) {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day) + amount * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

function perfectDay(date: string): DailyHealthPulseEvidence {
  return {
    date,
    nutritionScore: 100,
    nutritionLogCount: 3,
    activityMinutes: 30,
    activityTargetMinutes: 30,
    verifiedActivityCount: 1,
    sleepScore: 100,
    hydrationRatio: 1,
  };
}

function perfectDays(asOfDate: string, count: number) {
  return Array.from({ length: count }, (_, index) =>
    perfectDay(shiftDay(asOfDate, index - count + 1)),
  );
}

function journeyStartForDay(asOfDate: string, analysisDay: number) {
  return shiftDay(asOfDate, -(analysisDay - 1));
}

test("sleep score peaks around the target and penalizes extremes", () => {
  assert.equal(sleepDurationScore(8, 8), 100);
  assert.ok(sleepDurationScore(4, 8) < sleepDurationScore(7, 8));
  assert.ok(sleepDurationScore(12, 8) < sleepDurationScore(9, 8));
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

test("a new user has no numeric Pulse during the first seven days", () => {
  const asOfDate = "2026-08-25";
  const result = calculateLongTermHealthPulse({
    days: perfectDays(asOfDate, 7),
    journeyStartDate: journeyStartForDay(asOfDate, 7),
    asOfDate,
  });
  assert.equal(result.phase, "LEARNING");
  assert.equal(result.published, false);
  assert.equal(result.score, null);
});

test("insufficient data remains unpublished after learning", () => {
  const asOfDate = "2026-08-25";
  const result = calculateLongTermHealthPulse({
    days: perfectDays(asOfDate, 3),
    journeyStartDate: journeyStartForDay(asOfDate, 20),
    asOfDate,
  });
  assert.equal(result.routine7.dataDays, 3);
  assert.equal(result.published, false);
  assert.equal(result.score, null);
});

test("one perfect day cannot produce a Health Pulse", () => {
  const asOfDate = "2026-08-25";
  const result = calculateLongTermHealthPulse({
    days: [perfectDay(asOfDate)],
    journeyStartDate: journeyStartForDay(asOfDate, 240),
    asOfDate,
  });
  assert.equal(result.published, false);
  assert.equal(result.score, null);
});

test("maturity phases enforce caps 55, 70, 85, and 100", () => {
  const asOfDate = "2026-08-25";
  const cases = [
    { analysisDay: 8, expectedPhase: "FOUNDATION", expectedScore: 55 },
    { analysisDay: 31, expectedPhase: "GROWTH", expectedScore: 70 },
    { analysisDay: 91, expectedPhase: "SUSTAINED", expectedScore: 85 },
    { analysisDay: 181, expectedPhase: "MASTERY", expectedScore: 100 },
  ] as const;
  for (const item of cases) {
    const result = calculateLongTermHealthPulse({
      days: perfectDays(asOfDate, 90),
      journeyStartDate: journeyStartForDay(asOfDate, item.analysisDay),
      asOfDate,
    });
    assert.equal(result.phase, item.expectedPhase);
    assert.equal(result.score, item.expectedScore);
  }
});

test("same-day refresh is idempotent and daily movement is capped", () => {
  const asOfDate = "2026-08-25";
  const input = {
    days: perfectDays(asOfDate, 28),
    journeyStartDate: journeyStartForDay(asOfDate, 120),
    asOfDate,
    previousPublishedScore: 50,
  };
  const first = calculateLongTermHealthPulse(input);
  const second = calculateLongTermHealthPulse(input);
  assert.equal(first.score, 51);
  assert.deepEqual(second, first);

  const weakDays = perfectDays(asOfDate, 7).map((day) => ({
    ...day,
    nutritionScore: 0,
    activityMinutes: 1,
    sleepScore: 5,
    hydrationRatio: 0.01,
  }));
  const decline = calculateLongTermHealthPulse({
    days: weakDays,
    journeyStartDate: journeyStartForDay(asOfDate, 120),
    asOfDate,
    previousPublishedScore: 50,
  });
  assert.equal(decline.score, 48.5);
});

test("missing data uses a three-day grace period then declines gradually", () => {
  const asOfDate = "2026-08-25";
  const base = perfectDays(shiftDay(asOfDate, -1), 20);
  const firstMissing = calculateLongTermHealthPulse({
    days: base,
    journeyStartDate: journeyStartForDay(asOfDate, 120),
    asOfDate,
    previousPublishedScore: 50,
  });
  assert.equal(firstMissing.noDataStreak, 1);
  assert.equal(firstMissing.score, 50);

  const fourDaysMissing = calculateLongTermHealthPulse({
    days: perfectDays(shiftDay(asOfDate, -4), 20),
    journeyStartDate: journeyStartForDay(asOfDate, 120),
    asOfDate,
    previousPublishedScore: 50,
  });
  assert.equal(fourDaysMissing.noDataStreak, 4);
  assert.equal(fourDaysMissing.score, 49.5);
});

test("safe weight movement gives only a small bonus", () => {
  const asOfDate = "2026-08-25";
  const weights = [
    ...Array.from({ length: 7 }, (_, index) => ({
      date: shiftDay(asOfDate, index - 13),
      weightKg: 80,
    })),
    ...Array.from({ length: 7 }, (_, index) => ({
      date: shiftDay(asOfDate, index - 6),
      weightKg: 79.5,
    })),
  ];
  const bonus = calculateSafeWeightTrendBonus({
    weights,
    asOfDate,
    targetWeightKg: 75,
  });
  assert.ok(bonus > 0 && bonus <= 2);
  assert.equal(
    calculateSafeWeightTrendBonus({ weights, asOfDate, targetWeightKg: null }),
    0,
  );
});

test("users without a weight target can still reach Peak Balance", () => {
  const asOfDate = "2026-08-25";
  const result = calculateLongTermHealthPulse({
    days: perfectDays(asOfDate, 90),
    journeyStartDate: journeyStartForDay(asOfDate, 200),
    asOfDate,
    targetWeightKg: null,
  });
  assert.equal(result.weightTrendBonus, 0);
  assert.equal(result.score, 100);
  assert.equal(result.status, "peak-balance");
});
