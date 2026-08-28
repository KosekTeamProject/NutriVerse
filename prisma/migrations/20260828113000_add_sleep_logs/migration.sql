CREATE TABLE "sleep_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "durationHours" DOUBLE PRECISION NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sleep_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sleep_logs_duration_check" CHECK ("durationHours" > 0 AND "durationHours" <= 24)
);

CREATE INDEX "sleep_logs_userId_loggedAt_idx" ON "sleep_logs"("userId", "loggedAt");

ALTER TABLE "sleep_logs"
ADD CONSTRAINT "sleep_logs_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
