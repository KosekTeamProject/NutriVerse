export const DAILY_REWARD_POLICY = {
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
