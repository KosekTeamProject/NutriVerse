import { EventApprovalStatus, EventRegistrationStatus, ExternalLinkStatus } from "@prisma/client";
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
      where: { id: eventId, approvalStatus: EventApprovalStatus.APPROVED, whatsappLinkStatus: ExternalLinkStatus.APPROVED, whatsappInviteUrl: { not: null }, registrations: { some: { userId: user.id, status: { in: [EventRegistrationStatus.JOINED, EventRegistrationStatus.ATTENDED] } } } },
      select: { whatsappInviteUrl: true },
    });
    if (!event?.whatsappInviteUrl) throw new ApiRequestError("Link WhatsApp hanya tersedia untuk peserta terdaftar.", 403, "WHATSAPP_UNAVAILABLE");
    return NextResponse.json({ success: true, url: event.whatsappInviteUrl });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
