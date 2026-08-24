import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { archiveEligibleUserNotifications } from "@/server/notifications/notification-service";

function requestedLimit(request: NextRequest) {
  const parsed = Number(request.nextUrl.searchParams.get("limit") ?? "50");
  return Number.isFinite(parsed)
    ? Math.min(50, Math.max(1, Math.trunc(parsed)))
    : 50;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    await archiveEligibleUserNotifications(user.id);

    const scope = request.nextUrl.searchParams.get("scope") === "history"
      ? "history"
      : "active";
    const cursor = request.nextUrl.searchParams.get("cursor")?.trim() || null;
    const limit = requestedLimit(request);
    const where: Prisma.UserNotificationWhereInput = {
      userId: user.id,
      archivedAt: scope === "history" ? { not: null } : null,
    };
    const [notificationRows, totalCount, unreadCount] = await prisma.$transaction([
      prisma.userNotification.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
      }),
      prisma.userNotification.count({ where }),
      prisma.userNotification.count({
        where: { userId: user.id, archivedAt: null, isRead: false },
      }),
    ]);
    const hasMore = notificationRows.length > limit;
    const notifications = hasMore
      ? notificationRows.slice(0, limit)
      : notificationRows;

    return NextResponse.json({
      success: true,
      scope,
      notifications,
      totalCount,
      unreadCount,
      nextCursor: hasMore ? notifications.at(-1)?.id ?? null : null,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const now = new Date();
    const result = await prisma.userNotification.updateMany({
      where: { userId: user.id, archivedAt: null, isRead: false },
      data: { isRead: true, readAt: now },
    });
    return NextResponse.json({ success: true, updatedCount: result.count });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
