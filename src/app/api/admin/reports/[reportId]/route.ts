import { ReportStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, stringValue } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ reportId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdminUser();
    const { reportId } = await context.params;
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const status =
      typeof body?.status === "string" && Object.values(ReportStatus).includes(body.status as ReportStatus)
        ? (body.status as ReportStatus)
        : null;
    if (!status || status === ReportStatus.PENDING) {
      return NextResponse.json({ success: false, error: "Status review tidak valid." }, { status: 400 });
    }
    const reason = stringValue(body?.reason, "Catatan moderator", { min: 3, max: 500 });
    const existing = await prisma.contentReport.findUnique({ where: { id: reportId } });
    if (!existing) return NextResponse.json({ success: false, error: "Laporan tidak ditemukan." }, { status: 404 });
    const report = await prisma.$transaction(async (transaction) => {
      if (status === ReportStatus.ACTIONED) {
        if (existing.postId) await transaction.post.update({ where: { id: existing.postId }, data: { isHidden: true } });
        if (existing.commentId) await transaction.postComment.update({ where: { id: existing.commentId }, data: { isHidden: true } });
        if (existing.momentId) {
          await transaction.moment.update({
            where: { id: existing.momentId },
            data: { isHidden: true },
          });
        }
      }
      const updated = await transaction.contentReport.update({
        where: { id: reportId },
        data: { status, handledByAdmin: admin.id },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: "REVIEW_CONTENT_REPORT",
          entityName: "ContentReport",
          entityId: reportId,
          beforeState: { status: existing.status },
          afterState: { status },
          reason,
        },
      });
      return updated;
    });
    return NextResponse.json({ success: true, report });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
