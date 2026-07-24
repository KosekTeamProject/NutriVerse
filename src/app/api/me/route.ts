import { Gender, Prisma, PrivacyLevel } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ownedPublicStorageUrl } from "@/lib/storage-ownership";

type JsonObject = Record<string, unknown>;

function objectValue(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function optionalString(value: unknown, maxLength: number) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") throw new Error("INVALID_INPUT");
  const clean = value.trim();
  if (clean.length > maxLength) throw new Error("INVALID_INPUT");
  return clean || null;
}

function optionalPositiveNumber(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error("INVALID_INPUT");
  }
  return value;
}

function optionalBoolean(value: unknown) {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") throw new Error("INVALID_INPUT");
  return value;
}

function optionalGender(value: unknown) {
  if (value === undefined) return undefined;
  return Object.values(Gender).includes(value as Gender) ? (value as Gender) : undefined;
}

function optionalPrivacy(value: unknown) {
  if (value === undefined) return undefined;
  return Object.values(PrivacyLevel).includes(value as PrivacyLevel)
    ? (value as PrivacyLevel)
    : undefined;
}

const profileInclude = {
  healthProfile: true,
  companionPreference: true,
  settings: true,
  economy: true,
  badges: { include: { badge: true }, orderBy: { earnedAt: "desc" as const } },
} satisfies Prisma.UserInclude;

export async function GET() {
  try {
    const currentUser = await requireCurrentUser();
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: profileInclude,
    });
    return NextResponse.json({ success: true, user });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const currentUser = await requireCurrentUser();
    const raw = await request.json().catch(() => null);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return NextResponse.json({ success: false, error: "Payload tidak valid." }, { status: 400 });
    }

    const body = raw as JsonObject;
    const health = objectValue(body.healthProfile);
    const settings = objectValue(body.settings);
    const companion = objectValue(body.companionPreference);

    const name = optionalString(body.name, 100);
    const avatarUrl = optionalString(body.avatarUrl, 2048);
    const validatedAvatarUrl =
      avatarUrl === undefined || avatarUrl === null
        ? avatarUrl
        : ownedPublicStorageUrl(
            avatarUrl,
            currentUser.authUserId,
            ["avatars"],
          );
    if (avatarUrl && !validatedAvatarUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Avatar harus berasal dari upload milik pengguna.",
        },
        { status: 400 },
      );
    }
    const birthDate =
      health.birthDate === undefined
        ? undefined
        : health.birthDate === null
          ? null
          : new Date(String(health.birthDate));
    if (birthDate instanceof Date && Number.isNaN(birthDate.getTime())) {
      return NextResponse.json({ success: false, error: "Tanggal lahir tidak valid." }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        ...(name ? { name } : {}),
        ...(validatedAvatarUrl !== undefined
          ? { avatarUrl: validatedAvatarUrl }
          : {}),
        healthProfile: {
          upsert: {
            create: {
              birthDate,
              gender: optionalGender(health.gender),
              heightCm: optionalPositiveNumber(health.heightCm),
              weightKg: optionalPositiveNumber(health.weightKg),
              activityLevel: optionalString(health.activityLevel, 80),
              healthGoals: optionalString(health.healthGoals, 500),
              dailyStepTarget:
                health.dailyStepTarget === undefined
                  ? undefined
                  : Math.round(optionalPositiveNumber(health.dailyStepTarget) ?? 8000),
            },
            update: {
              birthDate,
              gender: optionalGender(health.gender),
              heightCm: optionalPositiveNumber(health.heightCm),
              weightKg: optionalPositiveNumber(health.weightKg),
              activityLevel: optionalString(health.activityLevel, 80),
              healthGoals: optionalString(health.healthGoals, 500),
              dailyStepTarget:
                health.dailyStepTarget === undefined
                  ? undefined
                  : Math.round(optionalPositiveNumber(health.dailyStepTarget) ?? 8000),
            },
          },
        },
        settings: {
          upsert: {
            create: {
              profileVisibility: optionalPrivacy(settings.profileVisibility),
              pulseVisibility: optionalPrivacy(settings.pulseVisibility),
              activityVisibility: optionalPrivacy(settings.activityVisibility),
              locationPermissionGranted: optionalBoolean(settings.locationPermissionGranted),
              darkTheme: optionalBoolean(settings.darkTheme),
            },
            update: {
              profileVisibility: optionalPrivacy(settings.profileVisibility),
              pulseVisibility: optionalPrivacy(settings.pulseVisibility),
              activityVisibility: optionalPrivacy(settings.activityVisibility),
              locationPermissionGranted: optionalBoolean(settings.locationPermissionGranted),
              darkTheme: optionalBoolean(settings.darkTheme),
            },
          },
        },
        companionPreference: {
          upsert: {
            create: {
              companionName: optionalString(companion.companionName, 40) ?? undefined,
              morningBriefEnabled: optionalBoolean(companion.morningBriefEnabled),
              weeklyLetterEnabled: optionalBoolean(companion.weeklyLetterEnabled),
              breakReminderEnabled: optionalBoolean(companion.breakReminderEnabled),
              breakReminderIntervalMinutes:
                companion.breakReminderIntervalMinutes === undefined
                  ? undefined
                  : Math.round(optionalPositiveNumber(companion.breakReminderIntervalMinutes) ?? 60),
            },
            update: {
              companionName: optionalString(companion.companionName, 40) ?? undefined,
              morningBriefEnabled: optionalBoolean(companion.morningBriefEnabled),
              weeklyLetterEnabled: optionalBoolean(companion.weeklyLetterEnabled),
              breakReminderEnabled: optionalBoolean(companion.breakReminderEnabled),
              breakReminderIntervalMinutes:
                companion.breakReminderIntervalMinutes === undefined
                  ? undefined
                  : Math.round(optionalPositiveNumber(companion.breakReminderIntervalMinutes) ?? 60),
            },
          },
        },
      },
      include: profileInclude,
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_INPUT") {
      return NextResponse.json({ success: false, error: "Nilai profil tidak valid." }, { status: 400 });
    }
    return apiErrorResponse(error);
  }
}
