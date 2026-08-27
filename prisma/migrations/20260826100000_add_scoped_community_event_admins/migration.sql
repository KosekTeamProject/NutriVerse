CREATE TABLE "event_admin_assignments" (
  "id" TEXT NOT NULL, "eventId" TEXT NOT NULL, "userId" TEXT NOT NULL, "assignedByUserId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "event_admin_assignments_pkey" PRIMARY KEY ("id"), CONSTRAINT "event_admin_assignments_eventId_userId_key" UNIQUE ("eventId", "userId"),
  CONSTRAINT "event_admin_assignments_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "event_admin_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "event_admin_assignments_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "event_admin_assignments_userId_idx" ON "event_admin_assignments"("userId");
CREATE TABLE "community_admin_assignments" (
  "id" TEXT NOT NULL, "guildId" TEXT NOT NULL, "userId" TEXT NOT NULL, "assignedByUserId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "community_admin_assignments_pkey" PRIMARY KEY ("id"), CONSTRAINT "community_admin_assignments_guildId_userId_key" UNIQUE ("guildId", "userId"),
  CONSTRAINT "community_admin_assignments_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "community_admin_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "community_admin_assignments_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "community_admin_assignments_userId_idx" ON "community_admin_assignments"("userId");
