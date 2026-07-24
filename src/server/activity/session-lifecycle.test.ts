import assert from "node:assert/strict";
import test from "node:test";
import {
  abandonedActivityEndTime,
  activitySessionLeaseExpired,
  ACTIVITY_SESSION_LEASE_TIMEOUT_MS,
} from "./session-lifecycle";

test("lease aktivitas yang masih menerima heartbeat tidak dianggap terlantar", () => {
  const now = new Date("2026-07-24T12:00:45.000Z");
  assert.equal(
    activitySessionLeaseExpired({
      updatedAt: new Date(now.getTime() - ACTIVITY_SESSION_LEASE_TIMEOUT_MS + 1),
      now,
    }),
    false,
  );
});

test("lease aktivitas kedaluwarsa tepat pada batas timeout", () => {
  const now = new Date("2026-07-24T12:00:45.000Z");
  assert.equal(
    activitySessionLeaseExpired({
      updatedAt: new Date(now.getTime() - ACTIVITY_SESSION_LEASE_TIMEOUT_MS),
      now,
    }),
    true,
  );
});

test("waktu penutupan sesi terlantar memakai telemetry terakhir", () => {
  const startTime = new Date("2026-07-24T12:00:00.000Z");
  const latestTelemetryAt = new Date("2026-07-24T12:05:00.000Z");
  assert.equal(
    abandonedActivityEndTime({
      startTime,
      updatedAt: new Date("2026-07-24T12:06:00.000Z"),
      latestTelemetryAt,
      now: new Date("2026-07-24T12:10:00.000Z"),
    }).toISOString(),
    latestTelemetryAt.toISOString(),
  );
});

test("waktu penutupan sesi tidak boleh mendahului waktu mulai", () => {
  const startTime = new Date("2026-07-24T12:00:00.000Z");
  assert.equal(
    abandonedActivityEndTime({
      startTime,
      updatedAt: new Date("2026-07-24T11:59:00.000Z"),
      now: new Date("2026-07-24T12:10:00.000Z"),
    }).toISOString(),
    startTime.toISOString(),
  );
});
