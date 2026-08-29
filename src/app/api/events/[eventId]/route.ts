import { CmsPublicationStatus, EventApprovalStatus, EventRegistrationStatus, ExternalLinkStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { ApiRequestError, apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { eventId } = await context.params;
    const event = await prisma.event.findFirst({
      where: { id: eventId, isActive: true, status: CmsPublicationStatus.PUBLISHED, approvalStatus: EventApprovalStatus.APPROVED },
      select: {
        id: true, title: true, description: true, bannerUrl: true, startDate: true, endDate: true,
        location: true, capacity: true, createdByUserId: true,
        participationHp: true, firstPlaceBonusHp: true, secondPlaceBonusHp: true, thirdPlaceBonusHp: true,
        whatsappInviteUrl: true, whatsappLinkStatus: true,
        createdBy: { select: { id: true, name: true, username: true, avatarUrl: true } },
        registrations: { where: { userId: user.id }, select: { id: true, status: true, joinedAt: true } },
        _count: { select: { registrations: { where: { status: { in: [EventRegistrationStatus.JOINED, EventRegistrationStatus.ATTENDED] } } }, comments: true } },
      },
    });
    if (!event) throw new ApiRequestError("Event tidak ditemukan.", 404, "EVENT_NOT_FOUND");
    const { registrations, whatsappInviteUrl, whatsappLinkStatus, ...publicEvent } = event;
    return NextResponse.json({
      success: true,
      event: {
        ...publicEvent,
        isJoined: registrations.some((item) => item.status !== EventRegistrationStatus.CANCELLED),
        hasWhatsappGroup: whatsappLinkStatus === ExternalLinkStatus.APPROVED && Boolean(whatsappInviteUrl),
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
