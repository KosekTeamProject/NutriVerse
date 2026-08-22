import { ConnectionStatus, MomentCommentMode, NotificationType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, enforceRateLimit, stringValue } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { visibleMomentWhere } from "@/server/community/moment-access";
import { createUserNotification } from "@/server/notifications/notification-service";

type RouteContext = { params: Promise<{ momentId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { momentId } = await context.params;
    const moment = await prisma.moment.findFirst({ where: visibleMomentWhere(user.id, momentId), select: { id: true, userId: true, commentsMode: true } });
    if (!moment) return NextResponse.json({ success: false, error: "Momen tidak ditemukan." }, { status: 404 });
    const canModerate = moment.userId === user.id || user.role === "ADMIN" || user.role === "MODERATOR";
    if (moment.commentsMode === MomentCommentMode.OFF && !canModerate) {
      return NextResponse.json({ success: true, comments: [], commentsEnabled: false, canModerate: false }, { headers: { "Cache-Control": "private, no-store" } });
    }
    const comments = await prisma.momentComment.findMany({
      where: { momentId, isHidden: false },
      select: { id: true, content: true, createdAt: true, userId: true, user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 100,
    });
    return NextResponse.json({ success: true, comments: comments.map((comment) => ({ ...comment, canDelete: comment.userId === user.id || canModerate })), commentsEnabled: moment.commentsMode !== MomentCommentMode.OFF, canModerate }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "moment:comment", 30, 60_000);
    const user = await requireCurrentUser();
    const { momentId } = await context.params;
    const moment = await prisma.moment.findFirst({ where: visibleMomentWhere(user.id, momentId), select: { id: true, userId: true, commentsMode: true, user: { select: { name: true, settings: { select: { momentHiddenWords: true, notificationsMomentComments: true } } } } } });
    if (!moment) return NextResponse.json({ success: false, error: "Momen tidak ditemukan." }, { status: 404 });
    if (moment.commentsMode === MomentCommentMode.OFF) return NextResponse.json({ success: false, error: "Komentar dinonaktifkan oleh pemilik Momen." }, { status: 403 });
    if (moment.commentsMode === MomentCommentMode.FRIENDS_ONLY && moment.userId !== user.id) {
      const friendship = await prisma.userConnection.findFirst({
        where: { status: ConnectionStatus.ACCEPTED, OR: [{ requesterId: user.id, addresseeId: moment.userId }, { requesterId: moment.userId, addresseeId: user.id }] },
        select: { id: true },
      });
      if (!friendship) return NextResponse.json({ success: false, error: "Komentar pada Momen ini hanya untuk teman." }, { status: 403 });
    }
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const content = stringValue(body?.content, "Komentar", { min: 1, max: 500 });
    const normalizedContent = content.toLowerCase();
    const moderated = (moment.user.settings?.momentHiddenWords ?? []).some((word) => normalizedContent.includes(word));
    const comment = await prisma.momentComment.create({
      data: { momentId, userId: user.id, content, isHidden: moderated },
      select: { id: true, content: true, createdAt: true, userId: true, user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
    });
    if (!moderated && moment.userId !== user.id && moment.user.settings?.notificationsMomentComments !== false) {
      await createUserNotification({ userId: moment.userId, type: NotificationType.SOCIAL, title: "Komentar baru di Momen", message: `${user.name} mengomentari Momenmu.`, preferenceOverride: "notificationsMomentComments" });
    }
    return NextResponse.json({ success: true, comment: moderated ? null : { ...comment, canDelete: true }, moderated, message: moderated ? "Komentar disimpan untuk ditinjau pemilik Momen." : undefined }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
