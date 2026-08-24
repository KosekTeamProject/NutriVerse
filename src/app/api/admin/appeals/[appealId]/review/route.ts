import { AppealStatus, NotificationType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  assertSameOrigin,
  stringValue,
} from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { approveActivityReview } from "@/server/activity/activity-review-service";
import { reconcileActivityFinalization } from "@/server/activity/finalization-service";
import {
  createUserNotification,
  resolveUserNotificationsByActionKey,
} from "@/server/notifications/notification-service";

type RouteContext = { params: Promise<{ appealId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdminUser();
    const { appealId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const requestedStatus =
      typeof body?.status === "string" ? body.status : null;
    const status =
      requestedStatus === AppealStatus.APPROVED ||
      requestedStatus === AppealStatus.REJECTED
        ? requestedStatus
        : null;
    if (!status) {
      return NextResponse.json(
        { success: false, error: "Keputusan banding tidak valid." },
        { status: 400 },
      );
    }
    const notes = stringValue(body?.notes, "Catatan review", {
      min: 5,
      max: 1_000,
    });
    const appeal = await prisma.appeal.findUnique({
      where: { id: appealId },
    });
    if (!appeal) {
      return NextResponse.json(
        { success: false, error: "Banding tidak ditemukan." },
        { status: 404 },
      );
    }
    if (appeal.status !== AppealStatus.PENDING) {
      return NextResponse.json(
        { success: false, error: "Banding sudah diputuskan." },
        { status: 409 },
      );
    }

    let finalization = null;
    if (status === AppealStatus.APPROVED) {
      await approveActivityReview({
        activitySessionId: appeal.activitySessionId,
        adminUserId: admin.id,
        reason: notes,
      });
      finalization = await reconcileActivityFinalization(
        appeal.activitySessionId,
      );
    }

    const reviewed = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.appeal.update({
        where: { id: appeal.id },
        data: {
          status,
          reviewerAdminId: admin.id,
          reviewNotes: notes,
        },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: admin.id,
          action:
            status === AppealStatus.APPROVED
              ? "APPROVE_APPEAL"
              : "REJECT_APPEAL",
          entityName: "Appeal",
          entityId: appeal.id,
          beforeState: { status: appeal.status },
          afterState: { status },
          reason: notes,
        },
      });
      await resolveUserNotificationsByActionKey(
        appeal.userId,
        `activity-appeal:${appeal.activitySessionId}`,
        transaction,
      );
      if (status === AppealStatus.REJECTED) {
        await createUserNotification(
          {
            userId: appeal.userId,
            type: NotificationType.ACTIVITY,
            title: "Banding aktivitas selesai ditinjau",
            message: `Bandingmu belum dapat disetujui. Catatan reviewer: ${notes}`,
            respectPreferences: false,
            actionUrl: `/aktivitas/${appeal.activitySessionId}`,
            dedupeKey: `activity-appeal-rejected:${appeal.id}`,
          },
          transaction,
        );
      }
      return updated;
    });

    return NextResponse.json({
      success: true,
      appeal: reviewed,
      finalization,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
