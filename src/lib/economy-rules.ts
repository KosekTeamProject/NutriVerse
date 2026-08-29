export const DAILY_REWARD_POLICY = {
  xp: {
    dailyCap: 300,
    fullRateUntil: 180,
    reducedRate: 0.5,
  },
  activityHp: {
    dailyCap: 60,
    fullRateUntil: 60,
    reducedRate: 1,
  },
} as const;

export const ACTIVITY_HP_RATE = 0.2;
export const ECONOMY_FORMULA_VERSION = "distance-v2";
