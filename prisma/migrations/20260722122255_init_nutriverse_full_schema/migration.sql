-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR', 'ANALYST');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('WALK', 'RUN', 'CYCLED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'NEEDS_REVIEW', 'NOT_VERIFIED', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'EVENT');

-- CreateEnum
CREATE TYPE "ChallengeTrustLevel" AS ENUM ('GPS_VERIFIED_ONLY', 'HABIT_SELF_REPORT');

-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('SPROUT', 'SEEDLING', 'RUNNER', 'CHALLENGER', 'PRO', 'ELITE', 'MASTER', 'CHAMPION', 'LEGEND');

-- CreateEnum
CREATE TYPE "LeaderboardScope" AS ENUM ('LEAGUE', 'FRIENDS', 'LOCAL');

-- CreateEnum
CREATE TYPE "LedgerType" AS ENUM ('XP_GRANT', 'XP_REVERSAL', 'HP_GRANT', 'HP_REDEEM', 'HP_EXPIRED', 'HP_REVERSAL');

-- CreateEnum
CREATE TYPE "RedemptionStatus" AS ENUM ('PENDING', 'FULFILLED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PrivacyLevel" AS ENUM ('PRIVATE', 'CIRCLE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'DISMISSED', 'ACTIONED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "gender" "Gender" NOT NULL DEFAULT 'PREFER_NOT_TO_SAY',
    "heightCm" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,
    "activityLevel" TEXT,
    "healthGoals" TEXT,
    "dailyStepTarget" INTEGER NOT NULL DEFAULT 8000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companionName" TEXT NOT NULL DEFAULT 'Nora',
    "morningBriefEnabled" BOOLEAN NOT NULL DEFAULT true,
    "weeklyLetterEnabled" BOOLEAN NOT NULL DEFAULT true,
    "breakReminderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "breakReminderIntervalMinutes" INTEGER NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companion_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileVisibility" "PrivacyLevel" NOT NULL DEFAULT 'PUBLIC',
    "pulseVisibility" "PrivacyLevel" NOT NULL DEFAULT 'PRIVATE',
    "activityVisibility" "PrivacyLevel" NOT NULL DEFAULT 'CIRCLE',
    "locationPermissionGranted" BOOLEAN NOT NULL DEFAULT false,
    "darkTheme" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_economies" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "currentHp" INTEGER NOT NULL DEFAULT 0,
    "currentTier" "Tier" NOT NULL DEFAULT 'SPROUT',
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_economies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xp_grants" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activitySessionId" TEXT,
    "challengeId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "capApplied" BOOLEAN NOT NULL DEFAULT false,
    "diminishingApplied" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "xp_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hp_ledger_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "LedgerType" NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "activitySessionId" TEXT,
    "redemptionId" TEXT,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hp_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "distanceMeters" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averagePace" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "caloriesBurned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "isSimulated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telemetry_samples" (
    "id" TEXT NOT NULL,
    "activitySessionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "altitude" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telemetry_samples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_results" (
    "id" TEXT NOT NULL,
    "activitySessionId" TEXT NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL,
    "reasonCodes" TEXT[],
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trustedDistanceMeters" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trustedDurationSeconds" INTEGER NOT NULL DEFAULT 0,
    "eligibleXp" INTEGER NOT NULL DEFAULT 0,
    "eligibleHp" INTEGER NOT NULL DEFAULT 0,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appeals" (
    "id" TEXT NOT NULL,
    "activitySessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "AppealStatus" NOT NULL DEFAULT 'PENDING',
    "reviewerAdminId" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appeals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenges" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ChallengeType" NOT NULL,
    "trustLevel" "ChallengeTrustLevel" NOT NULL DEFAULT 'GPS_VERIFIED_ONLY',
    "targetValue" DOUBLE PRECISION NOT NULL,
    "targetUnit" TEXT NOT NULL,
    "bonusXp" INTEGER NOT NULL DEFAULT 0,
    "bonusHp" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_progresses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "claimedXpGrantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_progresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboard_seasons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaderboard_seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rankings" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" "LeaderboardScope" NOT NULL DEFAULT 'LEAGUE',
    "tier" "Tier" NOT NULL DEFAULT 'SPROUT',
    "rankPosition" INTEGER NOT NULL,
    "totalVerifiedXp" INTEGER NOT NULL DEFAULT 0,
    "consistencyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rankings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rewards" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "partnerName" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "hpCost" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "expiryDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redemptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "hpSpent" INTEGER NOT NULL,
    "status" "RedemptionStatus" NOT NULL DEFAULT 'PENDING',
    "redemptionCode" TEXT NOT NULL,
    "fulfilledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activitySessionId" TEXT,
    "nutritionEntryId" TEXT,
    "journalEntryId" TEXT,
    "privacyLevel" "PrivacyLevel" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journey_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mood" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "foodName" TEXT NOT NULL,
    "calories" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "protein" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "recommendationText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nutrition_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_pulses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pulseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nutritionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sleepHours" DOUBLE PRECISION,
    "hydrationLiters" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_pulses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bannerUrl" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activitySessionId" TEXT,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "privacyLevel" "PrivacyLevel" NOT NULL DEFAULT 'PUBLIC',
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_reports" (
    "id" TEXT NOT NULL,
    "reporterUserId" TEXT NOT NULL,
    "momentId" TEXT,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "handledByAdmin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeState" JSONB,
    "afterState" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "health_profiles_userId_key" ON "health_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "companion_preferences_userId_key" ON "companion_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_economies_userId_key" ON "user_economies"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "xp_grants_idempotencyKey_key" ON "xp_grants"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "hp_ledger_entries_idempotencyKey_key" ON "hp_ledger_entries"("idempotencyKey");

-- CreateIndex
CREATE INDEX "telemetry_samples_activitySessionId_timestamp_idx" ON "telemetry_samples"("activitySessionId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "verification_results_activitySessionId_key" ON "verification_results"("activitySessionId");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_progresses_userId_challengeId_key" ON "challenge_progresses"("userId", "challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "badges_code_key" ON "badges"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_userId_badgeId_key" ON "user_badges"("userId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "rankings_seasonId_userId_scope_key" ON "rankings"("seasonId", "userId", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "redemptions_redemptionCode_key" ON "redemptions"("redemptionCode");

-- AddForeignKey
ALTER TABLE "health_profiles" ADD CONSTRAINT "health_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_preferences" ADD CONSTRAINT "companion_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_economies" ADD CONSTRAINT "user_economies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_grants" ADD CONSTRAINT "xp_grants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_grants" ADD CONSTRAINT "xp_grants_activitySessionId_fkey" FOREIGN KEY ("activitySessionId") REFERENCES "activity_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hp_ledger_entries" ADD CONSTRAINT "hp_ledger_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hp_ledger_entries" ADD CONSTRAINT "hp_ledger_entries_activitySessionId_fkey" FOREIGN KEY ("activitySessionId") REFERENCES "activity_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hp_ledger_entries" ADD CONSTRAINT "hp_ledger_entries_redemptionId_fkey" FOREIGN KEY ("redemptionId") REFERENCES "redemptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_sessions" ADD CONSTRAINT "activity_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry_samples" ADD CONSTRAINT "telemetry_samples_activitySessionId_fkey" FOREIGN KEY ("activitySessionId") REFERENCES "activity_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_results" ADD CONSTRAINT "verification_results_activitySessionId_fkey" FOREIGN KEY ("activitySessionId") REFERENCES "activity_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_activitySessionId_fkey" FOREIGN KEY ("activitySessionId") REFERENCES "activity_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_progresses" ADD CONSTRAINT "challenge_progresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_progresses" ADD CONSTRAINT "challenge_progresses_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "leaderboard_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_entries" ADD CONSTRAINT "journey_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_entries" ADD CONSTRAINT "journey_entries_activitySessionId_fkey" FOREIGN KEY ("activitySessionId") REFERENCES "activity_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_entries" ADD CONSTRAINT "journey_entries_nutritionEntryId_fkey" FOREIGN KEY ("nutritionEntryId") REFERENCES "nutrition_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_entries" ADD CONSTRAINT "journey_entries_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_entries" ADD CONSTRAINT "nutrition_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_pulses" ADD CONSTRAINT "health_pulses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moments" ADD CONSTRAINT "moments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moments" ADD CONSTRAINT "moments_activitySessionId_fkey" FOREIGN KEY ("activitySessionId") REFERENCES "activity_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
