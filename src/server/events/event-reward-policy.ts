export type EventRewardConfig = {
  participationHp: number;
  firstPlaceBonusHp: number;
  secondPlaceBonusHp: number;
  thirdPlaceBonusHp: number;
};

export function validateEventRewardConfig(config: EventRewardConfig) {
  const values = Object.fromEntries(
    Object.entries(config).map(([key, value]) => [key, Math.floor(Number(value))]),
  ) as EventRewardConfig;
  if (Object.values(values).some((value) => !Number.isFinite(value))) {
    throw new Error("EVENT_REWARD_INVALID");
  }
  if (values.participationHp < 25 || values.participationHp > 300) {
    throw new Error("EVENT_PARTICIPATION_HP_RANGE");
  }
  if (values.firstPlaceBonusHp < 1 || values.firstPlaceBonusHp > 1_500) {
    throw new Error("EVENT_FIRST_HP_RANGE");
  }
  if (values.secondPlaceBonusHp < 1 || values.secondPlaceBonusHp > 1_000) {
    throw new Error("EVENT_SECOND_HP_RANGE");
  }
  if (values.thirdPlaceBonusHp < 1 || values.thirdPlaceBonusHp > 750) {
    throw new Error("EVENT_THIRD_HP_RANGE");
  }
  if (
    values.firstPlaceBonusHp <= values.secondPlaceBonusHp ||
    values.secondPlaceBonusHp <= values.thirdPlaceBonusHp
  ) {
    throw new Error("EVENT_PODIUM_HP_ORDER");
  }
  return values;
}
