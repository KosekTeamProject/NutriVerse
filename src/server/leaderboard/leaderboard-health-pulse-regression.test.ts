import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("league leaderboard is ordered by Season XP, not Lifetime XP or Health Pulse", () => {
  const serviceSource = readFileSync(
    new URL("./leaderboard-service.ts", import.meta.url),
    "utf8",
  );
  const routeSource = readFileSync(
    new URL("../../app/api/leaderboard/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(serviceSource, /seasonParticipations/);
  assert.match(serviceSource, /rightXp\s*-\s*leftXp/);
  assert.match(routeSource, /seasonXp/);
  assert.match(routeSource, /right\.seasonXp\s*-\s*left\.seasonXp/);
  assert.doesNotMatch(serviceSource, /healthPulse/i);
  assert.doesNotMatch(routeSource, /healthPulse/i);
  assert.match(routeSource, /leaderboardVisible:\s*true/);
});
