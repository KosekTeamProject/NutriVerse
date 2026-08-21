import { EventCommentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiRequestError, apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ eventId: string; commentId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { eventId, commentId } = await context.params;
    if (!['ADMIN', 'MODERATOR'].includes(user.role)) throw new ApiRequestError("Akses moderator diperlukan.", 403, "FORBIDDEN");
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const action = body?.action;
    if (action !== "pin" && action !== "unpin" && action !== "hide") throw new ApiRequestError("Aksi moderasi tidak valid.");
    const result = await prisma.eventComment.updateMany({
      where: { id: commentId, eventId },
      data: action === "hide" ? { status: EventCommentStatus.HIDDEN, moderatedById: user.id, moderatedAt: new Date() } : { isPinned: action === "pin", moderatedById: user.id, moderatedAt: new Date() },
    });
    if (!result.count) throw new ApiRequestError("Komentar tidak ditemukan.", 404, "COMMENT_NOT_FOUND");
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { eventId, commentId } = await context.params;
    const result = await prisma.eventComment.updateMany({ where: { id: commentId, eventId, authorId: user.id }, data: { status: EventCommentStatus.HIDDEN, moderatedAt: new Date() } });
    if (!result.count) throw new ApiRequestError("Komentar tidak ditemukan.", 404, "COMMENT_NOT_FOUND");
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
