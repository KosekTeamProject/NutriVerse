import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const domain = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        healthProfile: { select: { onboardingCompleted: true } },
        companionPreference: { select: { companionName: true, companionAvatarId: true } },
        economy: true,
      },
    });
    return NextResponse.json({
      success: true,
      user: {
        ...user,
        onboardingCompleted: domain?.healthProfile?.onboardingCompleted ?? false,
        companionName: domain?.companionPreference?.companionName ?? "Nora",
        companionAvatarId: domain?.companionPreference?.companionAvatarId ?? "sparkles",
        economy: domain?.economy,
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
