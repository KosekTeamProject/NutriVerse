import { Tier } from "@prisma/client";

export const ECONOMY_POLICY = {
  xp: {
    dailyCap: 300,
    fullRateUntil: 180,
    reducedRate: 0.5,
  },
  hp: {
    dailyCap: 150,
    fullRateUntil: 90,
    reducedRate: 0.5,
  },
} as const;

const TIER_THRESHOLDS: readonly { tier: Tier; minimumXp: number }[] = [
  { tier: Tier.SPROUT, minimumXp: 0 },
  { tier: Tier.SEEDLING, minimumXp: 1_200 },
  { tier: Tier.BLOOM, minimumXp: 3_000 },
  { tier: Tier.VITAL, minimumXp: 6_000 },
  { tier: Tier.RADIANT, minimumXp: 10_000 },
  { tier: Tier.PEAK, minimumXp: 16_000 },
  { tier: Tier.ELITE, minimumXp: 24_000 },
  { tier: Tier.APEX, minimumXp: 34_000 },
  { tier: Tier.LEGEND, minimumXp: 50_000 },
];

export type DailyAwardPolicy = {
  readonly dailyCap: number;
  readonly fullRateUntil: number;
  readonly reducedRate: number;
};

export type DailyAwardResult = {
  readonly baseAmount: number;
  readonly awardedAmount: number;
  readonly reducedBy: number;
  readonly capApplied: boolean;
  readonly diminishingApplied: boolean;
};

export function applyDailyAwardPolicy(
  baseAmount: number,
  earnedToday: number,
  policy: DailyAwardPolicy,
): DailyAwardResult {
  const safeBase = Math.max(0, Math.floor(baseAmount));
  const safeEarned = Math.max(0, Math.floor(earnedToday));
  const fullRateRoom = Math.max(0, policy.fullRateUntil - safeEarned);
  const fullRateAmount = Math.min(safeBase, fullRateRoom);
  const reducedBase = Math.max(0, safeBase - fullRateAmount);
  const adjusted =
    fullRateAmount + Math.floor(reducedBase * Math.max(0, Math.min(1, policy.reducedRate)));
  const remainingDailyCapacity = Math.max(0, policy.dailyCap - safeEarned);
  const awardedAmount = Math.min(adjusted, remainingDailyCapacity);

  return {
    baseAmount: safeBase,
    awardedAmount,
    reducedBy: safeBase - awardedAmount,
    capApplied: adjusted > remainingDailyCapacity,
    diminishingApplied: reducedBase > 0,
  };
}

export function tierForTotalXp(totalXp: number): Tier {
  const safeTotal = Math.max(0, Math.floor(totalXp));
  let result: Tier = Tier.SPROUT;
  for (const threshold of TIER_THRESHOLDS) {
    if (safeTotal >= threshold.minimumXp) result = threshold.tier;
  }
  return result;
}

export function calendarDayKey(date: Date, timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function timezoneOffsetMilliseconds(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const representedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  return representedAsUtc - date.getTime();
}

function localMidnightAsUtc(dayKey: string, timezone: string) {
  const [year, month, day] = dayKey.split("-").map(Number);
  const localMidnight = Date.UTC(year, month - 1, day);
  let estimate = new Date(localMidnight);
  try {
    for (let iteration = 0; iteration < 3; iteration += 1) {
      estimate = new Date(localMidnight - timezoneOffsetMilliseconds(estimate, timezone));
    }
    return estimate;
  } catch {
    return new Date(localMidnight);
  }
}

export function utcDayBounds(date: Date, timezone: string) {
  const currentKey = calendarDayKey(date, timezone);
  const [year, month, day] = currentKey.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
  const nextKey = nextDate.toISOString().slice(0, 10);
  return {
    start: localMidnightAsUtc(currentKey, timezone),
    end: localMidnightAsUtc(nextKey, timezone),
  };
}

export function nextStreakDays(
  currentStreakDays: number,
  lastActiveDate: Date | null,
  activeAt: Date,
  timezone: string,
) {
  if (!lastActiveDate) return 1;
  const previousKey = calendarDayKey(lastActiveDate, timezone);
  const activeKey = calendarDayKey(activeAt, timezone);
  if (previousKey === activeKey) return Math.max(1, currentStreakDays);

  const previousDate = new Date(`${previousKey}T00:00:00.000Z`);
  const activeDate = new Date(`${activeKey}T00:00:00.000Z`);
  const differenceDays = Math.round(
    (activeDate.getTime() - previousDate.getTime()) / 86_400_000,
  );
  if (differenceDays === 1) return Math.max(0, currentStreakDays) + 1;
  if (differenceDays > 1) return 1;
  return Math.max(1, currentStreakDays);
}
