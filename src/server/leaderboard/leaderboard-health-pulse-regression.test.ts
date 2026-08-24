import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("league leaderboard remains ordered by verified XP, not raw Health Pulse", () => {
  const serviceSource = readFileSync(
    new URL("./leaderboard-service.ts", import.meta.url),
    "utf8",
  );
  const routeSource = readFileSync(
    new URL("../../app/api/leaderboard/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(serviceSource, /totalXp:\s*"desc"/);
  assert.match(routeSource, /totalXp:\s*"desc"/);
  assert.doesNotMatch(serviceSource, /healthPulse/i);
  assert.doesNotMatch(routeSource, /healthPulse/i);
  assert.match(routeSource, /leaderboardVisible:\s*true/);
});
