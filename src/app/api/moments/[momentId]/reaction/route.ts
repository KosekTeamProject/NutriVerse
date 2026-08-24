import { MomentLikerListVisibility, NotificationType, PostReactionType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { visibleMomentWhere } from "@/server/community/moment-access";
import { createUserNotification } from "@/server/notifications/notification-service";

type RouteContext = { params: Promise<{ momentId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { momentId } = await context.params;
    const moment = await prisma.moment.findFirst({
      where: visibleMomentWhere(user.id, momentId),
      select: { id: true, userId: true, likerListVisibility: true },
    });
    if (!moment) return NextResponse.json({ success: false, error: "Momen tidak ditemukan." }, { status: 404 });
    if (moment.userId !== user.id && moment.likerListVisibility === MomentLikerListVisibility.OWNER_ONLY) {
      return NextResponse.json({ success: false, error: "Daftar penyuka disembunyikan pemilik Momen." }, { status: 403 });
    }
    const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit")) || 30, 1), 50);
    const cursor = request.nextUrl.searchParams.get("cursor") || undefined;
    const rows = await prisma.momentReaction.findMany({
      where: { momentId },
      select: { id: true, createdAt: true, user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return NextResponse.json({ success: true, reactions: page, nextCursor: hasMore ? page.at(-1)?.id ?? null : null }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { momentId } = await context.params;
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const type = typeof body?.type === "string" && Object.values(PostReactionType).includes(body.type as PostReactionType)
      ? body.type as PostReactionType
      : PostReactionType.ENCOURAGE;
    const moment = await prisma.moment.findFirst({
      where: visibleMomentWhere(user.id, momentId),
      select: { id: true, userId: true, user: { select: { settings: { select: { notificationsMomentLikes: true } } } } },
    });
    if (!moment) return NextResponse.json({ success: false, error: "Momen tidak ditemukan." }, { status: 404 });
    const existing = await prisma.momentReaction.findUnique({ where: { momentId_userId: { momentId, userId: user.id } }, select: { id: true } });
    const reaction = await prisma.momentReaction.upsert({
      where: { momentId_userId: { momentId, userId: user.id } },
      create: { momentId, userId: user.id, type },
      update: { type },
    });
    if (!existing && moment.userId !== user.id && moment.user.settings?.notificationsMomentLikes !== false) {
      await createUserNotification({
        userId: moment.userId,
        type: NotificationType.SOCIAL,
        title: "Momenmu disukai",
        message: `${user.name} menyukai Momenmu.`,
        preferenceOverride: "notificationsMomentLikes",
        actionUrl: "/momen",
        dedupeKey: `moment-reaction:${moment.id}:${user.id}`,
      });
    }
    return NextResponse.json({ success: true, reaction });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const { momentId } = await context.params;
    const moment = await prisma.moment.findFirst({ where: visibleMomentWhere(user.id, momentId), select: { id: true } });
    if (!moment) return NextResponse.json({ success: false, error: "Momen tidak ditemukan." }, { status: 404 });
    await prisma.momentReaction.deleteMany({ where: { momentId, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
