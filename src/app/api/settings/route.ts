import { PrivacyLevel, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const booleanFields = [
  "locationPermissionGranted", "darkTheme", "leaderboardVisible",
  "challengeProgressVisible", "notificationsActivity", "notificationsLeaderboard",
  "notificationsSocial", "companionInsightsEnabled", "companionSafetyNotesEnabled",
  "useDemoData", "showSimulationLabels", "gpsSimulationEnabled", "foodSimulationEnabled",
] as const;
const privacyFields = ["profileVisibility", "pulseVisibility", "activityVisibility"] as const;

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const settings = await prisma.userSettings.findUnique({ where: { userId: user.id } });
    const companion = await prisma.companionPreference.findUnique({ where: { userId: user.id } });
    return NextResponse.json({ success: true, settings, companion });
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
    if (typeof body.timezone === "string" && body.timezone.length <= 80) data.timezone = body.timezone;
    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: { ...(data as Prisma.UserSettingsUncheckedCreateInput), userId: user.id },
      update: data,
    });
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
