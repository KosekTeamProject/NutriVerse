import { Gender } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  assertSameOrigin,
  finiteNumber,
  stringArray,
  stringValue,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type OnboardingPayload = {
  name?: unknown;
  username?: unknown;
  birthDate?: unknown;
  age?: unknown;
  gender?: unknown;
  heightCm?: unknown;
  weightKg?: unknown;
  targetWeightKg?: unknown;
  healthGoals?: unknown;
  activityLevel?: unknown;
  dailyStepTarget?: unknown;
  preferredActivities?: unknown;
  dietaryPreferences?: unknown;
  allergies?: unknown;
  favoriteFoods?: unknown;
  favoriteWorkoutTime?: unknown;
  companionName?: unknown;
  companionAvatarId?: unknown;
};

function genderValue(value: unknown) {
  const values: Record<string, Gender> = {
    MALE: Gender.MALE,
    FEMALE: Gender.FEMALE,
    OTHER: Gender.OTHER,
    PREFER_NOT_TO_SAY: Gender.PREFER_NOT_TO_SAY,
    "Laki-laki": Gender.MALE,
    Perempuan: Gender.FEMALE,
  };
  return typeof value === "string" ? values[value] ?? Gender.PREFER_NOT_TO_SAY : Gender.PREFER_NOT_TO_SAY;
}

function birthDateValue(birthDate: unknown, age: unknown) {
  if (typeof birthDate === "string") {
    const parsed = new Date(birthDate);
    if (!Number.isNaN(parsed.getTime()) && parsed < new Date()) return parsed;
  }
  if (typeof age === "number" && Number.isInteger(age) && age >= 13 && age <= 120) {
    const result = new Date();
    result.setUTCFullYear(result.getUTCFullYear() - age);
    return result;
  }
  return undefined;
}

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatarUrl: true,
        healthProfile: true,
        companionPreference: true,
      },
    });
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as OnboardingPayload | null;
    if (!body) throw new Error("INVALID_PAYLOAD");

    const name = stringValue(body.name, "Nama", { min: 2, max: 100 });
    const username =
      typeof body.username === "string" && body.username.trim()
        ? stringValue(body.username, "Username", { min: 3, max: 30 })
            .toLowerCase()
            .replace(/[^a-z0-9._-]/g, "")
        : undefined;
    const heightCm = finiteNumber(body.heightCm, "Tinggi badan", { min: 80, max: 250 });
    const weightKg = finiteNumber(body.weightKg, "Berat badan", { min: 20, max: 400 });
    const targetWeightKg = finiteNumber(body.targetWeightKg, "Target berat", {
      min: 20,
      max: 400,
      optional: true,
    });
    const dailyStepTarget = finiteNumber(body.dailyStepTarget, "Target langkah", {
      min: 1000,
      max: 100000,
    });
    const birthDate = birthDateValue(body.birthDate, body.age);
    if (!birthDate) {
      return NextResponse.json({ success: false, error: "Usia atau tanggal lahir tidak valid." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (transaction) => {
      const updatedUser = await transaction.user.update({
        where: { id: user.id },
        data: { name, ...(username ? { username } : {}) },
      });
      const healthProfile = await transaction.healthProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          birthDate,
          gender: genderValue(body.gender),
          heightCm,
          weightKg,
          targetWeightKg,
          healthGoals: stringValue(body.healthGoals, "Tujuan kesehatan", { max: 200 }),
          activityLevel: stringValue(body.activityLevel, "Tingkat aktivitas", { max: 50 }),
          dailyStepTarget: Math.round(dailyStepTarget),
          preferredActivities: stringArray(body.preferredActivities ?? [], "Aktivitas"),
          dietaryPreferences: stringArray(body.dietaryPreferences ?? [], "Preferensi makanan"),
          allergies: stringArray(body.allergies ?? [], "Alergi"),
          favoriteFoods: stringArray(body.favoriteFoods ?? [], "Makanan favorit"),
          favoriteWorkoutTime: stringValue(body.favoriteWorkoutTime, "Waktu olahraga", {
            max: 100,
            optional: true,
          }),
          onboardingCompleted: true,
        },
        update: {
          birthDate,
          gender: genderValue(body.gender),
          heightCm,
          weightKg,
          targetWeightKg,
          healthGoals: stringValue(body.healthGoals, "Tujuan kesehatan", { max: 200 }),
          activityLevel: stringValue(body.activityLevel, "Tingkat aktivitas", { max: 50 }),
          dailyStepTarget: Math.round(dailyStepTarget),
          preferredActivities: stringArray(body.preferredActivities ?? [], "Aktivitas"),
          dietaryPreferences: stringArray(body.dietaryPreferences ?? [], "Preferensi makanan"),
          allergies: stringArray(body.allergies ?? [], "Alergi"),
          favoriteFoods: stringArray(body.favoriteFoods ?? [], "Makanan favorit"),
          favoriteWorkoutTime: stringValue(body.favoriteWorkoutTime, "Waktu olahraga", {
            max: 100,
            optional: true,
          }),
          onboardingCompleted: true,
        },
      });
      const companionPreference = await transaction.companionPreference.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          companionName: stringValue(body.companionName, "Nama companion", { min: 2, max: 30 }),
          companionAvatarId: stringValue(body.companionAvatarId, "Avatar companion", { max: 50 }),
        },
        update: {
          companionName: stringValue(body.companionName, "Nama companion", { min: 2, max: 30 }),
          companionAvatarId: stringValue(body.companionAvatarId, "Avatar companion", { max: 50 }),
        },
      });
      await transaction.healthMetric.create({
        data: {
          userId: user.id,
          heightCm,
          weightKg,
          bmi: weightKg / (heightCm / 100) ** 2,
        },
      });
      return { user: updatedUser, healthProfile, companionPreference };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_PAYLOAD") {
      return NextResponse.json({ success: false, error: "Payload tidak valid." }, { status: 400 });
    }
    return apiErrorResponse(error);
  }
}
