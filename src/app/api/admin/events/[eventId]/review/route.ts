import { CmsPublicationStatus, EventApprovalStatus, ExternalLinkStatus, NotificationType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiRequestError, apiErrorResponse, assertSameOrigin, stringValue } from "@/lib/api";
import { requireSystemAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUserNotification } from "@/server/notifications/notification-service";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const admin = await requireSystemAdmin();
    const { eventId } = await context.params;
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const action = body?.action;
    if (!["approve", "needs_revision", "reject", "approve_whatsapp", "disable_whatsapp"].includes(String(action))) {
      throw new ApiRequestError("Aksi review event tidak valid.");
    }
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new ApiRequestError("Event tidak ditemukan.", 404, "EVENT_NOT_FOUND");
    const note = body?.note === undefined ? null : stringValue(body.note, "Catatan review", { min: 3, max: 1_000 });
    const now = new Date();
    const data = action === "approve"
      ? { approvalStatus: EventApprovalStatus.APPROVED, status: CmsPublicationStatus.PUBLISHED, isActive: true, publishedAt: event.publishedAt ?? now, reviewNote: note, reviewedByUserId: admin.id, reviewedAt: now, whatsappLinkStatus: event.whatsappInviteUrl ? ExternalLinkStatus.APPROVED : ExternalLinkStatus.NONE }
      : action === "needs_revision"
        ? { approvalStatus: EventApprovalStatus.NEEDS_REVISION, status: CmsPublicationStatus.DRAFT, isActive: false, reviewNote: note, reviewedByUserId: admin.id, reviewedAt: now }
        : action === "reject"
          ? { approvalStatus: EventApprovalStatus.REJECTED, status: CmsPublicationStatus.ARCHIVED, isActive: false, reviewNote: note, reviewedByUserId: admin.id, reviewedAt: now, whatsappLinkStatus: event.whatsappInviteUrl ? ExternalLinkStatus.REJECTED : ExternalLinkStatus.NONE }
          : action === "approve_whatsapp"
            ? { whatsappLinkStatus: ExternalLinkStatus.APPROVED, reviewedByUserId: admin.id, reviewedAt: now }
            : { whatsappLinkStatus: ExternalLinkStatus.DISABLED, reviewedByUserId: admin.id, reviewedAt: now };
    const updated = await prisma.event.update({ where: { id: eventId }, data });
    await prisma.auditLog.create({ data: { actorUserId: admin.id, action: `REVIEW_EVENT_${String(action).toUpperCase()}`, entityName: "Event", entityId: event.id, beforeState: event, afterState: updated, reason: note } });
    if (event.createdByUserId) {
      await createUserNotification({
        userId: event.createdByUserId,
        type: NotificationType.EVENT,
        title: action === "approve" ? "Event disetujui" : action === "needs_revision" ? "Event perlu direvisi" : action === "reject" ? "Event ditolak" : "Informasi event diperbarui",
        message: note ?? `Status pengajuan ${event.title} telah diperbarui.`,
        actionUrl: `/komunitas/event/${event.id}`,
        dedupeKey: `event-review:${event.id}:${String(action)}`,
      });
    }
    return NextResponse.json({ success: true, event: updated });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
