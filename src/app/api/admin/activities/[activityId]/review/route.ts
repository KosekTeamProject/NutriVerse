import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, stringValue } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  approveActivityReview,
  rejectActivityWithCompensation,
} from "@/server/activity/activity-review-service";
import { reconcileActivityFinalization } from "@/server/activity/finalization-service";
import { reconcileUserBadges } from "@/server/badges/badge-service";

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

    if (approved) {
      await approveActivityReview({
        activitySessionId: activityId,
        adminUserId: admin.id,
        reason,
      });
      const finalized = await reconcileActivityFinalization(activityId);
      return NextResponse.json({ success: true, ...finalized });
    }

    const reversal = await rejectActivityWithCompensation({
      activitySessionId: activityId,
      adminUserId: admin.id,
      reason,
    });
    await reconcileUserBadges(reversal.userId);
    const activity = await prisma.activitySession.findUnique({
      where: { id: activityId },
      include: { verificationResult: true },
    });
    return NextResponse.json({ success: true, activity, reversal });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
