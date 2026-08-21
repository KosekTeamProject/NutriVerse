import { NextRequest, NextResponse } from "next/server";
import { ApiRequestError, apiErrorResponse, assertSameOrigin, stringValue } from "@/lib/api";
import { requireSystemAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COMMUNITY_APPROVAL } from "@/server/community/community-constants";

type RouteContext = { params: Promise<{ communityId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const admin = await requireSystemAdmin();
    const { communityId } = await context.params;
    const body = (await request.json().catch(() => null)) as { action?: unknown; note?: unknown } | null;
    const action = body?.action;
    if (!["approve", "needs_revision", "reject"].includes(String(action))) throw new ApiRequestError("Aksi review tidak valid.");
    const note = action === "approve" ? "Komunitas telah diperiksa dan disetujui." : stringValue(body?.note, "Catatan review", { min: 3, max: 500 });
    const community = await prisma.guild.findUnique({ where: { id: communityId } });
    if (!community) throw new ApiRequestError("Komunitas tidak ditemukan.", 404);
    const approvalStatus = action === "approve" ? COMMUNITY_APPROVAL.APPROVED : action === "needs_revision" ? COMMUNITY_APPROVAL.NEEDS_REVISION : COMMUNITY_APPROVAL.REJECTED;
    const updated = await prisma.$transaction(async (transaction) => {
      const result = await transaction.guild.update({
        where: { id: community.id },
        data: { approvalStatus, reviewNote: note, reviewedByUserId: admin.id, reviewedAt: new Date(), approvedAt: action === "approve" ? new Date() : community.approvedAt, isActive: action === "approve" },
      });
      if (community.leaderId) await transaction.userNotification.create({ data: { userId: community.leaderId, type: "EVENT", title: `Pengajuan komunitas ${approvalStatus === COMMUNITY_APPROVAL.APPROVED ? "disetujui" : approvalStatus === COMMUNITY_APPROVAL.NEEDS_REVISION ? "perlu revisi" : "ditolak"}`, message: `${community.name}: ${note}` } });
      await transaction.auditLog.create({ data: { actorUserId: admin.id, action: `REVIEW_COMMUNITY_${String(action).toUpperCase()}`, entityName: "Guild", entityId: community.id, beforeState: community, afterState: result, reason: note } });
      return result;
    });
    return NextResponse.json({ success: true, community: updated });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
