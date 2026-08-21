import {
  CmsPublicationStatus,
  EventApprovalStatus,
  EventRegistrationStatus,
  NotificationType,
  Prisma,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  ApiRequestError,
  apiErrorResponse,
  assertSameOrigin,
  enforceRateLimit,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUserNotification } from "@/server/notifications/notification-service";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "event:join", 20, 60_000);
    const user = await requireCurrentUser();
    const { eventId } = await context.params;
    const registration = await prisma.$transaction(
      async (transaction) => {
        const event = await transaction.event.findUnique({
          where: { id: eventId },
        });
        if (!event || !event.isActive || event.status !== CmsPublicationStatus.PUBLISHED || event.approvalStatus !== EventApprovalStatus.APPROVED || event.endDate <= new Date()) {
          throw new ApiRequestError(
            "Event tidak tersedia.",
            404,
            "EVENT_NOT_AVAILABLE",
          );
        }
        const existing = await transaction.eventRegistration.findUnique({
          where: { eventId_userId: { eventId, userId: user.id } },
        });
        if (
          existing?.status === EventRegistrationStatus.JOINED ||
          existing?.status === EventRegistrationStatus.ATTENDED
        ) {
          return existing;
        }
        if (event.capacity > 0) {
          const occupied = await transaction.eventRegistration.count({
            where: {
              eventId,
              status: {
                in: [
                  EventRegistrationStatus.JOINED,
                  EventRegistrationStatus.ATTENDED,
                ],
              },
            },
          });
          if (occupied >= event.capacity) {
            throw new ApiRequestError(
              "Kapasitas event sudah penuh.",
              409,
              "EVENT_FULL",
            );
          }
        }
        const registration = await transaction.eventRegistration.upsert({
          where: { eventId_userId: { eventId, userId: user.id } },
          create: { eventId, userId: user.id },
          update: {
            status: EventRegistrationStatus.JOINED,
            joinedAt: new Date(),
            attendedAt: null,
          },
        });
        await createUserNotification(
          {
            userId: user.id,
            type: NotificationType.EVENT,
            title: "Pendaftaran event berhasil",
            message: `Kamu terdaftar pada event ${event.title}.`,
          },
          transaction,
        );
        return registration;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 15_000,
      },
    );
    return NextResponse.json({ success: true, registration }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { eventId } = await context.params;
    const result = await prisma.eventRegistration.updateMany({
      where: {
        eventId,
        userId: user.id,
        status: EventRegistrationStatus.JOINED,
      },
      data: { status: EventRegistrationStatus.CANCELLED },
    });
    if (!result.count) {
      return NextResponse.json(
        { success: false, error: "Pendaftaran aktif tidak ditemukan." },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
