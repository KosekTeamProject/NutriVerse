import { EventRegistrationStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  assertSameOrigin,
  stringValue,
} from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reconcileUserBadges } from "@/server/badges/badge-service";

type RouteContext = {
  params: Promise<{ eventId: string; registrationId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdminUser();
    const { eventId, registrationId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const requestedStatus =
      typeof body?.status === "string" ? body.status : null;
    const status =
      requestedStatus === EventRegistrationStatus.ATTENDED ||
      requestedStatus === EventRegistrationStatus.CANCELLED
        ? requestedStatus
        : null;
    if (!status) {
      return NextResponse.json(
        { success: false, error: "Status peserta tidak valid." },
        { status: 400 },
      );
    }
    const reason = stringValue(body?.reason, "Alasan", {
      min: 3,
      max: 500,
    });
    const existing = await prisma.eventRegistration.findFirst({
      where: { id: registrationId, eventId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Pendaftaran tidak ditemukan." },
        { status: 404 },
      );
    }
    const registration = await prisma.$transaction(
      async (transaction) => {
        const updated = await transaction.eventRegistration.update({
          where: { id: existing.id },
          data: {
            status,
            attendedAt:
              status === EventRegistrationStatus.ATTENDED
                ? new Date()
                : null,
          },
        });
        await transaction.auditLog.create({
          data: {
            actorUserId: admin.id,
            action: "REVIEW_EVENT_ATTENDANCE",
            entityName: "EventRegistration",
            entityId: existing.id,
            beforeState: { status: existing.status },
            afterState: { status },
            reason,
          },
        });
        return updated;
      },
    );
    if (status === EventRegistrationStatus.ATTENDED) {
      await reconcileUserBadges(existing.userId);
    }
    return NextResponse.json({ success: true, registration });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
