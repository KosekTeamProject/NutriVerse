import { NextRequest, NextResponse } from "next/server";
import {
  ApiRequestError,
  apiErrorResponse,
  assertSameOrigin,
} from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reconcileActivityFinalization } from "@/server/activity/finalization-service";

type RouteContext = { params: Promise<{ activityId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdminUser();
    const { activityId } = await context.params;
    const activity = await prisma.activitySession.findUnique({
      where: { id: activityId },
    });
    if (!activity) {
      throw new ApiRequestError("Aktivitas tidak ditemukan.", 404);
    }
    if (!activity.endTime) {
      throw new ApiRequestError(
        "Aktivitas aktif belum dapat diproses ulang.",
        409,
      );
    }
    const result = await reconcileActivityFinalization(activity.id);
    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: "RETRY_ACTIVITY_FINALIZATION",
        entityName: "ActivitySession",
        entityId: activity.id,
        beforeState: {
          processingStatus: activity.processingStatus,
          processingAttempts: activity.processingAttempts,
        },
        afterState: {
          processingStatus: result.activity.processingStatus,
          processingAttempts: result.activity.processingAttempts,
        },
      },
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
