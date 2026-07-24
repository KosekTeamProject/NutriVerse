import { VerificationStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyStoredActivity } from "@/server/activity/activity-service";
import { evaluateAndAwardUserBadges } from "@/server/badges/badge-service";
import { applyVerifiedActivityToChallenges } from "@/server/challenges/challenge-service";
import { awardVerifiedActivity } from "@/server/economy/economy-service";

type RouteContext = { params: Promise<{ activityId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { activityId } = await context.params;
    const body = (await request.json().catch(() => null)) as { endTime?: unknown } | null;
    const session = await prisma.activitySession.findFirst({
      where: { id: activityId, userId: user.id },
      include: { verificationResult: true },
    });
    if (!session) return NextResponse.json({ success: false, error: "Aktivitas tidak ditemukan." }, { status: 404 });
    if (session.verificationResult) {
      return NextResponse.json({
        success: true,
        activity: session,
        verification: session.verificationResult,
        idempotentReplay: true,
      });
    }
    const endTime = typeof body?.endTime === "string" ? new Date(body.endTime) : new Date();
    if (Number.isNaN(endTime.getTime()) || endTime <= session.startTime) {
      return NextResponse.json({ success: false, error: "Waktu selesai tidak valid." }, { status: 400 });
    }
    await prisma.activitySession.update({ where: { id: session.id }, data: { endTime } });
    const verification = await verifyStoredActivity(session.id);
    let reward = null;
    let challengeProgress = null;
    let badges = null;
    if (verification.verificationStatus === VerificationStatus.VERIFIED) {
      reward = await awardVerifiedActivity(session.id);
      challengeProgress = await applyVerifiedActivityToChallenges(session.id);
      badges = await evaluateAndAwardUserBadges(user.id);
    }
    const activity = await prisma.activitySession.findUnique({
      where: { id: session.id },
      include: { verificationResult: true },
    });
    return NextResponse.json({
      success: true,
      activity,
      verification,
      reward,
      challengeProgress,
      badges,
      idempotentReplay: false,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
