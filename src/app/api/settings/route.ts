import { Gender, MomentCommentMode, MomentLikerListVisibility, PrivacyLevel, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, ApiRequestError, assertSameOrigin, finiteNumber, stringValue } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const booleanFields = [
  "locationPermissionGranted", "darkTheme", "leaderboardVisible",
  "challengeProgressVisible", "notificationsActivity", "notificationsLeaderboard",
  "notificationsSocial", "companionInsightsEnabled", "companionSafetyNotesEnabled",
  "notificationsMomentLikes", "notificationsMomentComments", "notificationsCommunity",
  "defaultMomentShowLikeCount",
  "useDemoData", "showSimulationLabels", "gpsSimulationEnabled", "foodSimulationEnabled",
] as const;
const privacyFields = ["profileVisibility", "pulseVisibility", "activityVisibility"] as const;

function validatedBirthDate(value: unknown) {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiRequestError("Tanggal lahir wajib diisi.");
  }
  const birthDate = new Date(`${value.trim()}T00:00:00.000Z`);
  if (Number.isNaN(birthDate.getTime())) {
    throw new ApiRequestError("Tanggal lahir tidak valid.");
  }
  const now = new Date();
  const youngest = new Date(Date.UTC(now.getUTCFullYear() - 13, now.getUTCMonth(), now.getUTCDate()));
  const oldest = new Date(Date.UTC(now.getUTCFullYear() - 120, now.getUTCMonth(), now.getUTCDate()));
  if (birthDate > youngest || birthDate < oldest) {
    throw new ApiRequestError("Usia harus berada di antara 13 dan 120 tahun.");
  }
  return birthDate;
}

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const [settings, companion, healthProfile] = await Promise.all([
      prisma.userSettings.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      }),
      prisma.companionPreference.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      }),
      prisma.healthProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      }),
    ]);
    return NextResponse.json({
      success: true,
      settings,
      companion,
      healthProfile,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ success: false, error: "Payload tidak valid." }, { status: 400 });
    const data: Prisma.UserSettingsUpdateInput = {};
    for (const field of booleanFields) {
      if (typeof body[field] === "boolean") data[field] = body[field];
    }
    for (const field of privacyFields) {
      if (typeof body[field] === "string" && Object.values(PrivacyLevel).includes(body[field] as PrivacyLevel)) {
        data[field] = body[field] as PrivacyLevel;
      }
    }
    if (typeof body.defaultMomentLikerList === "string" && Object.values(MomentLikerListVisibility).includes(body.defaultMomentLikerList as MomentLikerListVisibility)) {
      data.defaultMomentLikerList = body.defaultMomentLikerList as MomentLikerListVisibility;
    }
    if (typeof body.defaultMomentComments === "string" && Object.values(MomentCommentMode).includes(body.defaultMomentComments as MomentCommentMode)) {
      data.defaultMomentComments = body.defaultMomentComments as MomentCommentMode;
    }
    if (Array.isArray(body.momentHiddenWords)) {
      const hiddenWords = [...new Set(body.momentHiddenWords
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim().toLowerCase())
        .filter((value) => value.length >= 2 && value.length <= 40))]
        .slice(0, 50);
      data.momentHiddenWords = hiddenWords;
    }
    if (typeof body.timezone === "string" && body.timezone.length <= 80) {
      try {
        new Intl.DateTimeFormat("id-ID", { timeZone: body.timezone }).format();
        data.timezone = body.timezone;
      } catch {
        return NextResponse.json(
          { success: false, error: "Zona waktu tidak valid." },
          { status: 400 },
        );
      }
    }
    if (body.leaderboardRegion === null || body.leaderboardRegion === "") {
      data.leaderboardRegion = null;
    } else if (
      typeof body.leaderboardRegion === "string" &&
      body.leaderboardRegion.trim().length >= 2 &&
      body.leaderboardRegion.trim().length <= 80
    ) {
      data.leaderboardRegion = body.leaderboardRegion.trim().toUpperCase();
    }
    if (
      typeof body.rawGpsRetentionDays === "number" &&
      Number.isInteger(body.rawGpsRetentionDays) &&
      body.rawGpsRetentionDays >= 1 &&
      body.rawGpsRetentionDays <= 3650
    ) {
      data.rawGpsRetentionDays = body.rawGpsRetentionDays;
    }

    const dailyStepTarget = finiteNumber(body.dailyStepTarget, "Target langkah", {
      min: 1_000,
      max: 100_000,
      optional: true,
    });
    const dailyCalorieTarget = finiteNumber(body.dailyCalorieTarget, "Target kalori", {
      min: 500,
      max: 10_000,
      optional: true,
    });
    const dailyProteinTargetGrams = finiteNumber(
      body.dailyProteinTargetGrams,
      "Target protein",
      { min: 10, max: 1_000, optional: true },
    );
    const dailyCarbTargetGrams = finiteNumber(
      body.dailyCarbTargetGrams,
      "Target karbohidrat",
      { min: 10, max: 2_000, optional: true },
    );
    const dailyFiberTargetGrams = finiteNumber(
      body.dailyFiberTargetGrams,
      "Target serat",
      { min: 1, max: 200, optional: true },
    );
    const dailyWaterTargetMl = finiteNumber(body.dailyWaterTargetMl, "Target air", {
      min: 250,
      max: 10_000,
      optional: true,
    });
    const dailySleepTargetHours = finiteNumber(
      body.dailySleepTargetHours,
      "Target tidur",
      { min: 1, max: 24, optional: true },
    );
    const dailyActiveTargetMinutes = finiteNumber(
      body.dailyActiveTargetMinutes,
      "Target menit aktif",
      { min: 1, max: 1_440, optional: true },
    );
    const birthDate = validatedBirthDate(body.birthDate);
    const gender = body.gender === undefined
      ? undefined
      : Object.values(Gender).includes(body.gender as Gender)
        ? body.gender as Gender
        : Gender.PREFER_NOT_TO_SAY;
    const heightCm = finiteNumber(body.heightCm, "Tinggi badan", {
      min: 80,
      max: 250,
      optional: true,
    });
    const weightKg = finiteNumber(body.weightKg, "Berat badan", {
      min: 20,
      max: 400,
      optional: true,
    });
    const targetWeightKg = body.targetWeightKg === null
      ? null
      : finiteNumber(body.targetWeightKg, "Target berat", {
          min: 20,
          max: 400,
          optional: true,
        });
    const activityLevel = body.activityLevel === undefined
      ? undefined
      : stringValue(body.activityLevel, "Tingkat aktivitas", { min: 2, max: 50 });
    const healthGoals = body.healthGoals === undefined
      ? undefined
      : stringValue(body.healthGoals, "Tujuan kesehatan", { min: 2, max: 200 });
    const personalContextRequested = [
      "birthDate", "gender", "heightCm", "weightKg", "targetWeightKg",
      "activityLevel", "healthGoals", "companionName", "companionAvatarId",
    ].some((field) => body[field] !== undefined);
    const existingHealthProfile = personalContextRequested
      ? await prisma.healthProfile.findUnique({ where: { userId: user.id } })
      : null;
    const existingCompanion = personalContextRequested
      ? await prisma.companionPreference.findUnique({ where: { userId: user.id } })
      : null;
    const companionName = body.companionName === undefined
      ? existingCompanion?.companionName ?? "Nora"
      : stringValue(body.companionName, "Nama companion", { min: 2, max: 30 });
    const companionAvatarId = body.companionAvatarId === undefined
      ? existingCompanion?.companionAvatarId ?? "sparkles"
      : stringValue(body.companionAvatarId, "Avatar companion", { min: 2, max: 50 });
    const mergedPersonalContext = {
      birthDate: birthDate ?? existingHealthProfile?.birthDate,
      heightCm: heightCm ?? existingHealthProfile?.heightCm,
      weightKg: weightKg ?? existingHealthProfile?.weightKg,
      activityLevel: activityLevel ?? existingHealthProfile?.activityLevel,
      healthGoals: healthGoals ?? existingHealthProfile?.healthGoals,
      companionName,
      companionAvatarId,
    };
    const onboardingCompleted = personalContextRequested && Boolean(
      mergedPersonalContext.birthDate
      && mergedPersonalContext.heightCm
      && mergedPersonalContext.weightKg
      && mergedPersonalContext.activityLevel?.trim()
      && mergedPersonalContext.healthGoals?.trim()
      && mergedPersonalContext.companionName.trim()
      && mergedPersonalContext.companionAvatarId.trim()
    );
    const healthProfileData = {
      ...(birthDate !== undefined ? { birthDate } : {}),
      ...(gender !== undefined ? { gender } : {}),
      ...(heightCm !== undefined ? { heightCm } : {}),
      ...(weightKg !== undefined ? { weightKg } : {}),
      ...(targetWeightKg !== undefined ? { targetWeightKg } : {}),
      ...(activityLevel !== undefined ? { activityLevel } : {}),
      ...(healthGoals !== undefined ? { healthGoals } : {}),
      ...(personalContextRequested ? { onboardingCompleted } : {}),
      ...(dailyStepTarget !== undefined
        ? { dailyStepTarget: Math.round(dailyStepTarget) }
        : {}),
      ...(dailyCalorieTarget !== undefined
        ? { dailyCalorieTarget: Math.round(dailyCalorieTarget) }
        : {}),
      ...(dailyProteinTargetGrams !== undefined
        ? { dailyProteinTargetGrams: Math.round(dailyProteinTargetGrams) }
        : {}),
      ...(dailyCarbTargetGrams !== undefined
        ? { dailyCarbTargetGrams: Math.round(dailyCarbTargetGrams) }
        : {}),
      ...(dailyFiberTargetGrams !== undefined
        ? { dailyFiberTargetGrams: Math.round(dailyFiberTargetGrams) }
        : {}),
      ...(dailyWaterTargetMl !== undefined
        ? { dailyWaterTargetMl: Math.round(dailyWaterTargetMl) }
        : {}),
      ...(dailySleepTargetHours !== undefined ? { dailySleepTargetHours } : {}),
      ...(dailyActiveTargetMinutes !== undefined
        ? { dailyActiveTargetMinutes: Math.round(dailyActiveTargetMinutes) }
        : {}),
    };

    const companionData: Prisma.CompanionPreferenceUpdateInput = {};
    if (body.companionName !== undefined) {
      companionData.companionName = companionName;
    }
    if (body.companionAvatarId !== undefined) {
      companionData.companionAvatarId = companionAvatarId;
    }
    if (typeof body.morningBriefEnabled === "boolean") {
      companionData.morningBriefEnabled = body.morningBriefEnabled;
    }
    if (typeof body.weeklyLetterEnabled === "boolean") {
      companionData.weeklyLetterEnabled = body.weeklyLetterEnabled;
    }
    if (typeof body.breakReminderEnabled === "boolean") {
      companionData.breakReminderEnabled = body.breakReminderEnabled;
    }
    if (
      typeof body.breakReminderIntervalMinutes === "number" &&
      [60, 90, 120].includes(body.breakReminderIntervalMinutes)
    ) {
      companionData.breakReminderIntervalMinutes =
        body.breakReminderIntervalMinutes;
    }

    const [settings, companion, healthProfile] = await prisma.$transaction([
      prisma.userSettings.upsert({
        where: { userId: user.id },
        create: {
          ...(data as Prisma.UserSettingsUncheckedCreateInput),
          userId: user.id,
        },
        update: data,
      }),
      prisma.companionPreference.upsert({
        where: { userId: user.id },
        create: {
          ...(companionData as Prisma.CompanionPreferenceUncheckedCreateInput),
          userId: user.id,
        },
        update: companionData,
      }),
      prisma.healthProfile.upsert({
        where: { userId: user.id },
        create: {
          ...healthProfileData,
          userId: user.id,
        },
        update: healthProfileData,
      }),
    ]);
    return NextResponse.json({
      success: true,
      settings,
      companion,
      healthProfile,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
