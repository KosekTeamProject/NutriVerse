import assert from "node:assert/strict";
import test from "node:test";
import { validateEventRewardConfig } from "@/server/events/event-reward-policy";

test("accepts ordered event rewards within guardrails", () => {
  assert.deepEqual(validateEventRewardConfig({ participationHp: 50, firstPlaceBonusHp: 500, secondPlaceBonusHp: 300, thirdPlaceBonusHp: 150 }), {
    participationHp: 50, firstPlaceBonusHp: 500, secondPlaceBonusHp: 300, thirdPlaceBonusHp: 150,
  });
});

test("rejects podium rewards that are not descending", () => {
  assert.throws(() => validateEventRewardConfig({ participationHp: 50, firstPlaceBonusHp: 100, secondPlaceBonusHp: 100, thirdPlaceBonusHp: 50 }), /EVENT_PODIUM_HP_ORDER/);
});
