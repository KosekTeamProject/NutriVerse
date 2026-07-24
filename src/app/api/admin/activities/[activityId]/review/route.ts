import { VerificationStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, stringValue } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateAndAwardUserBadges } from "@/server/badges/badge-service";
import { applyVerifiedActivityToChallenges } from "@/server/challenges/challenge-service";
import { awardVerifiedActivity } from "@/server/economy/economy-service";

type RouteContext = { params: Promise<{ activityId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdminUser();
    const { activityId } = await context.params;
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const approved = body?.approved === true;
    const reason = stringValue(body?.reason, "Alasan review", { min: 5, max: 500 });
    const existing = await prisma.activitySession.findUnique({ where: { id: activityId } });
    if (!existing) return NextResponse.json({ success: false, error: "Aktivitas tidak ditemukan." }, { status: 404 });
    const status = approved ? VerificationStatus.VERIFIED : VerificationStatus.NOT_VERIFIED;
    const activity = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.activitySession.update({
        where: { id: activityId },
        data: { verificationStatus: status },
      });
      await transaction.verificationResult.updateMany({
        where: { activitySessionId: activityId },
        data: { verificationStatus: status, processedAt: new Date() },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: approved ? "APPROVE_ACTIVITY" : "REJECT_ACTIVITY",
          entityName: "ActivitySession",
          entityId: activityId,
          beforeState: { verificationStatus: existing.verificationStatus },
          afterState: { verificationStatus: status },
          reason,
        },
      });
      return updated;
    });
    let reward = null;
    if (approved) {
      reward = await awardVerifiedActivity(activityId);
      await applyVerifiedActivityToChallenges(activityId);
      await evaluateAndAwardUserBadges(activity.userId);
    }
    return NextResponse.json({ success: true, activity, reward });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
