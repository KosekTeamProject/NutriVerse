export const ACTIVITY_SESSION_HEARTBEAT_INTERVAL_MS = 10_000;
export const ACTIVITY_SESSION_LEASE_TIMEOUT_MS = 45_000;

type SessionLeaseInput = {
  updatedAt: Date;
  now?: Date;
  timeoutMs?: number;
};

/**
 * An unfinished activity may only be replaced when its browser lease has
 * expired. Active and paused trackers refresh the lease through heartbeats.
 */
export function activitySessionLeaseExpired({
  updatedAt,
  now = new Date(),
  timeoutMs = ACTIVITY_SESSION_LEASE_TIMEOUT_MS,
}: SessionLeaseInput) {
  if (!Number.isFinite(updatedAt.getTime()) || !Number.isFinite(now.getTime())) {
    return false;
  }
  return now.getTime() - updatedAt.getTime() >= timeoutMs;
}

export function abandonedActivityEndTime(input: {
  startTime: Date;
  updatedAt: Date;
  latestTelemetryAt?: Date | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const candidate = input.latestTelemetryAt ?? input.updatedAt;
  if (candidate <= input.startTime) return input.startTime;
  return candidate > now ? now : candidate;
}
